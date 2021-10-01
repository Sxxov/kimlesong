import type { SlashCommandBuilder } from '@discordjs/builders';
import type {
	Guild,
	Message,
	MessageEmbed,
	TextBasedChannels,
} from 'discord.js';
import { ClientSingleton } from '../../../client/ClientSingleton.js';
import type { SyncQueueItem } from '../../../queue/SyncQueueItem.js';
import { QueueManager } from '../../../queue/QueueManager.js';
import { Constants } from '../../../resources/enums/Constants.js';
import { EmbedErrorCodes } from '../../../resources/enums/EmbedErrorCodes.js';
import { ClientError } from '../../../resources/errors/ClientError.js';
import { State } from '../../../state/State.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { CommandManagerSingleton } from '../../CommandManagerSingleton.js';
import { AbstractGlobalCommand } from '../AbstractGlobalCommand.js';
import { NowCommand } from '../voice/NowCommand.js';
import type { AsyncQueueItem } from '../../../queue/AsyncQueueItem.js';
import type { VoiceChannelState } from '../../../voice/VoiceChannelState.js';
import { IllegalStateError } from '../../../resources/errors/IllegalStateError.js';
import { PlayEventNames } from '../../../voice/event/names/PlayEventNames.js';

export class PlayCommand extends AbstractGlobalCommand {
	public static override id = 'play';
	public static override description =
		'plays the requested song/playlist/album from youtube/spotify/youtube music.';

	public static override aliases = ['p'];

	private lastNows: NowCommand[] = [];
	private lastNowMessages: Message[] = [];
	private lastQueueItem: AsyncQueueItem | SyncQueueItem | null = null;

	public static override getSlashCommand(): SlashCommandBuilder {
		return super
			.getSlashCommand()
			.addStringOption((option) =>
				option
					.setName(Constants.SLASH_ARGUMENT_NAME)
					.setDescription('The URL/search term to play from Youtube')
					.setRequired(true),
			) as SlashCommandBuilder;
	}

	public override async getEmbeds(
		info: CommandBlueprint,
	): Promise<MessageEmbed[]> {
		try {
			const guild = ClientSingleton.client.guilds.cache.get(
				info.guildId!,
			);
			const user = guild?.members.cache.get(info.userId!);

			if (guild == null || user == null)
				return [this.Class.errorInternal()];

			const voiceChannel = user.voice.channel;

			if (voiceChannel == null)
				return [
					this.Class.errorUser(EmbedErrorCodes.CHANNEL_NOT_CONNECTED),
				];
			if (voiceChannel.type !== 'GUILD_VOICE')
				return [
					this.Class.errorUser(EmbedErrorCodes.CHANNEL_NOT_SUPPORTED),
				];

			const voiceChannelId = voiceChannel.id;

			const permissions = voiceChannel.permissionsFor(user);

			if (
				!voiceChannel.joinable
				|| !permissions.has('CONNECT')
				|| !permissions.has('SPEAK')
			)
				return [
					this.Class.errorUser(EmbedErrorCodes.COMMAND_NO_PERMISSION),
				];

			let voiceChannelState = State.guildIdToVoiceChannel.get(guild.id)!;

			if (voiceChannelState == null) {
				voiceChannelState =
					ClientSingleton.voiceChannelStateFactory.create(
						voiceChannelId,
					);
				State.guildIdToVoiceChannel.set(
					voiceChannelState.guildId,
					voiceChannelState,
				);
				this.registerPlayOnQueue(guild, info, voiceChannelState);
			}

			if (voiceChannelId !== voiceChannelState.id) {
				return [
					this.Class.errorUser(EmbedErrorCodes.IS_ALREADY_PLAYING),
				];
			}

			const queuedItems = await new QueueManager(
				voiceChannelState,
			).pushQueueFromSearch(info.argument);

			if (queuedItems.length <= 0) {
				return [this.Class.errorUser(EmbedErrorCodes.SONG_NOT_FOUND)];
			}

			const embeds = [];

			if (queuedItems.unfilteredLength >= 100) {
				embeds.push(
					(
						await super.getEmbed(
							undefined as unknown as CommandBlueprint,
						)
					)
						.setTitle('oh a large playlist!')
						.setDescription(
							'not all items are added at once. they will be added as the first few songs play, feel free to view the progress in the queue.',
						),
				);
			}

			const first = queuedItems.shift()!;
			const rest = queuedItems;

			embeds.push(
				(await super.getEmbed(info)).setDescription(
					`${await first.toMarkdown()}${
						rest.length > 0 ? `\n\n+ ${rest.length} more` : ''
					}`,
				),
			);

			return embeds;
		} catch (err: unknown) {
			if (err instanceof ClientError) {
				return [
					(await super.getEmbed(info))
						.setTitle(Constants.EMBED_TITLE_ERROR_USER)
						.setDescription(err.message),
				];
			}

			throw err;
		}
	}

