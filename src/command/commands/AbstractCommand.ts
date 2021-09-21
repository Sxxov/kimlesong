import { SlashCommandBuilder } from '@discordjs/builders';
import { ButtonInteraction, MessageActionRow, MessageEmbed } from 'discord.js';
import { Log } from '../../log/Log.js';
import { Constants } from '../../resources/Constants.js';
import { ClientError } from '../../resources/errors/ClientError.js';
import type { CommandBlueprint } from '../CommandBlueprint.js';

export abstract class AbstractCommand {
	protected static EMBED_ERROR_500 = new MessageEmbed()
		.setColor(Constants.EMBED_COLOUR)
		.setAuthor(
			Constants.EMBED_AUTHOR_NAME,
			Constants.EMBED_AUTHOR_IMAGE,
			Constants.EMBED_AUTHOR_URL,
		)
		.setTitle(Constants.EMBED_TITLE_ERROR_INTERNAL)
		.setDescription(
			"something went wrong, the server room caught fire; it's (probably) not your fault.",
		);

	public static EMBED_ERROR_404 = new MessageEmbed()
		.setColor(Constants.EMBED_COLOUR)
		.setAuthor(
			Constants.EMBED_AUTHOR_NAME,
			Constants.EMBED_AUTHOR_IMAGE,
			Constants.EMBED_AUTHOR_URL,
		)
		.setTitle(Constants.EMBED_TITLE_ERROR_USER)
		.setDescription("that command doesn't seem to exist, try `!help`");

	public static EMBED_ERROR_400 = new MessageEmbed()
		.setColor(Constants.EMBED_COLOUR)
		.setAuthor(
			Constants.EMBED_AUTHOR_NAME,
			Constants.EMBED_AUTHOR_IMAGE,
			Constants.EMBED_AUTHOR_URL,
		)
		.setTitle(Constants.EMBED_TITLE_ERROR_USER)
		.setDescription("that command doesn't look right lol, try again");

	public abstract name: string;
	public abstract description: string;
	public abstract aliases: string[];
	public actionIds: string[] = [];

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async reply(info: CommandBlueprint) {
		return new MessageEmbed()
			.setColor(Constants.EMBED_COLOUR)
			.setAuthor(
				Constants.EMBED_AUTHOR_NAME,
				Constants.EMBED_AUTHOR_IMAGE,
				Constants.EMBED_AUTHOR_URL,
			)
			.setTitle(this.name);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async act(info: ButtonInteraction) {}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async action(info: CommandBlueprint) {
		return new MessageActionRow();
	}

	public build(): SlashCommandBuilder {
		return new SlashCommandBuilder()
			.setName(this.name)
			.setDescription(this.description);
	}

	protected errorInternal() {
		Log.error(
			new ClientError(
				'Encountered an internal error while trying to reply',
			).stack,
		);

		return AbstractCommand.EMBED_ERROR_500;
	}
}
