import type { SlashCommandBuilder } from '@discordjs/builders';
import type { Message, MessageEmbed, TextBasedChannels } from 'discord.js';
import { ClientSingleton } from '../../../client/ClientSingleton.js';
import type { QueueItem } from '../../../queue/QueueItem.js';
import { QueueManager } from '../../../queue/QueueManager.js';
import { Constants } from '../../../resources/Constants.js';
import { ClientError } from '../../../resources/errors/ClientError.js';
import { State } from '../../../state/State.js';
import { VoiceManager } from '../../../voice/VoiceManager.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { AbstractGlobalCommand } from '../AbstractGlobalCommand.js';
import { NowCommand } from '../voice/NowCommand.js';

export class PlayCommand extends AbstractGlobalCommand {
	public static override id = 'play';
	public static override description =
		'Plays the requested song/playlist from Youtube/Spotify';

	public static override aliases = ['p'];

	// TODO(sxxov): fix undefined behaviour when bot is summoned to another channel
	// make it so that only people inside the vc can interact with the bot
	// eg. when kls is in channel A, & someone joins channel B thn summons kls,
	// kls 1 will verify that command is coming from a user that's in a different vc & ignore & mark it is "WILL_NOT_HANDLE"
	// kls 2 will be free & handle that command & mark it as "HANDLED"
	// kls 3 will see that the command is handled & ignore

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

			if (voiceChannel == null) return [this.Class.errorUser(420)];
			if (voiceChannel.type !== 'GUILD_VOICE')
				return [this.Class.errorUser(406)];

			const voiceChannelId = voiceChannel.id;

			// TODO(sxxov): BUG: disconnecting doesn't clear vcstate from state
			// TODO(sxxov): BUG: failing to play a song won't join but will still register a state, blocking the bot from joining any other servers
			// TODO(sxxov): this impl will only allow 1 channels for ALL guilds
			// TODO(sxxov): this is a temp fix for the vc state
			if (State.voiceChannels.length >= 1) {
				return [this.Class.errorUser(423)];
			}

			const permissions = voiceChannel.permissionsFor(user);

			if (
				!voiceChannel.joinable
				|| !permissions.has('CONNECT')
				|| !permissions.has('SPEAK')
			)
				return [this.Class.errorUser(403)];

			const voiceChannelState =
				ClientSingleton.voiceChannelStateFactory.create(voiceChannelId);
			State.voiceChannels.push(voiceChannelState);
			const lastNows: Message[] = [];
			let lastQueueItem: QueueItem;
			const unsubscribe = voiceChannelState.queue.subscribeLazy(
				async (queue) => {
					if (queue[0]?.url === lastQueueItem?.url) return;

					let lastNow: Message | undefined;
					let skipNow = false;

					while ((lastNow = lastNows.shift())) {
						if (
							lastNow?.embeds[0].description?.includes(
								queue[0]?.url,
							)
						) {
							skipNow = true;
							continue;
						}

						try {
							await lastNow?.delete();
						} catch {}

						await new Promise((resolve) => {
							setTimeout(resolve, 1000);
						});
					}

					if (skipNow) return;

					if (queue.length <= 0) {
						State.voiceChannels.remove(voiceChannelState);
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

					lastNows.push(
						await (
							guild.channels.cache.get(
								info.channelId ?? '',
							) as TextBasedChannels
						).send({
							embeds: [
								await new NowCommand(
									voiceChannelState,
								).getEmbed(info),
							],
						}),
					);

					lastQueueItem = queue[0];
				},
			);

			const queuedItems = await new QueueManager(
				voiceChannelState,
			).appendQueueFromSearch(info.argument);

			if (queuedItems.length <= 0) {
				return [this.Class.errorUser(404)];
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

			void new VoiceManager(voiceChannel, voiceChannelState)
				.playQueue()
				.catch(async (err) => {
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
