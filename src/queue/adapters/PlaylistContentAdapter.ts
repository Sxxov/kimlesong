import { Song, Video, PlaylistContent, Artist } from 'youtube-moosick';
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

	public static adaptSpotifyTrack(
		track: SpotifyApi.TrackObjectSimplified,
	): PlaylistContent {
		return {
			artist: track.artists.map((artist) =>
				Artist.from({
					browseId: '',
					name: artist.name,
					url: '',
				}),
			),
			thumbnail: [],
			trackTitle: track.name,
			// STUB
			trackId: '',
			duration: track.duration_ms,
		};
	}
}
