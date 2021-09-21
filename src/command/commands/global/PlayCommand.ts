import type { SlashCommandBuilder } from '@discordjs/builders';
import type { MessageEmbed } from 'discord.js';
import { ClientSingleton } from '../../../client/ClientSingleton.js';
import { QueueManager } from '../../../queue/QueueManager.js';
import { Constants } from '../../../resources/Constants.js';
import { ClientError } from '../../../resources/errors/ClientError.js';
import { State } from '../../../state/State.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { AbstractGlobalCommand } from '../AbstractGlobalCommand.js';

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
			const voiceChannelId = ClientSingleton.client.guilds.cache
				.get(info.guildId!)
				?.members.cache.get(info.userId!)?.voice.channelId;

			if (voiceChannelId == null) return [this.Class.errorInternal()];

			const voiceChannelState =
				ClientSingleton.voiceChannelStateFactory.create(voiceChannelId);
			State.voiceChannels.push(voiceChannelState);

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
