import type { SlashCommandBuilder } from '@discordjs/builders';
import type { MessageEmbed } from 'discord.js';
import { ClientSingleton } from '../../../client/ClientSingleton.js';
import { QueueManager } from '../../../queue/QueueManager.js';
import { Constants } from '../../../resources/Constants.js';
import { ClientError } from '../../../resources/errors/ClientError.js';
import { State } from '../../../state/State.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { AbstractCommand } from '../AbstractCommand.js';
import { QueueCommand } from './QueueCommand.js';

export class PlayCommand extends AbstractCommand {
	public static override id = 'play';
	public static override description =
		'Plays the requested song/playlist from Youtube/Spotify';

	public static override aliases = ['p'];

	public async onAddLargePlaylist(): Promise<MessageEmbed> {
		return (await super.getEmbed(undefined as unknown as CommandBlueprint))
			.setTitle('oh a large playlist!')
			.setDescription(
				'not all items are added at once. they will be added as the first few songs play, feel free to view the progress in the queue.',
			);
	}

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

	public override async getEmbed(
		info: CommandBlueprint,
	): Promise<MessageEmbed> {
		const queue = State.guildIdToQueue.get(info.guildId!);

		if (queue == null) return PlayCommand.errorInternal();

		try {
			const [first, ...rest] = await new QueueManager(
				info.guildId!,
				ClientSingleton.ytm,
			).appendQueueFromSearch(info.argument);

			return (await super.getEmbed(info)).setDescription(
				`${QueueCommand.stringifyQueueItem(first)}${
					rest.length > 0 ? `\n\n+ ${rest.length} more` : ''
				}`,
			);
		} catch (err: unknown) {
			if (err instanceof ClientError) {
				return (await super.getEmbed(info))
					.setTitle(Constants.EMBED_TITLE_ERROR_USER)
					.setDescription(err.message);
			}

			throw err;
		}
	}
}
