import type { MessageEmbed } from 'discord.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { AbstractVoiceCommand } from '../AbstractVoiceCommand.js';

export class PauseCommand extends AbstractVoiceCommand {
	public static override id = 'pause';
	public static override description = 'pauses the queue.';
	public static override aliases = ['b'];

	public override async getEmbed(
		info: CommandBlueprint,
	): Promise<MessageEmbed> {
		this.ctx.voiceManager.pauseQueue();

		return (await super.getEmbed(info)).setDescription(
			`paused ${await this.ctx.queue.getAt(0).toMarkdown()}`,
		);
	}
}
