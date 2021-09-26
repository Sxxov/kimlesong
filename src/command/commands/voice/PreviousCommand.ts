import type { SlashCommandBuilder } from '@discordjs/builders';
import type { MessageEmbed } from 'discord.js';
import { Constants } from '../../../resources/enums/Constants.js';
import { EmbedErrorCodes } from '../../../resources/enums/EmbedErrorCodes.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { AbstractVoiceCommand } from '../AbstractVoiceCommand.js';

export class PreviousCommand extends AbstractVoiceCommand {
	public static override id = 'previous';
	public static override description = 'plays the previous song';
	public static override aliases = ['prev', 'a'];

	public static override getSlashCommand(): SlashCommandBuilder {
		return super
			.getSlashCommand()
			.addStringOption((option) =>
				option
					.setName(Constants.SLASH_ARGUMENT_NAME)
					.setDescription('How many items to rewind')
					.setRequired(false),
			) as SlashCommandBuilder;
	}

	public override async getEmbed(
		info: CommandBlueprint,
	): Promise<MessageEmbed> {
		const { queue, previousQueue } = this.ctx;

		if (queue == null) return PreviousCommand.errorInternal();

		if (queue.length <= 0) {
			return this.Class.errorUser(EmbedErrorCodes.NOT_PLAYING);
		}

		if (previousQueue.length <= 0) {
			return this.Class.errorUser(EmbedErrorCodes.INDEX_OUT_OF_BOUNDS);
		}

		const itemCount = Number(info.argument) || 0;

		const skipped = previousQueue.splice(
			previousQueue.length - itemCount,
			itemCount,
		);

		queue.splice(0, 0, ...skipped);

		return (await super.getEmbed(info)).setDescription(
			`rewinded ${
				skipped.length > 1
					? `${skipped[skipped.length - 1].toMarkdown()} (+ ${
							skipped.length - 1
					  } more)`
					: skipped[0].toMarkdown()
			}.`,
		);
	}
}
