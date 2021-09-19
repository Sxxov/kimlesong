import type { MessageEmbed } from 'discord.js';
import type { CommandBlueprint } from '../CommandBlueprint.js';
import { AbstractCommand } from './AbstractCommand.js';

export class PingCommand extends AbstractCommand {
	public name = 'ping';
	public description = '(:';
	public aliases = [];

	public override async reply(info: CommandBlueprint): Promise<MessageEmbed> {
		return (await super.reply(info)).setDescription('pong');
	}
}
