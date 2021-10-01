import type { SlashCommandBuilder } from '@discordjs/builders';
import type { MessageEmbed } from 'discord.js';
import { Constants } from '../../../resources/enums/Constants.js';
import { EmbedErrorCodes } from '../../../resources/enums/EmbedErrorCodes.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { AbstractVoiceCommand } from '../AbstractVoiceCommand.js';

export class SkipToCommand extends AbstractVoiceCommand {
	public static override id = 'skipto';
	public static override description = 'skip to the specified queue index.';
	public static override aliases = ['st'];

	public static override getSlashCommand(): SlashCommandBuilder {
		return super
			.getSlashCommand()
			.addStringOption((option) =>
				option
					.setName(Constants.SLASH_ARGUMENT_NAME)
					.setDescription('queue index to skip to.')
					.setRequired(false),
			) as SlashCommandBuilder;
	}

	public override async getEmbed(
		info: CommandBlueprint,
	): Promise<MessageEmbed> {
		const { queue, previousQueue } = this.ctx;

		if (queue == null) return SkipToCommand.errorInternal();

		if (Number.isNaN(Number(info.argument)))
			return SkipToCommand.errorUser(EmbedErrorCodes.COMMAND_INVALID);

		const offsettedIndex = Number(info.argument) - previousQueue.length - 1;

		if (offsettedIndex === 0)
			return (await super.getEmbed(info)).setDescription(
				"only chumps skip to the same index they're currently at!",
			);

		if (offsettedIndex < 0) {
			queue.push(
				...previousQueue.splice(offsettedIndex, previousQueue.length),
			);
		}

		if (offsettedIndex > 0) {
			previousQueue.push(...queue.splice(0, offsettedIndex));
		}

		return (await super.getEmbed(info)).setDescription(
			`skipped to ${await queue.getAt(0).toMarkdown()}.`,
		);
	}
}
