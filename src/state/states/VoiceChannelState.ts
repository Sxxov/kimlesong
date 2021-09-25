import type { Client } from 'discord.js';
import type { ContinuablePlaylistURL, YoutubeMoosick } from 'youtube-moosick';
import type { CommandBlueprint } from '../../command/CommandBlueprint.js';
import type { QueueItem } from '../../queue/QueueItem.js';
import { ArrayStore } from '../../resources/blocks/classes/store/stores/ArrayStore.js';

export class VoiceChannelState {
	public id: string;
	public guildId: string;
	public client: Client;
	public ytm: YoutubeMoosick;
	public queue = new ArrayStore<QueueItem>();
	public queuedPlaylists = new ArrayStore<ContinuablePlaylistURL>();
	public queuedPlaylistsTimeouts = new ArrayStore<
		ReturnType<typeof setTimeout>
	>();

	public lastCommandBlueprint: CommandBlueprint | null = null;

	constructor({
		client,
		guildId,
		id,
		ytm,
	}: Pick<VoiceChannelState, 'client' | 'id' | 'ytm' | 'guildId'>) {
		this.id = id;
		this.client = client;
		this.ytm = ytm;
		this.guildId = guildId;
	}
}
