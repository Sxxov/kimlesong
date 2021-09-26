import type { SlashCommandBuilder } from '@discordjs/builders';
import type { Message, MessageEmbed, TextBasedChannels } from 'discord.js';
import { ClientSingleton } from '../../../client/ClientSingleton.js';
import type { QueueItem } from '../../../queue/QueueItem.js';
import { QueueManager } from '../../../queue/QueueManager.js';
import { Constants } from '../../../resources/enums/Constants.js';
import { EmbedErrorCodes } from '../../../resources/enums/EmbedErrorCodes.js';
import { ClientError } from '../../../resources/errors/ClientError.js';
import { State } from '../../../state/State.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { CommandManagerSingleton } from '../../CommandManagerSingleton.js';
import { AbstractGlobalCommand } from '../AbstractGlobalCommand.js';
import { NowCommand } from '../voice/NowCommand.js';

export class PlayCommand extends AbstractGlobalCommand {
	public static override id = 'play';
	public static override description =
		'Plays the requested song/playlist from Youtube/Spotify';

	public static override aliases = ['p'];

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
			}

			const lastNows: NowCommand[] = [];
			const lastNowMessages: Message[] = [];
			let lastQueueItem: QueueItem;
			const unsubscribe = voiceChannelState.queue.subscribeLazy(
				async (queue) => {
					if (queue[0]?.url === lastQueueItem?.url) return;

					let lastNowMessage: Message | undefined;
					let skipNow = false;

					while ((lastNowMessage = lastNowMessages.shift())) {
						if (
							lastNowMessage?.embeds[0].description?.includes(
								queue[0]?.url,
							)
						) {
							skipNow = true;
							continue;
						}

						try {
							await lastNowMessage?.delete();

							const lastNow = lastNows.shift();

							CommandManagerSingleton.commandInstanceIdToInstanceCache.delete(
								Number(lastNow?.instanceId),
							);
						} catch {}

						await new Promise((resolve) => {
							setTimeout(resolve, 1000);
						});
					}

					if (skipNow) return;

					if (queue.length <= 0) {
						State.guildIdToVoiceChannel.delete(
							voiceChannelState.guildId,
						);
						unsubscribe();

						try {
							guild.members.cache
								.get(ClientSingleton.client.user?.id ?? '')
								?.setNickname(Constants.DEFAULT_NICKNAME);
						} catch {}

						return;
					}

					const queueItemString = `💽 ${queue[0].getSimpleTitle()}`;
					try {
						guild.members.cache
							.get(ClientSingleton.client.user?.id ?? '')
							?.setNickname(
								queueItemString.length >= 32
									? `${queueItemString.substr(0, 31)}…`
									: queueItemString,
							);
					} catch {}

					const now = new NowCommand(voiceChannelState);
					const nowReply = await now.getReply(info);
					const nowMessage = await (
						guild.channels.cache.get(
							info.channelId ?? '',
						) as TextBasedChannels
					).send(nowReply);
					CommandManagerSingleton.commandInstanceIdToInstanceCache.set(
						now.instanceId,
						now,
					);

					lastNows.push(now);
					lastNowMessages.push(nowMessage);

					lastQueueItem = queue[0];
				},
			);

			const queuedItems = await new QueueManager(
				voiceChannelState,
			).appendQueueFromSearch(info.argument);

			if (queuedItems.length <= 0) {
				return [this.Class.errorUser(EmbedErrorCodes.SONG_NOT_FOUND)];
			}

			const embeds = [];

			if (queuedItems.length >= 100) {
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
					`${first.toMarkdown()}${
						rest.length > 0 ? `\n\n+ ${rest.length} more` : ''
					}`,
				),
			);

			voiceChannelState.voiceManager.playQueue().catch(async (err) => {
				if (err instanceof ClientError) {
					await info.reply({
						embeds: [
							(await super.getEmbed(info))
								.setTitle(Constants.EMBED_TITLE_ERROR_USER)
								.setDescription(err.message),
						],
					});

					return;
				}

				throw err;
			});

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
}
