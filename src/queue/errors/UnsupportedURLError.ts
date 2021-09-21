import { ClientError } from '../../resources/errors/ClientError.js';

export class UnsupportedURLError extends ClientError {
	constructor() {
		super("that url's unsupported.");
	}
}
