import { ClientError } from './ClientError.js';

export class IllegalInvocationError extends ClientError {
	constructor(message: string, methodName?: string) {
		super(
			`Illegal invocation${methodName ? ` (to ${methodName})` : ''}${
				message ? `: ${message}` : ''
			}`,
		);
	}
}
