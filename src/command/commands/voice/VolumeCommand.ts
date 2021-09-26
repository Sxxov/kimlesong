import type { MessageEmbed } from 'discord.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { AbstractVoiceCommand } from '../AbstractVoiceCommand.js';

export class VolumeCommand extends AbstractVoiceCommand {
	public static override id = 'volume';
	public static override description =
		'adjusts the volume between 0-100, defaults to 50.';

	public static override aliases = ['vol', 'v'];

	public override async getEmbed(
		info: CommandBlueprint,
	): Promise<MessageEmbed> {
		const newVolume = this.ctx.voiceManager.setVolume(
			Number(info.argument) / 100,
		);

		return (await super.getEmbed(info)).setDescription(
			`volume set to ${(newVolume * 100).toFixed(2)}%`,
		);
	}
}
