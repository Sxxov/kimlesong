import type { SlashCommandBuilder } from '@discordjs/builders';
import type { MessageEmbed } from 'discord.js';
import { ClientSingleton } from '../../client/ClientSingleton.js';
import { QueueManager } from '../../queue/QueueManager.js';
import { Constants } from '../../resources/Constants.js';
import { ClientError } from '../../resources/errors/ClientError.js';
import { State } from '../../state/StateManager.js';
import type { CommandBlueprint } from '../CommandBlueprint.js';
import { AbstractCommand } from './AbstractCommand.js';
import { QueueCommand } from './QueueCommand.js';

export class PlayCommand extends AbstractCommand {
	public name = 'play';
	public description =
		'Plays the requested song/playlist from Youtube/Spotify';

	public aliases = ['p'];

	public async onAddLargePlaylist(): Promise<MessageEmbed> {
		return (await super.reply(undefined as unknown as CommandBlueprint))
			.setTitle('oh a large playlist!')
			.setDescription(
				'not all items are added at once. they will be added as the first few songs play, feel free to view the progress in the queue.',
			);
	}

	public override build(): SlashCommandBuilder {
		return super
			.build()
			.addStringOption((option) =>
				option
					.setName(Constants.SLASH_ARGUMENT_NAME)
					.setDescription('The URL/search term to play from Youtube')
					.setRequired(true),
			) as SlashCommandBuilder;
	}

	public override async reply(info: CommandBlueprint): Promise<MessageEmbed> {
		const queue = State.guildIdToQueue.get(info.guildId!);

		if (queue == null) return this.errorInternal();

		const voiceChannel = ClientSingleton.client.guilds.cache
			.get(info.guildId!)
			?.members.cache.get(info.userId!)?.voice.channel;

		if (voiceChannel == null)
			return (await super.reply(info))
				.setTitle(Constants.EMBED_TITLE_ERROR_USER)
				.setDescription(
					"you don't seem to be in a voice channel, try again.",
				);

		try {
			const [first, ...rest] = await new QueueManager(
				info.guildId!,
				ClientSingleton.ytm,
			).appendQueueFromSearch(info.argument);

			return (await super.reply(info)).setDescription(
				`${QueueCommand.stringifyQueueItem(first)}${
					rest.length > 0 ? `\n\n+ ${rest.length} more` : ''
				}`,
			);
		} catch (err: unknown) {
			if (err instanceof ClientError) {
				return (await super.reply(info))
					.setTitle(Constants.EMBED_TITLE_ERROR_USER)
					.setDescription(err.message);
			}

			throw err;
		}
	}
}
