import type { MessageEmbed } from 'discord.js';
import { State } from '../../../state/State.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { AbstractVoiceCommand } from '../AbstractVoiceCommand.js';

export class DisconnectCommand extends AbstractVoiceCommand {
	public static override id = 'disconnect';
	public static override description = 'disconnects & clears the queue.';
	public static override aliases = ['dis', 'd'];

	public override async getEmbed(
		info: CommandBlueprint,
	): Promise<MessageEmbed> {
		this.ctx.destroy();

		State.guildIdToVoiceChannel.delete(info.guildId!);

		return (await super.getEmbed(info)).setDescription(
			'disconnected & cleared the queue.',
		);
	}
}
