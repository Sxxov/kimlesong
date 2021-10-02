import { Song, Video } from 'youtube-moosick';
import type { PlaylistContent } from 'youtube-moosick';
import { UnsupportedOperationError } from '../../resources/errors/UnsupportedOperationError.js';
import { SyncQueueItem } from '../SyncQueueItem.js';
import type { MoreVideoDetails } from 'ytdl-core';
import { Constants } from '../../resources/enums/Constants.js';
import { AsyncQueueItem } from '../AsyncQueueItem.js';

export class QueueItemAdapter {
	public static adapt(item: Song | Video | PlaylistContent): SyncQueueItem {
		switch (true) {
			case item instanceof Song:
				return this.adaptSong(item as Song);
			case item instanceof Video:
				return this.adaptVideo(item as Video);
			default:
				throw new UnsupportedOperationError(
					'Attempted to adapt unknown type',
				);
		}
	}

	public static adaptSong(song: Song): SyncQueueItem {
		return SyncQueueItem.from({
			artist: song.artist.map((artist) => artist.name).join(', '),
			title: song.name,
			id: song.videoId,
			duration: song.duration,
			playlistId: song.playlistId,
			url: song.url,
		});
	}

	public static adaptVideo(video: Video): SyncQueueItem {
		return SyncQueueItem.from({
			artist: video.author.map((artist) => artist.name).join(', '),
			title: video.name,
			id: video.videoId,
			duration: video.length,
			url: video.url,
		});
	}

	public static adaptPlaylistContent(
		playlistContent: PlaylistContent,
		playlistId: string,
	): SyncQueueItem {
		return SyncQueueItem.from({
			artist: playlistContent.artist
				.map((artist) => artist.name)
				.join(', '),
			title: playlistContent.trackTitle,
			id: playlistContent.trackId!,
			duration: playlistContent.duration,
			playlistId,
			url: `https://${Constants.YOUTUBE_HOSTNAME}${
				Constants.YOUTUBE_PATHNAME_SONG
			}?v=${playlistContent.trackId ?? 'dQw4w9WgXcQ'}&list=${playlistId}`,
		});
	}

	public static adaptVideoDetails(
		videoDetails: MoreVideoDetails,
		playlistId?: string,
	): SyncQueueItem {
		return SyncQueueItem.from({
			artist: videoDetails.author.name,
			title: videoDetails.title,
			id: videoDetails.videoId,
			duration: Number(videoDetails.lengthSeconds) * 1000,
			url: `https://${Constants.YOUTUBE_HOSTNAME}${
				Constants.YOUTUBE_PATHNAME_SONG
			}?v=${videoDetails.videoId}${
				playlistId ? `&list=${playlistId}` : ''
			}`,
			playlistId,
		});
	}

	public static adaptSpotifyTrack(
		track: SpotifyApi.TrackObjectSimplified,
		idGetter: () => Promise<string>,
	): AsyncQueueItem {
		let idCache: string | null = null;

		const item = AsyncQueueItem.from({
			artist: track.artists.map((artist) => artist.name).join(', '),
			duration: track.duration_ms,
			id: Promise.resolve(''),
			title: track.name,
			url: Promise.resolve(''),
			externalUrl: `https://${Constants.SPOTIFY_HOSTNAME}${Constants.SPOTIFY_PATHNAME_SONG}/${track.id}`,
		});

		Object.defineProperty(item, 'id', {
			async get() {
				return (async () => {
					if (typeof idCache === 'string') return idCache;

					idCache = (await idGetter()) ?? null;

					return idCache;
				})();
			},
		});

		Object.defineProperty(item, 'url', {
			async get() {
				const id = await item.id;

				return (async () =>
					id == null
						? null
						: `https://${Constants.YOUTUBE_HOSTNAME}${Constants.YOUTUBE_PATHNAME_SONG}?v=${id}`)();
			},
		});

		return item;
	}
}
