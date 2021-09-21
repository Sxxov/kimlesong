import type { MessageEmbed } from 'discord.js';
import { State } from '../../state/StateManager.js';
import type { CommandBlueprint } from '../CommandBlueprint.js';
import { AbstractCommand } from './AbstractCommand.js';

export class ClearCommand extends AbstractCommand {
	public name = 'clear';
	public description = '(:';
	public aliases = ['c'];

	public override async reply(info: CommandBlueprint): Promise<MessageEmbed> {
		const queue = State.guildIdToQueue.get(info.guildId!);
		const queuedPlaylists = State.guildIdToQueuedPlaylists.get(
			info.guildId!,
		);

		if (queue == null || queuedPlaylists == null)
			return this.errorInternal();

		queue.splice(0, queue.length);
		queuedPlaylists.splice(0, queuedPlaylists.length);
		clearTimeout(State.guildIdToQueueMoreTimeout.get(info.guildId!)!);

		return (await super.reply(info)).setDescription('cleared queue.');
	}
}