	private registerPlayOnQueue(
		guild: Guild,
		info: CommandBlueprint,
		state: VoiceChannelState,
	) {
		let lock = false;
		let isRetriggering = false;
		const unsubscribe = state.queue.subscribeLazy(async (queue) => {
			if (lock) {
				isRetriggering = true;

				return;
			}

			lock = true;

			const currentQueueItemUrl =
				(queue[0] as AsyncQueueItem)?.externalUrl
				?? (await queue[0]?.url);
			const lastQueueItemUrl =
				(this.lastQueueItem as AsyncQueueItem)?.externalUrl
				?? (await this.lastQueueItem?.url);

			if (lastQueueItemUrl === currentQueueItemUrl) {
				lock = false;
				isRetriggering = false;

				return;
			}

			if (queue.length <= 0) {
				State.guildIdToVoiceChannel.delete(state.guildId);
				unsubscribe();

				try {
					guild.members.cache
						.get(state.client.user?.id ?? '')
						?.setNickname(Constants.DEFAULT_NICKNAME);
				} catch {}

				await state.voiceManager.stop();

				lock = false;
				isRetriggering = false;

				return;
			}

			const queueItemString = `💽 ${queue[0].getSimpleTitle()}`;
			try {
				guild.members.cache
					.get(state.client.user?.id ?? '')
					?.setNickname(
						queueItemString.length >= 32
							? `${queueItemString.substr(0, 31)}…`
							: queueItemString,
					);
			} catch {}

			this.lastQueueItem = queue[0];

			await this.playShiftQueue(info, state);
			await this.refreshNowCommand(queue, info, state);

			lock = false;

			if (isRetriggering) {
				isRetriggering = false;
				state.queue.trigger();
			}
		});
	}

	private async sendNowCommand(
		info: CommandBlueprint,
		state: VoiceChannelState,
	) {
		const guild = state.client.guilds.cache.get(info.guildId!);
		const channel = guild?.channels.cache.get(
			info.channelId ?? '',
		) as TextBasedChannels;

		const now = new NowCommand(state);
		const nowReply = await now.getReply(info);
		const nowMessage = await channel.send(nowReply);

		CommandManagerSingleton.commandInstanceIdToInstanceCache.set(
			now.instanceId,
			now,
		);

		this.lastNows.push(now);
		this.lastNowMessages.push(nowMessage);
	}

