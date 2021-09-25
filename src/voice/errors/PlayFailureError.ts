import { ClientError } from '../../resources/errors/ClientError.js';

export class PlayFailureError extends ClientError {
	constructor() {
		super('failed to play in the voice channel.');
	}
}
