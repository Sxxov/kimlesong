import type { YoutubeMoosick } from 'youtube-moosick';
import { Song, Video } from 'youtube-moosick';
import { ArrayStore } from '../resources/blocks/classes/store/stores/ArrayStore.js';
import { Constants } from '../resources/Constants.js';
import { IllegalStateError } from '../resources/errors/IllegalStateError.js';
import { State } from '../state/State.js';
import { QueueItemAdapter } from './adapters/QueueItemAdapter.js';
import { InvalidPlaylistError } from './errors/InvalidPlaylistError.js';
import { InvalidSongError } from './errors/InvalidSongError.js';
import { InvalidURLError } from './errors/InvalidURLError.js';
import { UnsupportedURLError } from './errors/UnsupportedURLError.js';
import type { QueueItem } from './QueueItem.js';

export class QueueManager {
	public queue: ArrayStore<QueueItem>;

	constructor(private guildId: string, private ctx: YoutubeMoosick) {
		this.queue = State.guildIdToQueue.get(this.guildId)!;
	}

	public async appendQueueFromSearch(searchString: string) {
		if (this.queue == null) {
			throw new IllegalStateError('`this.queue` is nullish');
		}

		const queueItems = await this.createQueueFromSearch(searchString);

		this.queue.push(...queueItems);

		return queueItems;
	}

	public async createQueueFromSearch(
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
				case Constants.YOUTUBE_HOSTNAME_WWW:
				case Constants.YOUTUBE_HOSTNAME:
					return this.createQueueFromYoutubeURL(url);
				default:
					throw new UnsupportedURLError();
			}
		}

		return this.createQueueFromYoutubeSearch(searchString);
	}

	public async createQueueFromYoutubeSearch(searchString: string) {
		const result = (await this.ctx.search(searchString)).find(
			(item) => item instanceof Song || item instanceof Video,
		) as Song | Video | undefined;

		if (result == null) {
			throw new InvalidSongError();
		}

		return [QueueItemAdapter.adapt(result)];
	}

	// @ts-expect-error stub
	// TODO(sxxov): implement spotify support
	public async createQueueFromSpotifyURL(url: URL): Promise<QueueItem[]> {
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

	public async createQueueFromYoutubeURL(url: URL): Promise<QueueItem[]> {
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

	public async createQueueFromYoutubePlaylistId(
		id: string,
	): Promise<QueueItem[]> {
		if (!(id.startsWith('PL') || id.startsWith('VL'))) {
			throw new InvalidPlaylistError();
		}

		const results = await this.ctx.getPlaylist(
			id,
			Constants.PLAYLIST_CONTENT_LIMIT,
		);

		State.guildIdToQueuedPlaylists
			.getOrAssignFromFactory(this.guildId, () => new ArrayStore())
			?.push(results);

		if (results.playlistContents.length !== results.headers?.songCount) {
			const { guildId } = this;

			(async function timeout() {
				if (
					State.guildIdToQueuedPlaylists
						.get(guildId)
						?.some((playlist) => playlist === results)
				) {
					const { result } =
						(await results.playlistContents.loadNext()) ?? {};
					const queue = State.guildIdToQueue.get(guildId);

					queue?.push(
						...(result?.map((playlistContent) =>
							QueueItemAdapter.adaptPlaylistContent(
								playlistContent,
								id,
							),
						) ?? []),
					);

					State.guildIdToQueueMoreTimeout.set(
						guildId,
						setTimeout(timeout, Constants.COMMAND_MORE_TIMEOUT),
					);
				}
			})();
		}

		return results.playlistContents.map((playlistContent) =>
			QueueItemAdapter.adaptPlaylistContent(playlistContent, id),
		);
	}

	public async createQueueFromYoutubeSongId(
		id: string,
	): Promise<QueueItem[]> {
		const results = await this.ctx.search(id);

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
