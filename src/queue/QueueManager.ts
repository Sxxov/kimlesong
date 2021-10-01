import type { ContinuablePlaylistURL, Song, Video } from 'youtube-moosick';
import ytdl from 'ytdl-core';
import { URL } from 'url';
import { Constants } from '../resources/enums/Constants.js';
import type { VoiceChannelState } from '../voice/VoiceChannelState.js';
import { PlaylistContentAdapter } from './adapters/PlaylistContentAdapter.js';
import { QueueItemAdapter } from './adapters/QueueItemAdapter.js';
import type { AsyncQueueItem } from './AsyncQueueItem.js';
import { InvalidPlaylistError } from './errors/InvalidPlaylistError.js';
import { InvalidURLError } from './errors/InvalidURLError.js';
import { UnsupportedURLError } from './errors/UnsupportedURLError.js';
import type { SyncQueueItem } from './SyncQueueItem.js';
import { QueueArray } from './QueueArray.js';
import { fuzzy } from 'fast-fuzzy';

export class QueueManager {
	constructor(private ctx: VoiceChannelState) {}

	public async unshiftQueueFromSearch(
		searchString: string,
		isQueueToBeTriggered = true,
	) {
		const result = await this.createQueueFromSearch(searchString);

		(isQueueToBeTriggered ? this.ctx.queue : this.ctx.queue.value).unshift(
			...result,
		);

		return result;
	}

	public async pushQueueFromSearch(
		searchString: string,
		isQueueToBeTriggered = true,
	) {
		const result = await this.createQueueFromSearch(searchString);

		(isQueueToBeTriggered ? this.ctx.queue : this.ctx.queue.value).push(
			...result,
		);

		return result;
	}

	private async createQueueFromSearch(
		searchString: string,
	): Promise<QueueArray> {
		if (!searchString) return new QueueArray();
		if (
			searchString.startsWith('http://')
			|| searchString.startsWith('https://')
		) {
			const url = (() => {
				try {
					return new URL(searchString);
				} catch (_: unknown) {
					throw new InvalidURLError();
				}
			})();

			switch (url.hostname) {
				case Constants.SPOTIFY_HOSTNAME:
					return this.createQueueFromSpotifyURL(url);
				case Constants.YOUTUBE_MUSIC_HOSTNAME:
				case Constants.YOUTUBE_WWW_HOSTNAME:
				case Constants.YOUTUBE_HOSTNAME:
					return this.createQueueFromYoutubeURL(url);
				default:
					throw new UnsupportedURLError();
			}
		}

		return this.createQueueFromYoutubeSearch(searchString);
	}

	private async createQueueFromYoutubeSearch(
		searchString: string,
	): Promise<QueueArray<SyncQueueItem>> {
		const searchResult = await this.ctx.ytm.search(searchString);
		const searchTerms = searchString.split(' - ');
		const [artistString, nameString] =
			searchTerms.length >= 2
				? [searchTerms[0], searchTerms.slice(1).join(' - ')]
				: ['', searchString];
		const song = searchResult.find(
			(item) =>
				(item as Song).duration != null
				&& fuzzy(nameString, (item as Song).name) > 0.6
				&& !(item as Song).artist.find(
					(a) => fuzzy(a.name, artistString) <= 0.6,
				),
		) as Song | undefined;

		if (song != null) {
			return QueueArray.extend([QueueItemAdapter.adaptSong(song)]);
		}

		const video = searchResult.find(
			(item) => (item as Video).length != null,
		) as Video | undefined;

		if (video != null) {
			return QueueArray.extend([QueueItemAdapter.adaptVideo(video)]);
		}

		return QueueArray.extend([]);
	}

