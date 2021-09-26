import type { MessageEmbed } from 'discord.js';
import { EmbedErrorCodes } from '../../../resources/enums/EmbedErrorCodes.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { AbstractVoiceCommand } from '../AbstractVoiceCommand.js';

export class RepeatCommand extends AbstractVoiceCommand {
	public static override id = 'repeat';
	public static override description = 'repeats the current song';
	public static override aliases = ['r'];

	public override async getEmbed(
		info: CommandBlueprint,
	): Promise<MessageEmbed> {
		const { queue } = this.ctx;

		if (queue == null) return RepeatCommand.errorInternal();

		if (queue.length <= 0) {
			return this.Class.errorUser(EmbedErrorCodes.NOT_PLAYING);
		}

		const [current] = this.ctx.queue;

		if (current) this.ctx.queue.splice(0, 1, current.clone());

		return (await super.getEmbed(info)).setDescription(
			`repeating ${current.toMarkdown()}.`,
		);
	}
}
