import type { MessageEmbed } from 'discord.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { AbstractVoiceCommand } from '../AbstractVoiceCommand.js';

export class ResumeCommand extends AbstractVoiceCommand {
	public static override id = 'resume';
	public static override description = 'resumes the queue.';
	public static override aliases = ['m'];

	public override async getEmbed(
		info: CommandBlueprint,
	): Promise<MessageEmbed> {
		this.ctx.voiceManager.resumeQueue();

		return (await super.getEmbed(info)).setDescription(
			`resumed ${await this.ctx.queue.getAt(0).toMarkdown()}`,
		);
	}
}
