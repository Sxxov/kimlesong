import type { Song, Video, PlaylistContent } from 'youtube-moosick';
export class PlaylistContentAdapter {
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
