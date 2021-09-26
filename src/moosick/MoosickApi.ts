import type {
	Album,
	AlbumURL,
	Artist,
	ArtistExtended,
	ArtistURL,
	Category,
	ContinuablePlaylistURL,
	ContinuableResult,
	ContinuableUnsorted,
	Playlist,
	SearchSuggestions,
	Song,
	Video,
	YoutubeMoosick,
} from 'youtube-moosick';
import { MoosickRequester } from './MoosickRequester.js';

type Interfacify<T> = {
	[P in keyof T]: T[P];
};

export class MoosickApi implements Interfacify<YoutubeMoosick> {
	public static async new<T = YoutubeMoosick>(): Promise<T> {
		return new MoosickApi() as unknown as T;
	}

	public async getSearchSuggestions(
		query: string,
	): Promise<SearchSuggestions[]> {
		return MoosickRequester.request('getSearchSuggestions', query);
	}

	public async search<T extends undefined>(
		query: string,
		searchType?: T,
	): Promise<ContinuableUnsorted>;
	public async search<T extends Category.VIDEO>(
		query: string,
		searchType?: T,
	): Promise<ContinuableResult<Video>>;
	public async search<T extends Category.SONG>(
		query: string,
		searchType?: T,
	): Promise<ContinuableResult<Song>>;
	public async search<T extends Category.PLAYLIST>(
		query: string,
		searchType?: T,
	): Promise<ContinuableResult<Playlist>>;
	public async search<T extends Category.ARTIST>(
		query: string,
		searchType?: T,
	): Promise<ContinuableResult<ArtistExtended>>;
	public async search<
		T extends Category.ALBUM | Category.EP | Category.SINGLE,
	>(query: string, searchType?: T): Promise<ContinuableResult<Album>>;
	public async search<T extends Category>(
		query: string,
		searchType?: T,
	): Promise<ContinuableResult<Video | Song | Playlist | Artist | Album>> {
		return MoosickRequester.request('search', query, searchType);
	}

	public async getAlbum(browseId: string): Promise<AlbumURL> {
		return MoosickRequester.request('getAlbum', browseId);
	}

	public async getPlaylist(
		browseId: string,
		contentLimit?: number,
	): Promise<ContinuablePlaylistURL> {
		return MoosickRequester.request('getPlaylist', browseId, contentLimit);
	}

	public async getArtist(browseId: string): Promise<ArtistURL> {
		return MoosickRequester.request('getArtist', browseId);
	}
}