	private async createQueueFromSpotifyURL(
		url: URL,
	): Promise<QueueArray<AsyncQueueItem>> {
		switch (true) {
			case url.pathname.startsWith(Constants.SPOTIFY_PATHNAME_ALBUM): {
				const result = await this.ctx.spotify.getAlbumTracks(
					url.pathname.replace(
						`${Constants.SPOTIFY_PATHNAME_PLAYLIST}/`,
						'',
					),
				);
				const { items, total } = result.body;

				return QueueArray.extend(
					items.map((item) =>
						QueueItemAdapter.adaptSpotifyTrack(
							item,
							async () =>
								(
									await this.createQueueFromYoutubeSearch(
										`${item.artists
											.map((artist) => artist.name)
											.join(', ')} - ${item.name}`,
									)
								)[0]?.id,
						),
					),
					total,
				);
			}

			// https://open.spotify.com/playlist/0Ax9oHkKm6HAQc9iqLQRhd?si=0bb397938ff04779
			case url.pathname.startsWith(Constants.SPOTIFY_PATHNAME_PLAYLIST): {
				const {
					body: { items, total },
				} = await this.ctx.spotify.getPlaylistTracks(
					url.pathname.replace(
						`${Constants.SPOTIFY_PATHNAME_PLAYLIST}/`,
						'',
					),
				);
				const idGetterFactory =
					(track: SpotifyApi.TrackObjectSimplified) => async () =>
						(
							await this.createQueueFromYoutubeSearch(
								`${track.artists
									.map((artist) => artist.name)
									.join(', ')} - ${track.name}`,
							)
						)[0]?.id;

				type Unpromisify<T> = T extends Promise<infer U> ? U : T;

				if (items.length < total) {
					const results = {
						continuation: {
							clickTrackingParams: '',
							continuation: '',
						},
						playlistContents: {
							...items,
							loadNext: async () => {
								const {
									body: { items: result },
									// eslint-disable-next-line
								} = (await this.ctx.spotify.getPlaylistTracks(
									url.pathname.replace(
										`${Constants.SPOTIFY_PATHNAME_PLAYLIST}/`,
										'',
									),
									{
										offset: items.length,
										limit: 100,
									},
								)) as Unpromisify<
									ReturnType<
										typeof this.ctx.spotify.getPlaylistTracks
									>
								>;

								return {
									result: result.map((item) =>
										PlaylistContentAdapter.adaptSpotifyTrack(
											item.track,
										),
									),
								};
							},
						} as unknown as ContinuablePlaylistURL['playlistContents'],
					};
					let offset = 0;
					const newLength = this.ctx.queuedPlaylists.push(results);
					const timeout = async () => {
						const indexOfQueuedPlaylists =
							this.ctx.queuedPlaylists.indexOf(results);

						if (indexOfQueuedPlaylists === -1) return;

						const {
							body: { items: result },
						} = await this.ctx.spotify.getPlaylistTracks(
							url.pathname.replace(
								`${Constants.SPOTIFY_PATHNAME_PLAYLIST}/`,
								'',
							),
							{
								offset,
								limit: 100,
							},
						)!;

						this.ctx.queue.push(
							...(result?.map((item) =>
								QueueItemAdapter.adaptSpotifyTrack(
									item.track,
									idGetterFactory(item.track),
								),
							) ?? []),
						);

						offset += 100;

						if (offset < total) {
							this.ctx.queuedPlaylistsTimeouts.setAt(
								indexOfQueuedPlaylists,
								setTimeout(
									timeout,
									Constants.COMMAND_MORE_TIMEOUT,
								),
							);
						}
					};

					this.ctx.queuedPlaylistsTimeouts.setAt(
						newLength - 1,
						setTimeout(timeout, Constants.COMMAND_MORE_TIMEOUT),
					);
				}

				return QueueArray.extend(
					items.map((item) =>
						QueueItemAdapter.adaptSpotifyTrack(
							item.track,
							idGetterFactory(item.track),
						),
					),
					total,
				);
			}

			// https://open.spotify.com/track/7l2pOZ1PkBLWWMe65OlRso?si=c6bd0bcad04847ff
			case url.pathname.startsWith(Constants.SPOTIFY_PATHNAME_SONG): {
				const track = await this.ctx.spotify.getTrack(
					url.pathname.replace(
						`${Constants.SPOTIFY_PATHNAME_SONG}/`,
						'',
					),
				);

				return QueueArray.extend([
					QueueItemAdapter.adaptSpotifyTrack(
						track.body,
						async () =>
							(
								await this.createQueueFromYoutubeSearch(
									`${track.body.artists
										.map((artist) => artist.name)
										.join(', ')} - ${track.body.name}`,
								)
							)[0]?.id,
					),
				]);
			}

			default:
				throw new UnsupportedURLError();
		}
	}

	private async createQueueFromYoutubeURL(
		url: URL,
	): Promise<QueueArray<SyncQueueItem>> {
		switch (true) {
			case url.pathname.startsWith(Constants.YOUTUBE_PATHNAME_PLAYLIST): {
				const id = url.searchParams.get('list');

				if (id == null) {
					throw new InvalidURLError();
				}

				return this.createQueueFromYoutubePlaylistId(id);
			}

			case url.pathname.startsWith(Constants.YOUTUBE_PATHNAME_SONG): {
				const id = url.searchParams.get('v');

				if (id == null) {
					throw new InvalidURLError();
				}

				return this.createQueueFromYoutubeSongId(id);
			}

			default:
				throw new UnsupportedURLError();
		}
	}

	private async createQueueFromYoutubePlaylistId(
		id: string,
	): Promise<QueueArray<SyncQueueItem>> {
		if (!(id.startsWith('PL') || id.startsWith('VL'))) {
			throw new InvalidPlaylistError();
		}

		const results = await this.ctx.ytm.getPlaylist(
			id,
			Constants.PLAYLIST_CONTENT_LIMIT,
		);

		const newLength = this.ctx.queuedPlaylists.push(results);

		if (results.playlistContents.length !== results.headers?.songCount) {
			const timeout = async () => {
				const indexOfQueuedPlaylists =
					this.ctx.queuedPlaylists.indexOf(results);

				if (indexOfQueuedPlaylists === -1) return;

				const { result } =
					(await results.playlistContents.loadNext()) ?? {};

				this.ctx.queue.push(
					...(result?.map((playlistContent) =>
						QueueItemAdapter.adaptPlaylistContent(
							playlistContent,
							id,
						),
					) ?? []),
				);

				this.ctx.queuedPlaylistsTimeouts.setAt(
					indexOfQueuedPlaylists,
					setTimeout(timeout, Constants.COMMAND_MORE_TIMEOUT),
				);
			};

			this.ctx.queuedPlaylistsTimeouts.setAt(
				newLength - 1,
				setTimeout(timeout, Constants.COMMAND_MORE_TIMEOUT),
			);
		}

		return QueueArray.extend(
			results.playlistContents
				.map((playlistContent) =>
					playlistContent.trackId == null
						? null
						: QueueItemAdapter.adaptPlaylistContent(
								playlistContent,
								id,
						  ),
				)
				.filter(Boolean) as SyncQueueItem[],
			results.playlistContents.length,
		);
	}

	private async createQueueFromYoutubeSongId(
		id: string,
		playlistId?: string,
	): Promise<QueueArray<SyncQueueItem>> {
		const { videoDetails } = await ytdl.getBasicInfo(
			`https://${Constants.YOUTUBE_HOSTNAME}${Constants.YOUTUBE_PATHNAME_SONG}?v=${id}`,
		);

		return QueueArray.extend([
			QueueItemAdapter.adaptVideoDetails(videoDetails, playlistId),
		]);
	}
}
