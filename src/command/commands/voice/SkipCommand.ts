import type { SlashCommandBuilder } from '@discordjs/builders';
import type { MessageEmbed } from 'discord.js';
import { Constants } from '../../../resources/enums/Constants.js';
import { EmbedErrorCodes } from '../../../resources/enums/EmbedErrorCodes.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { AbstractVoiceCommand } from '../AbstractVoiceCommand.js';

export class SkipCommand extends AbstractVoiceCommand {
	public static override id = 'skip';
	public static override description = 'skips the current song';
	public static override aliases = ['s'];

	// TODO(sxxov): put deleted songs into -ve indices instead of deleting them (until someone clears the queue)

	public static override getSlashCommand(): SlashCommandBuilder {
		return super
			.getSlashCommand()
			.addStringOption((option) =>
				option
					.setName(Constants.SLASH_ARGUMENT_NAME)
					.setDescription('How many items to skip')
					.setRequired(false),
			) as SlashCommandBuilder;
	}

	public override async getEmbed(
		info: CommandBlueprint,
	): Promise<MessageEmbed> {
		const { queue } = this.ctx;

		if (queue == null) return SkipCommand.errorInternal();

		if (queue.length <= 0) {
			return this.Class.errorUser(EmbedErrorCodes.NOT_PLAYING);
		}

		const skipped = queue.splice(0, Number(info.argument) || 1);

		return (await super.getEmbed(info)).setDescription(
			`skipped ${
				skipped.length > 1
					? `${skipped[skipped.length - 1].toMarkdown()} (+ ${
							skipped.length - 1
					  } more)`
					: skipped[0].toMarkdown()
			}`,
		);
	}
}
