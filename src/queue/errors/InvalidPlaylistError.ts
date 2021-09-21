import { ClientError } from '../../resources/errors/ClientError.js';

export class InvalidPlaylistError extends ClientError {
	constructor() {
		super("that playlist's invalid.");
	}
}
