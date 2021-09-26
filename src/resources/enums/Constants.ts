export const enum Constants {
	DEFAULT_PREFIX = '!',
	DEFAULT_NICKNAME = 'kimlesong (unstable)',

	SHARE_URLS = '**kimlesong1**: https://discord.com/oauth2/authorize?client_id=889171586760998942&permissions=2150631424&scope=bot%20applications.commands\n**kimlesong2**: https://discord.com/oauth2/authorize?client_id=891457379269488710&permissions=2150631424&scope=bot%20applications.commands',

	SPOTIFY_HOSTNAME = 'open.spotify.com',
	SPOTIFY_PATHNAME_SONG = '/track',
	SPOTIFY_PATHNAME_PLAYLIST = '/playlist',
	SPOTIFY_PATHNAME_ALBUM = '/album',

	YOUTUBE_HOSTNAME = 'youtube.com',
	YOUTUBE_WWW_HOSTNAME = 'www.youtube.com',
	YOUTUBE_MUSIC_HOSTNAME = 'music.youtube.com',
	YOUTUBE_PATHNAME_SONG = '/watch',
	YOUTUBE_PATHNAME_PLAYLIST = '/playlist',

	PLAYLIST_CONTENT_LIMIT = 100,

	EMBED_COLOUR = '#ff8585',
	EMBED_AUTHOR_DEFAULT_IMAGE = 'https://cdn.discordapp.com/app-icons/889171586760998942/cf3bae7e5db6462329a454dc0ecd3b42.png?size=512',
	EMBED_AUTHOR_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
	EMBED_TITLE_ERROR_INTERNAL = 'this is awkward—',
	EMBED_TITLE_ERROR_USER = 'oops!',

	EMBED_BUTTON_QUEUE_NEXT = 'queue.next',
	EMBED_BUTTON_QUEUE_REFRESH = 'queue.refresh',
	EMBED_BUTTON_QUEUE_PREVIOUS = 'queue.previous',

	EMBED_BUTTON_NOW_NEXT = 'now.next',
	EMBED_BUTTON_NOW_REPEAT = 'now.repeat',
	EMBED_BUTTON_NOW_PREVIOUS = 'now.previous',

	SLASH_ARGUMENT_NAME = 'stuff',

	COMMAND_MORE_TIMEOUT = 60000,
	COMMAND_QUEUE_PAGE_SIZE = 10,
}
