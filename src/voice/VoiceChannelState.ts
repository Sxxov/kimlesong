import type { Client, VoiceChannel } from 'discord.js';
import type SpotifyWebApi from 'spotify-web-api-node';
import type { ContinuablePlaylistURL, YoutubeMoosick } from 'youtube-moosick';
import type { CommandBlueprint } from '../command/CommandBlueprint.js';
import type { AsyncQueueItem } from '../queue/AsyncQueueItem.js';
import type { SyncQueueItem } from '../queue/SyncQueueItem.js';
import { ArrayStore } from '../resources/blocks/classes/store/stores/ArrayStore.js';
import { CachedSponsorBlock } from './CachedSponsorBlock.js';
import { VoiceManager } from './VoiceManager.js';

export class VoiceChannelState {
	public id: string;
	public guildId: string;
	public client: Client;
	public ytm: YoutubeMoosick;
	public spotify: SpotifyWebApi;
	public sponsorBlock = new CachedSponsorBlock('kimlebot');
	public voiceManager: VoiceManager;
	public lastCommandBlueprint: CommandBlueprint | null = null;
	public queueLoopedItemsStartIndex: number | null = null;
	public unsubscribeQueueLoop: (() => void) | null = null;
	public previousQueue = new ArrayStore<SyncQueueItem | AsyncQueueItem>();
	public queue = new ArrayStore<SyncQueueItem | AsyncQueueItem>();
	public queuedPlaylists = new ArrayStore<ContinuablePlaylistURL>();
	public queuedPlaylistsTimeouts = new ArrayStore<
		ReturnType<typeof setTimeout>
	>();

	public scheduleDisconnectHandle: ReturnType<typeof setTimeout> | null =
		null;

	constructor({
		client,
		guildId,
		id,
		ytm,
		spotify,
	}: Pick<
		VoiceChannelState,
		'client' | 'id' | 'ytm' | 'guildId' | 'spotify'
	>) {
		this.id = id;
		this.client = client;
		this.ytm = ytm;
		this.guildId = guildId;
		this.spotify = spotify;

		this.voiceManager = new VoiceManager(
			this.client.guilds.cache
				.get(this.guildId)
				?.channels.cache.get(this.id) as VoiceChannel,
			this,
		);
	}

	public destroy() {
		const {
			queue,
			queuedPlaylists,
			queuedPlaylistsTimeouts,
			previousQueue,
			scheduleDisconnectHandle,
		} = this;

		queue.splice(0, queue.length);
		queuedPlaylists.splice(0, queuedPlaylists.length);
		previousQueue.splice(0, previousQueue.length);

		queuedPlaylistsTimeouts.forEach((timeout) => {
			clearTimeout(timeout);
		});

		clearTimeout(scheduleDisconnectHandle!);
	}
}
