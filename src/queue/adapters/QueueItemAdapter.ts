import { Song, Video } from 'youtube-moosick';
import type { PlaylistContent } from 'youtube-moosick';
import { UnsupportedOperationError } from '../../resources/errors/UnsupportedOperationError.js';
import { QueueItem } from '../QueueItem.js';
import type { MoreVideoDetails } from 'ytdl-core';
import { Constants } from '../../resources/enums/Constants.js';

export class QueueItemAdapter {
	public static adapt(item: Song | Video | PlaylistContent): QueueItem {
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

	public static adaptSong(song: Song): QueueItem {
		return QueueItem.from({
			artist: song.artist.map((artist) => artist.name).join(', '),
			title: song.name,
			id: song.videoId,
			duration: song.duration,
			playlistId: song.playlistId,
			url: song.url,
		});
	}

	public static adaptVideo(video: Video): QueueItem {
		return QueueItem.from({
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
	): QueueItem {
		return QueueItem.from({
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
	): QueueItem {
		return QueueItem.from({
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
}
