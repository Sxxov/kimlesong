import type { Client, VoiceChannel } from 'discord.js';
import type SpotifyWebApi from 'spotify-web-api-node';
import type { ContinuablePlaylistURL, YoutubeMoosick } from 'youtube-moosick';
import type { CommandBlueprint } from '../command/CommandBlueprint.js';
import type { AsyncQueueItem } from '../queue/AsyncQueueItem.js';
import type { SyncQueueItem } from '../queue/SyncQueueItem.js';
import { ArrayStore } from '../resources/blocks/classes/store/stores/ArrayStore.js';
import { VoiceManager } from './VoiceManager.js';

export class VoiceChannelState {
	public id: string;
	public guildId: string;
	public client: Client;
	public ytm: YoutubeMoosick;
	public spotify: SpotifyWebApi;
	public previousQueue = new ArrayStore<SyncQueueItem | AsyncQueueItem>();
	public queue = new ArrayStore<SyncQueueItem | AsyncQueueItem>();
	public queuedPlaylists = new ArrayStore<ContinuablePlaylistURL>();
	public queuedPlaylistsTimeouts = new ArrayStore<
		ReturnType<typeof setTimeout>
	>();

	public voiceManager: VoiceManager;

	public lastCommandBlueprint: CommandBlueprint | null = null;

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
}
