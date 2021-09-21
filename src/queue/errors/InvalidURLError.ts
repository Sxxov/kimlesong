import { ClientError } from '../../resources/errors/ClientError.js';

export class InvalidURLError extends ClientError {
	constructor() {
		super("that url's invalid.");
	}
}
