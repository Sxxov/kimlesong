import { Song, Video } from 'youtube-moosick';
import type { PlaylistContent } from 'youtube-moosick';
import { UnsupportedOperationError } from '../../resources/errors/UnsupportedOperationError.js';

export class PlaylistContentAdapter {
	public static adapt(item: Song | Video): PlaylistContent {
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

	public static adaptSong(song: Song): PlaylistContent {
		return {
			artist: song.artist,
			thumbnail: song.thumbnails,
			trackTitle: song.name,
			trackId: song.videoId,
			duration: song.duration,
		};
	}

	public static adaptVideo(video: Video): PlaylistContent {
		return {
			artist: video.author,
			thumbnail: video.thumbnails!,
			trackTitle: video.name,
			trackId: video.videoId,
			duration: video.length,
		};
	}
}
