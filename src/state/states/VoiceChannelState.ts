import type { Client, VoiceChannel } from 'discord.js';
import type { ContinuablePlaylistURL, YoutubeMoosick } from 'youtube-moosick';
import type { CommandBlueprint } from '../../command/CommandBlueprint.js';
import type { QueueItem } from '../../queue/QueueItem.js';
import { ArrayStore } from '../../resources/blocks/classes/store/stores/ArrayStore.js';
import { VoiceManager } from '../../voice/VoiceManager.js';

export class VoiceChannelState {
	public id: string;
	public guildId: string;
	public client: Client;
	public ytm: YoutubeMoosick;
	public previousQueue = new ArrayStore<QueueItem>();
	public queue = new ArrayStore<QueueItem>();
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
	}: Pick<VoiceChannelState, 'client' | 'id' | 'ytm' | 'guildId'>) {
		this.id = id;
		this.client = client;
		this.ytm = ytm;
		this.guildId = guildId;

		this.voiceManager = new VoiceManager(
			this.client.guilds.cache
				.get(this.guildId)
				?.channels.cache.get(this.id) as VoiceChannel,
			this,
		);
	}
}
