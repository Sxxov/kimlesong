import {
	AudioPlayerStatus,
	createAudioPlayer,
	createAudioResource,
	entersState,
	joinVoiceChannel,
	StreamType,
	VoiceConnection,
	VoiceConnectionDisconnectReason,
	VoiceConnectionStatus,
} from '@discordjs/voice';
import type { VoiceChannel } from 'discord.js';
import ytdl from 'discord-ytdl-core';
import type { QueueItem } from '../queue/QueueItem.js';
import type { VoiceChannelState } from '../state/states/VoiceChannelState.js';
import { DiscordJSVoiceAdapterFactory } from './DiscordJSVoiceAdapterFactory.js';
import { JoinFailureError } from './errors/JoinFailureError.js';
import { PlayFailureError } from './errors/PlayFailureError.js';
import { Log } from '../log/Log.js';

export class VoiceManager {
	private connection: VoiceConnection | null = null;
	private player = createAudioPlayer();
	private currentQueueItem: QueueItem | null = null;

	constructor(
		private channel: VoiceChannel,
		private state: VoiceChannelState,
	) {}

	public async stop() {
		this.connection?.destroy();
		this.connection = null;
	}

	public async playQueue() {
		if (this.player.state.status === AudioPlayerStatus.Playing) return;

		return new Promise<void>((resolve, reject) => {
			const unsubscribe = this.state.queue.subscribe(async (queue) => {
				Log.debug(
					`On queue trigger:\n${
						new Error().stack?.split('\n').slice(1).join('\n') ?? ''
					}`,
				);
				if (queue[0] !== this.currentQueueItem) {
					if (queue[0] == null) {
						unsubscribe();
						await this.stop();
						resolve();

						return;
					}

					this.currentQueueItem = queue[0];

					try {
						const { currentQueueItem } = this;
						this.player.stop();
						await this.play(this.currentQueueItem);

						if (currentQueueItem === this.currentQueueItem) {
							const skipped = this.state.queue.shift();

							if (skipped) this.state.previousQueue.push(skipped);
						}
					} catch (err: unknown) {
						await this.stop();
						reject(err);
					}
				}
			});
		}).catch((err) => {
			throw err;
		});
	}

	public async play(queueItem: QueueItem) {
		await this.connect();

		if (this.connection == null) {
			throw new JoinFailureError();
		}

		const readable = ytdl(queueItem.url, {
			highWaterMark: 32 * 1024 * 1024,
			filter: 'audioonly',
			opusEncoded: true,
			encoderArgs: [],
		});

		this.player.play(
			createAudioResource(readable, {
				inputType: StreamType.Opus,
			}),
		);

		try {
			await entersState(this.player, AudioPlayerStatus.Playing, 5000);
		} catch (_: unknown) {
			throw new PlayFailureError();
		}

		this.connection.subscribe(this.player);

		await new Promise<void>((resolve) => {
			readable.once('close', resolve);
		});
	}

	private async connect() {
		if (this.connection) return this.connection;

		const connection = joinVoiceChannel({
			channelId: this.state.id,
			guildId: this.state.guildId,
			adapterCreator: new DiscordJSVoiceAdapterFactory().create(
				this.channel,
			),
			group: this.state.id,
		});

		let readyLock = false;
		connection.on('stateChange', async (_, newState) => {
			switch (newState.status) {
				case VoiceConnectionStatus.Disconnected:
					if (
						newState.reason
							=== VoiceConnectionDisconnectReason.WebSocketClose
						&& newState.closeCode === 4014
					) {
						try {
							await entersState(
								connection,
								VoiceConnectionStatus.Connecting,
								5_000,
							);
							// Probably moved voice channel
						} catch {
							await this.stop();
							// Probably removed from voice channel
						}
					} else if (connection.rejoinAttempts < 5) {
						/*
							The disconnect in this case is recoverable, and we also have <5 repeated attempts so we will reconnect.
						*/
						await new Promise((resolve) => {
							setTimeout(
								resolve,
								(connection.rejoinAttempts + 1) * 5_000,
							);
						});
						connection.rejoin();
					} else {
						await this.stop();
					}

					break;
				case VoiceConnectionStatus.Connecting:
				case VoiceConnectionStatus.Signalling:
					if (!readyLock) {
						readyLock = true;
						try {
							await entersState(
								connection,
								VoiceConnectionStatus.Ready,
								20_000,
							);
						} catch {
							if (
								connection.state.status
								!== VoiceConnectionStatus.Destroyed
							)
								await this.stop();
						} finally {
							readyLock = false;
						}
					}

					break;
				default:
			}
		});

		this.connection = connection;

		return connection;
	}
}
