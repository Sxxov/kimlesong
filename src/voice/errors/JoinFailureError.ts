import { ClientError } from '../../resources/errors/ClientError.js';

export class JoinFailureError extends ClientError {
	constructor() {
		super('failed to join the voice channel.');
	}
}
