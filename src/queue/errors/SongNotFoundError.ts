import { ClientError } from '../../resources/errors/ClientError.js';

export class SongNotFoundError extends ClientError {
	constructor() {
		super("i can't seem to find a source for the song.");
	}
}
