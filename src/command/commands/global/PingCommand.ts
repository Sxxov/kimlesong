import type { MessageEmbed } from 'discord.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { AbstractGlobalCommand } from '../AbstractGlobalCommand.js';

export class PingCommand extends AbstractGlobalCommand {
	public static override id = 'ping';
	public static override description = 'pong.';

	public override async getEmbed(
		info: CommandBlueprint,
	): Promise<MessageEmbed> {
		return (await super.getEmbed(info)).setDescription('pong');
	}
}
