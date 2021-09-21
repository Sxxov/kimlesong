import type { Client } from 'discord.js';
import type { ContinuablePlaylistURL, YoutubeMoosick } from 'youtube-moosick';
import type { QueueItem } from '../../queue/QueueItem.js';
import { ArrayStore } from '../../resources/blocks/classes/store/stores/ArrayStore.js';

export class VoiceChannelState {
	public id: string;
	public client: Client;
	public ytm: YoutubeMoosick;
	public queue = new ArrayStore<QueueItem>();
	public queuedPlaylists = new ArrayStore<ContinuablePlaylistURL>();
	public queuedPlaylistsTimeouts = new ArrayStore<
		ReturnType<typeof setTimeout>
	>();

	constructor({
		client,
		id,
		ytm,
	}: Pick<VoiceChannelState, 'client' | 'id' | 'ytm'>) {
		this.id = id;
		this.client = client;
		this.ytm = ytm;
	}
}
