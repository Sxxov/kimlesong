import type { MessageEmbed } from 'discord.js';
import { State } from '../../../state/State.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { AbstractVoiceCommand } from '../AbstractVoiceCommand.js';

export class DisconnectCommand extends AbstractVoiceCommand {
	public static override id = 'disconnect';
	public static override description = 'disconnects & clears the queue';
	public static override aliases = ['d', 'dis'];

	public override async getEmbed(
		info: CommandBlueprint,
	): Promise<MessageEmbed> {
		const {
			queue,
			queuedPlaylists,
			queuedPlaylistsTimeouts,
			previousQueue,
		} = this.ctx;

		if (queue == null || queuedPlaylists == null)
			return DisconnectCommand.errorInternal();

		queue.splice(0, queue.length);
		queuedPlaylists.splice(0, queuedPlaylists.length);
		previousQueue.splice(0, previousQueue.length);

		queuedPlaylistsTimeouts.forEach((timeout) => {
			clearTimeout(timeout);
		});

		State.guildIdToVoiceChannel.delete(info.guildId!);

		return (await super.getEmbed(info)).setDescription(
			'disconnected & cleared the queue.',
		);
	}
}
