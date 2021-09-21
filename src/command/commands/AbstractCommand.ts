import { SlashCommandBuilder } from '@discordjs/builders';
import { ButtonInteraction, MessageActionRow, MessageEmbed } from 'discord.js';
import { Log } from '../../log/Log.js';
import { Constants } from '../../resources/Constants.js';
import { ClientError } from '../../resources/errors/ClientError.js';
import type { CommandBlueprint } from '../CommandBlueprint.js';

export abstract class AbstractCommand {
	// #region error constants
	private static EMBED_ERROR_500 = new MessageEmbed()
		.setColor(Constants.EMBED_COLOUR)
		.setAuthor(
			this.getAuthorName(),
			this.getAuthorImage(),
			Constants.EMBED_AUTHOR_URL,
		)
		.setTitle(Constants.EMBED_TITLE_ERROR_INTERNAL)
		.setDescription(
			"something went wrong, the server room caught fire; it's (probably) not your fault.",
		);

	private static EMBED_ERROR_404 = new MessageEmbed()
		.setColor(Constants.EMBED_COLOUR)
		.setAuthor(
			this.getAuthorName(),
			this.getAuthorImage(),
			Constants.EMBED_AUTHOR_URL,
		)
		.setTitle(Constants.EMBED_TITLE_ERROR_USER)
		.setDescription("that command doesn't seem to exist, try `!help`.");

	private static EMBED_ERROR_400 = new MessageEmbed()
		.setColor(Constants.EMBED_COLOUR)
		.setAuthor(
			this.getAuthorName(),
			this.getAuthorImage(),
			Constants.EMBED_AUTHOR_URL,
		)
		.setTitle(Constants.EMBED_TITLE_ERROR_USER)
		.setDescription("that command doesn't look right lol, try again.");

	private static EMBED_ERROR_420 = new MessageEmbed()
		.setColor(Constants.EMBED_COLOUR)
		.setAuthor(
			this.getAuthorName(),
			this.getAuthorImage(),
			Constants.EMBED_AUTHOR_URL,
		)
		.setTitle(Constants.EMBED_TITLE_ERROR_USER)
		.setDescription("you don't seem to be in a voice channel, try again.");

	// #endregion

	public static id: string;
	public static description: string;
	public static aliases: string[] = [];
	public static actionIds: string[] = [];

	public Class = this.constructor as typeof AbstractCommand;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async getEmbed(info: CommandBlueprint) {
		return new MessageEmbed()
			.setColor(Constants.EMBED_COLOUR)
			.setAuthor(
				this.Class.getAuthorName(),
				this.Class.getAuthorImage(),
				Constants.EMBED_AUTHOR_URL,
			)
			.setTitle(this.Class.id);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async act(info: ButtonInteraction) {}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async getAction(info: CommandBlueprint) {
		return new MessageActionRow();
	}

	public static getSlashCommand(): SlashCommandBuilder {
		return new SlashCommandBuilder()
			.setName(this.id)
			.setDescription(this.description);
	}

	protected static getAuthorImage(): string {
		return Constants.EMBED_AUTHOR_DEFAULT_IMAGE;
	}

	protected static getAuthorName() {
		return '\u200B';
	}

	public static errorUser(code: 400 | 404 | 420) {
		return this[`EMBED_ERROR_${code}`];
	}

	protected static errorInternal() {
		Log.error(
			new ClientError(
				'Encountered an internal error while trying to reply',
			).stack,
		);

		return this.EMBED_ERROR_500;
	}
}
