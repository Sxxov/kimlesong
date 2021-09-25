import type { MessageEmbed } from 'discord.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { AbstractVoiceCommand } from '../AbstractVoiceCommand.js';

export class NowCommand extends AbstractVoiceCommand {
	public static override id = 'now';
	public static override description = "shows what's playing now";
	public static override aliases = ['n'];

	// TODO(sxxov): add actions for next prev track

	public override async getEmbed(
		info: CommandBlueprint,
	): Promise<MessageEmbed> {
		const { queue } = this.ctx;

		if (queue == null) return NowCommand.errorInternal();

		if (queue.length <= 0) {
			return (await super.getEmbed(info)).setDescription(
				'nothing playing.',
			);
		}

		return (await super.getEmbed(info)).setDescription(
			`playing ${queue.getAt(0).toMarkdown()}`,
		);
	}
}
