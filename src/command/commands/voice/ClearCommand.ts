import type { MessageEmbed } from 'discord.js';
import { State } from '../../../state/State.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { AbstractCommand } from '../AbstractCommand.js';

export class ClearCommand extends AbstractCommand {
	public static override id = 'clear';
	public static override description = 'clears the queue';
	public static override aliases = ['c'];

	public override async getEmbed(
		info: CommandBlueprint,
	): Promise<MessageEmbed> {
		const queue = State.guildIdToQueue.get(info.guildId!);
		const queuedPlaylists = State.guildIdToQueuedPlaylists.get(
			info.guildId!,
		);

		if (queue == null || queuedPlaylists == null)
			return ClearCommand.errorInternal();

		queue.splice(0, queue.length);
		queuedPlaylists.splice(0, queuedPlaylists.length);
		clearTimeout(State.guildIdToQueueMoreTimeout.get(info.guildId!)!);

		return (await super.getEmbed(info)).setDescription('cleared queue.');
	}
}