	private async refreshNowCommand(
		queue: (AsyncQueueItem | SyncQueueItem)[],
		info: CommandBlueprint,
		state: VoiceChannelState,
	) {
		const guild = state.client.guilds.cache.get(info.guildId!);
		const channel = guild?.channels.cache.get(
			info.channelId ?? '',
		) as TextBasedChannels;

		if (guild == null || channel == null)
			throw new IllegalStateError(
				'attempted to print now in nullish channel',
			);

		if (queue.length <= 0) {
			state.voiceManager.interrupt();

			this.lastNowMessages.forEach(async (lastNowMessage, i) => {
				try {
					await lastNowMessage?.delete();

					this.lastNowMessages.splice(i, 1);
				} catch {}

				const lastNow = this.lastNows.shift();

				CommandManagerSingleton.commandInstanceIdToInstanceCache.delete(
					Number(lastNow?.instanceId),
				);
			});

			return;
		}

		while (this.lastNowMessages.length !== 1) {
			if (this.lastNowMessages.length < 1) {
				await this.sendNowCommand(info, state);

				return;
			}

			if (this.lastNowMessages.length > 1) {
				const lastNowMessage = this.lastNowMessages.shift();
				const lastNow = this.lastNows.shift();
				const url =
					(queue[0] as AsyncQueueItem)?.externalUrl
					?? (await queue[0]?.url);

				if (lastNowMessage?.embeds[0].description?.includes(url)) {
					// add to the end so it'll continue & use this msg
					this.lastNowMessages.push(lastNowMessage);
					this.lastNows.push(lastNow!);

					continue;
				}

				try {
					await lastNowMessage?.delete();

					CommandManagerSingleton.commandInstanceIdToInstanceCache.delete(
						Number(lastNow?.instanceId),
					);
				} catch {}
			}
		}

		if (channel.lastMessageId === this.lastNowMessages[0].id) {
			await this.lastNowMessages[0].edit(
				await this.lastNows[0]!.getReply(info),
			);
		} else {
			await this.lastNowMessages[0]?.delete();

			CommandManagerSingleton.commandInstanceIdToInstanceCache.delete(
				Number(this.lastNows[0]?.instanceId),
			);

			await this.sendNowCommand(info, state);
		}
	}

	private async playShiftQueue(
		info: CommandBlueprint,
		state: VoiceChannelState,
	) {
		let resolvePlayShiftQueue: () => void;
		const promise = new Promise<void>((resolve) => {
			resolvePlayShiftQueue = resolve;
		});
		const execute = async () => {
			let resetPlayFailureCountHandle: ReturnType<
				typeof setTimeout
			> | null = null;
			const lastError: [Error | null] = [null];

			for (
				let playFailureCount = 0, l = 3;
				playFailureCount < l;
				++playFailureCount
			) {
				if (state.voiceManager.isPlaying)
					state.voiceManager.interrupt();
				const play = state.voiceManager.play(state.queue.value[0]);

				// resolved is only assigned once
				// eslint-disable-next-line @typescript-eslint/no-loop-func
				play.once(PlayEventNames.START, () => {
					resolvePlayShiftQueue();

					if (state.queue[1])
						void state.voiceManager.preload(state.queue[1]);
				});

				const isRetrying = await new Promise<boolean>((resolve) => {
					play.once(PlayEventNames.INTERRUPT, () => {
						resolve(false);
					});
					play.once(PlayEventNames.END, () => {
						const played = state.queue.shift();

						if (played) state.previousQueue.push(played);

						resolve(false);
					});
					play.once(PlayEventNames.ERROR, (err) => {
						if (err instanceof ClientError) {
							lastError[0] = err;

							resolve(true);
						} else {
							throw err;
						}
					});
				}).finally(() => {
					play.removeAllListeners();
				});

				if (!isRetrying) {
					return;
				}

				clearTimeout(resetPlayFailureCountHandle!);

				resetPlayFailureCountHandle = setTimeout(() => {
					playFailureCount = 0;
				}, 10_000);
			}

			await info.reply({
				embeds: [
					(await super.getEmbed(info))
						.setTitle(Constants.EMBED_TITLE_ERROR_INTERNAL)
						.setDescription(
							lastError[0]?.message
								?? 'lol if u see this not even i know what went wrong',
						),
				],
			});

			await state.voiceManager.stop();

			const played = state.queue.shift();

			if (played) state.previousQueue.push(played);
		};

		void execute();

		return promise;
	}
}
