import { ClientError } from './ClientError.js';

export class IllegalStateError extends ClientError {
	constructor(message: string) {
		super(`Illegal state${message ? `: ${message}` : ''}`);
	}
}
