import { ClientError } from './ClientError.js';

export class UnsupportedOperationError extends ClientError {
	constructor(message: string) {
		super(`Unsupported operation${message ? `: ${message}` : ''}`);
	}
}
