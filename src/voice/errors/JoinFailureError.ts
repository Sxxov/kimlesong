import { ClientError } from '../../resources/errors/ClientError.js';

export class JoinFailureError extends ClientError {
	constructor(channelName?: string) {
		super(
			channelName
				? `i can't seem to join #${channelName}.`
				: "the channel i tried to join doesn't seem to exist??",
		);
	}
}
