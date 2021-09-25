import { Song, Video } from 'youtube-moosick';
import { Constants } from '../resources/Constants.js';
import type { VoiceChannelState } from '../state/states/VoiceChannelState.js';
import { QueueItemAdapter } from './adapters/QueueItemAdapter.js';
import { InvalidPlaylistError } from './errors/InvalidPlaylistError.js';
import { InvalidSongError } from './errors/InvalidSongError.js';
import { InvalidURLError } from './errors/InvalidURLError.js';
import { UnsupportedURLError } from './errors/UnsupportedURLError.js';
import type { QueueItem } from './QueueItem.js';

export class QueueManager {
	constructor(private ctx: VoiceChannelState) {}

	public async appendQueueFromSearch(searchString: string) {
		const result = await this.createQueueFromSearch(searchString);

		this.ctx.queue.append(result);

		return result;
	}

	private async createQueueFromSearch(
		searchString: string,
	): Promise<QueueItem[]> {
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

	private async createQueueFromYoutubeSearch(searchString: string) {
		const result = (await this.ctx.ytm.search(searchString)).find(
			(item) => item instanceof Song || item instanceof Video,
		) as Song | Video | undefined;

		if (result == null) {
			throw new InvalidSongError();
		}

		return [QueueItemAdapter.adapt(result)];
	}

	// @ts-expect-error stub
	// TODO(sxxov): implement spotify support
	private async createQueueFromSpotifyURL(url: URL): Promise<QueueItem[]> {
		switch (true) {
			case url.pathname.startsWith(Constants.SPOTIFY_PATHNAME_ALBUM):
				break;
			case url.pathname.startsWith(Constants.SPOTIFY_PATHNAME_PLAYLIST):
				break;
			case url.pathname.startsWith(Constants.SPOTIFY_PATHNAME_SONG):
				break;
			default:
				throw new UnsupportedURLError();
		}
	}

	private async createQueueFromYoutubeURL(url: URL): Promise<QueueItem[]> {
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
	): Promise<QueueItem[]> {
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

		return results.playlistContents.map((playlistContent) =>
			QueueItemAdapter.adaptPlaylistContent(playlistContent, id),
		);
	}

	private async createQueueFromYoutubeSongId(
		id: string,
	): Promise<QueueItem[]> {
		const results = await this.ctx.ytm.search(id);

		for (let i = 0, l = results.length; i < l; ++i) {
			const result = results[i];

			// use if statements to assert type

			if (result instanceof Song) {
				return [QueueItemAdapter.adaptSong(result)];
			}

			if (result instanceof Video) {
				return [QueueItemAdapter.adaptVideo(result)];
			}
		}

		// looped through search results & somehow didn't find the song
		throw new InvalidSongError();
	}
}
