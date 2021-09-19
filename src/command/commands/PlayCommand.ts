import { AbstractCommand } from './AbstractCommand.js';

export class PlayCommand extends AbstractCommand {
	public name = 'play';
	public description =
		'Plays the requested song/playlist from Youtube/Spotify';

	public onAddLargePlaylist(): string {
		throw new Error('Method not implemented.');
	}

	public reply(): string {
		throw new Error('Method not implemented.');
	}
}
