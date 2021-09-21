import type { MessageEmbed } from 'discord.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { AbstractCommand } from '../AbstractCommand.js';

export class PingCommand extends AbstractCommand {
	public static override id = 'ping';
	public static override description = '(:';

	public override async getEmbed(
		info: CommandBlueprint,
	): Promise<MessageEmbed> {
		return (await super.getEmbed(info)).setDescription('pong');
	}
}
