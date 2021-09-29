import {
	AudioPlayerStatus,
	AudioResource,
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
import type { SyncQueueItem } from '../queue/SyncQueueItem.js';
import type { VoiceChannelState } from './VoiceChannelState.js';
import { DiscordJSVoiceAdapterFactory } from './DiscordJSVoiceAdapterFactory.js';
import { JoinFailureError } from './errors/JoinFailureError.js';
import { PlayFailureError } from './errors/PlayFailureError.js';
import type { AsyncQueueItem } from '../queue/AsyncQueueItem.js';
import { SponsorBlockFfmpegFilterFactory } from './SponsorBlockFfmpegFilterFactory.js';
import { Store } from '../resources/blocks/classes/store/Store.js';
import { PlayQueueEventEmitter } from './event/emitters/PlayQueueEventEmitter.js';
import { PlayQueueEventNames } from './event/names/PlayQueueEventNames.js';
import { PlayEventEmitter } from './event/emitters/PlayEventEmitter.js';
import { PlayEventNames } from './event/names/PlayEventNames.js';

export class VoiceManager {
	private connection: VoiceConnection | null = null;
	private player = createAudioPlayer();
	private audio: AudioResource | null = null;
	private interrupted = new Store<undefined>(undefined);
	public isPlaying = false;

	constructor(
		private channel: VoiceChannel,
		private state: VoiceChannelState,
	) {}

	public async stop() {
		this.isPlaying = false;
		this.connection?.destroy();
		this.connection = null;
		this.audio = null;
	}

	public playQueue(queue: (SyncQueueItem | AsyncQueueItem)[]) {
		if (this.isPlaying) this.interrupt();

		const emitter = new PlayQueueEventEmitter();
		const execute = async () => {
			// workaround for unsafe accesses
			// javascript more like java amirite
			const isStarted = [false];
			for (const queueItem of queue) {
				const play = this.play(queueItem);

				play.once(PlayEventNames.START, (queueItem) => {
					if (!isStarted[0]) {
						isStarted[0] = true;
						emitter.emit(PlayQueueEventNames.QUEUE_START, queue);
					}

					emitter.emit(
						PlayQueueEventNames.QUEUE_ITEM_START,
						queueItem,
					);
				});

				play.once(PlayEventNames.ERROR, (err) => {
					play.removeAllListeners();
					throw err;
				});

				const isPlayingNextQueueItem = await new Promise<boolean>(
					(resolve) => {
						play.once(PlayEventNames.INTERRUPT, (queueItem) => {
							emitter.emit(
								PlayQueueEventNames.INTERRUPT,
								queueItem,
							);

							resolve(false);
						});
						play.once(PlayEventNames.END, (queueItem) => {
							emitter.emit(
								PlayQueueEventNames.QUEUE_ITEM_END,
								queueItem,
							);

							resolve(true);
						});
					},
				).finally(() => {
					play.removeAllListeners();
				});

				if (!isPlayingNextQueueItem) {
					return;
				}
			}

			await this.stop();

			emitter.emit(PlayQueueEventNames.QUEUE_END, queue);
		};

		void execute().catch((err) => {
			emitter.emit(PlayQueueEventNames.ERROR, err);
		});

		return emitter;
	}

	public interrupt() {
		this.interrupted.trigger();
	}

	public setVolume(volume: number) {
		const clampedVolume = Math.max(0, Math.min(volume, 1));

		this.audio?.volume?.setVolume(clampedVolume);

		return clampedVolume;
	}

	public pauseQueue() {
		this.isPlaying = !this.player.pause();

		return !this.isPlaying;
	}

	public resumeQueue() {
		this.isPlaying = this.player.unpause();

		return this.isPlaying;
	}

	public play(queueItem: AsyncQueueItem | SyncQueueItem) {
		const emitter = new PlayEventEmitter();
		const execute = async () => {
			let isInterrupted = false;
			const unsubscribe = this.interrupted.subscribeLazy(() => {
				isInterrupted = true;

				emitter.emit(PlayEventNames.INTERRUPT, queueItem);

				unsubscribe();

				try {
					readable.removeAllListeners('close');
				} catch {}
			});

			const connection = await this.connect();

			if (connection == null) {
				throw new JoinFailureError();
			}

			if (isInterrupted) return;

			emitter.emit(PlayEventNames.CONNECT, connection);

			const url = await queueItem.url;

			if (isInterrupted) return;

			// probably from a spotify queue item which isn't on yt at all
			if (!url) throw new PlayFailureError();

			const sponsorBlockFilter =
				await new SponsorBlockFfmpegFilterFactory(
					this.state.sponsorBlock,
				).create(await queueItem.id);

			if (isInterrupted) return;

			const readable = ytdl(url, {
				highWaterMark: 32 * 1024 * 1024,
				filter: 'audioonly',
				opusEncoded: true,
				encoderArgs: sponsorBlockFilter,
			});

			this.audio = createAudioResource(readable, {
				inputType: StreamType.Opus,
				inlineVolume: true,
			});
			this.audio.volume?.setVolume(0.5);

			this.player.play(this.audio);
			this.isPlaying = true;

			try {
				await entersState(this.player, AudioPlayerStatus.Playing, 5000);
			} catch (_: unknown) {
				throw new PlayFailureError();
			}

			if (isInterrupted) return;

			connection.subscribe(this.player);

			emitter.emit(PlayEventNames.START, queueItem);

			readable.once('close', () => {
				emitter.emit(PlayEventNames.END, queueItem);

				unsubscribe();
			});
		};

		void execute().catch((err) => {
			emitter.emit(PlayEventNames.ERROR, err);
		});

		return emitter;
	}

	private async connect() {
		if (this.connection) return this.connection;

		const connection = await this.createConnection();

		this.connection = connection;

		if (connection == null) {
			await this.stop();

			return null;
		}

		return connection;
	}

	private async createConnection() {
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

							// change state id to new voice channel
							this.state.id =
								this.state.client.guilds.cache
									.get(this.state.guildId)
									?.members.cache.get(
										this.state.client.user?.id ?? '',
									)?.voice.channelId ?? this.state.id;
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

		try {
			await entersState(connection, VoiceConnectionStatus.Ready, 20_000);

			return connection;
		} catch {
			return null;
		}
	}
}
