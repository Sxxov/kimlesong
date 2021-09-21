import { ClientError } from '../../resources/errors/ClientError.js';

export class InvalidSongError extends ClientError {
	constructor() {
		super("that song's invalid.");
	}
}
