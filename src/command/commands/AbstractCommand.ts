/* eslint-disable @typescript-eslint/no-unused-vars */
import { SlashCommandBuilder } from '@discordjs/builders';
import {
	ButtonInteraction,
	MessageActionRow,
	MessageEmbed,
	MessageOptions,
	MessagePayload,
} from 'discord.js';
import { Log } from '../../log/Log.js';
import { Constants } from '../../resources/enums/Constants.js';
import type { EmbedErrorCodes } from '../../resources/enums/EmbedErrorCodes.js';
import { KimLeScam } from '../../resources/enums/KimLeScam.js';
import { ClientError } from '../../resources/errors/ClientError.js';
import type { CommandBlueprint } from '../CommandBlueprint.js';
import { ErrorMessageEmbed } from '../ErrorMessageEmbed.js';

export abstract class AbstractCommand {
	// #region error constants
	private static EMBED_ERROR_500 = new ErrorMessageEmbed()
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

	private static EMBED_ERROR_503 = new ErrorMessageEmbed()
		.setColor(Constants.EMBED_COLOUR)
		.setAuthor(
			this.getAuthorName(),
			this.getAuthorImage(),
			Constants.EMBED_AUTHOR_URL,
		)
		.setTitle(Constants.EMBED_TITLE_ERROR_INTERNAL)
		.setDescription(
			'something really wrong has happened! just letting you know if i act a little weird.',
		);

	private static EMBED_ERROR_400 = new ErrorMessageEmbed()
		.setColor(Constants.EMBED_COLOUR)
		.setAuthor(
			this.getAuthorName(),
			this.getAuthorImage(),
			Constants.EMBED_AUTHOR_URL,
		)
		.setTitle(Constants.EMBED_TITLE_ERROR_USER)
		.setDescription("that command doesn't look right lol, try again.");

	private static EMBED_ERROR_403 = new ErrorMessageEmbed()
		.setColor(Constants.EMBED_COLOUR)
		.setAuthor(
			this.getAuthorName(),
			this.getAuthorImage(),
			Constants.EMBED_AUTHOR_URL,
		)
		.setTitle(Constants.EMBED_TITLE_ERROR_USER)
		.setDescription(
			"i don't have permission from the server to join that channel, try again.",
		);

	private static EMBED_ERROR_404 = new ErrorMessageEmbed()
		.setColor(Constants.EMBED_COLOUR)
		.setAuthor(
			this.getAuthorName(),
			this.getAuthorImage(),
			Constants.EMBED_AUTHOR_URL,
		)
		.setTitle(Constants.EMBED_TITLE_ERROR_USER)
		.setDescription('no media was found for your query, try again.');

	private static EMBED_ERROR_405 = new ErrorMessageEmbed()
		.setColor(Constants.EMBED_COLOUR)
		.setAuthor(
			this.getAuthorName(),
			this.getAuthorImage(),
			Constants.EMBED_AUTHOR_URL,
		)
		.setTitle(Constants.EMBED_TITLE_ERROR_USER)
		.setDescription("that command doesn't seem to exist, try `!help`.");

	private static EMBED_ERROR_406 = new ErrorMessageEmbed()
		.setColor(Constants.EMBED_COLOUR)
		.setAuthor(
			this.getAuthorName(),
			this.getAuthorImage(),
			Constants.EMBED_AUTHOR_URL,
		)
		.setTitle(Constants.EMBED_TITLE_ERROR_USER)
		.setDescription('unsupported channel type, try again.');

	private static EMBED_ERROR_416 = new ErrorMessageEmbed()
		.setColor(Constants.EMBED_COLOUR)
		.setAuthor(
			this.getAuthorName(),
			this.getAuthorImage(),
			Constants.EMBED_AUTHOR_URL,
		)
		.setTitle(Constants.EMBED_TITLE_ERROR_USER)
		.setDescription(
			"you went a little too far, there's nothing at that index, try again.",
		);

	private static EMBED_ERROR_420 = new ErrorMessageEmbed()
		.setColor(Constants.EMBED_COLOUR)
		.setAuthor(
			this.getAuthorName(),
			this.getAuthorImage(),
			Constants.EMBED_AUTHOR_URL,
		)
		.setTitle(Constants.EMBED_TITLE_ERROR_USER)
		.setDescription("you don't seem to be in a voice channel, try again.");

	private static EMBED_ERROR_423 = new ErrorMessageEmbed()
		.setColor(Constants.EMBED_COLOUR)
		.setAuthor(
			this.getAuthorName(),
			this.getAuthorImage(),
			Constants.EMBED_AUTHOR_URL,
		)
		.setTitle(Constants.EMBED_TITLE_ERROR_USER)
		.setDescription("don't be rude i'm already playing, try again.");

	private static EMBED_ERROR_426 = new ErrorMessageEmbed()
		.setColor(Constants.EMBED_COLOUR)
		.setAuthor(
			this.getAuthorName(),
			this.getAuthorImage(),
			Constants.EMBED_AUTHOR_URL,
		)
		.setTitle(Constants.EMBED_TITLE_ERROR_USER)
		.setDescription('nothing is playing, try again.');

	// #endregion

	public static id: string;
	public static description: string;
	public static aliases: string[] = [];
	public static actionIds: string[] = [];

	public Class = this.constructor as typeof AbstractCommand;
	public instanceId = Number.MAX_SAFE_INTEGER * Math.random();

	public async getReply(info: CommandBlueprint) {
		const actions = await this.getActions(info);

		return {
			options: {},
			embeds: await this.getEmbeds(info),
			components: actions.length > 0 ? actions : undefined,
		};
	}

	public async getEmbeds(info: CommandBlueprint) {
		return [await this.getEmbed(info)];
	}

	public async getEmbed(info: CommandBlueprint) {
		return new MessageEmbed()
			.setColor(Constants.EMBED_COLOUR)
			.setAuthor(
				this.getAuthorName(),
				this.getAuthorImage(),
				Constants.EMBED_AUTHOR_URL,
			)
			.setTitle(this.Class.id);
	}

	public async act(info: ButtonInteraction) {}

	public async getActions(info: CommandBlueprint) {
		const action = await this.getAction(info);

		if (action.components.length <= 0) {
			return [];
		}

		return [action];
	}

	public async getAction(info: CommandBlueprint) {
		return new MessageActionRow();
	}

	public static getSlashCommand(): SlashCommandBuilder {
		return new SlashCommandBuilder()
			.setName(this.id)
			.setDescription(this.description);
	}

	public getCustomId(actionId: string) {
		return this.Class.getCustomId(this.instanceId, actionId);
	}

	public static getCustomId(instanceId: number, actionId: string) {
		return `${instanceId}::${actionId}`;
	}

	public static deserializeCustomId(customId: string) {
		const [instanceId, actionId] = customId.split('::');

		return {
			instanceId,
			actionId,
		};
	}

	protected getAuthorImage() {
		return this.Class.getAuthorImage();
	}

	protected static getAuthorImage(): string {
		// TODO(sxxov): add klscam img list
		return KimLeScam[Math.floor(Math.random() * 119)];
	}

	protected getAuthorName() {
		return this.Class.getAuthorName();
	}

	protected static getAuthorName() {
		return '\u200B';
	}

	public static errorUser(code: EmbedErrorCodes) {
		return this[`EMBED_ERROR_${code}`];
	}

	public static errorInternal(code: 500 | 503 = 500) {
		Log.error(
			new ClientError(`Encountered a ${code} while trying to reply`)
				.stack,
		);

		return this[`EMBED_ERROR_${code}`];
	}
}
