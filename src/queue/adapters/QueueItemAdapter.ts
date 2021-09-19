import { Song, Video } from 'youtube-moosick/dist/cjs/resources/generalTypes';
import type { PlaylistContent } from 'youtube-moosick/dist/cjs/resources/resultTypes';
import { UnsupportedOperationError } from '../../resources/errors/UnsupportedOperationError.js';
import type { QueueItem } from '../QueueItem.js';

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
		return {
			artist: song.artist.map((artist) => artist.name).join(', '),
			title: song.name,
			id: song.videoId,
			duration: song.duration,
			playlistId: song.playlistId,
		};
	}

	public static adaptVideo(video: Video): QueueItem {
		return {
			artist: video.author.map((artist) => artist.name).join(', '),
			title: video.name,
			id: video.videoId,
			duration: video.length,
		};
	}

	public static adaptPlaylistContent(
		playlistContent: PlaylistContent,
		playlistId: string,
	): QueueItem {
		return {
			artist: playlistContent.artist
				.map((artist) => artist.name)
				.join(', '),
			title: playlistContent.trackTitle,
			id: playlistContent.trackId!,
			duration: playlistContent.duration,
			playlistId,
		};
	}
}
