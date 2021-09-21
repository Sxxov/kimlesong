import type { MessageEmbed } from 'discord.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { AbstractVoiceCommand } from '../AbstractVoiceCommand.js';

export class ClearCommand extends AbstractVoiceCommand {
	public static override id = 'clear';
	public static override description = 'clears the queue';
	public static override aliases = ['c'];

	public override async getEmbed(
		info: CommandBlueprint,
	): Promise<MessageEmbed> {
		const { queue, queuedPlaylists, queuedPlaylistsTimeouts } = this.ctx;

		if (queue == null || queuedPlaylists == null)
			return ClearCommand.errorInternal();

		queue.splice(0, queue.length);
		queuedPlaylists.splice(0, queuedPlaylists.length);

		queuedPlaylistsTimeouts.forEach((timeout) => {
			clearTimeout(timeout);
		});

		return (await super.getEmbed(info)).setDescription('cleared queue.');
	}
}
