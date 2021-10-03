import { Log } from '../../log/Log.js';

export class ClientError extends Error {
	constructor(
		message = 'No message provided, an error with errors?',
		isSilent = false,
	) {
		super(message);
		this.name = this.constructor.name;

		// eslint is drunk
		// eslint-disable-next-line
		(Error as any).captureStackTrace?.(this, this.constructor);

		if (!isSilent) Log.debug(`new ${this.stack ?? this.message}`);
	}

	public static from<T extends ClientError>(
		obj: PlainErrorObject | Error,
	): T {
		const clientError = new this();

		clientError.name = obj.name;
		clientError.message = obj.message;
		clientError.stack = obj.stack;

		return clientError as T;
	}

	public toPlainObject(): PlainErrorObject {
		return {
			name: this.name,
			message: this.message,
			stack: this.stack,
		};
	}
}

export interface PlainErrorObject {
	name: string;
	message: string;
	stack?: string;
}
