import { DiscordCredentials, SpotifyCredentials } from './Credentials.js';
import { WorkerFactory } from './worker/WorkerFactory.js';
import type { ClientCredentialsItem } from './client/ClientCredentialsItem.js';
import { TrafficResponder } from './traffic/TrafficResponder.js';
import { AbstractMoosickRequest } from './moosick/requests/AbstractMoosickRequest.js';
import type { MoosickContinuationResponse } from './moosick/responses/MoosickContinuationResponse.js';
import type { MoosickMethodResponse } from './moosick/responses/MoosickMethodResponse.js';
import type { MoosickMethodRequest } from './moosick/requests/MoosickMethodRequest.js';
import type { MoosickContinuationRequest } from './moosick/requests/MoosickContinuationRequest.js';

export class KimLeSong {
	private moosickWorker = new WorkerFactory('MoosickWorker.js').create();
	private trafficResponder = new TrafficResponder();

	constructor() {
		DiscordCredentials.forEach(this.registerClientWorker.bind(this));
	}

	private registerClientWorker(discordCredentials: ClientCredentialsItem) {
		const worker = new WorkerFactory('ClientWorker.js').create({
			discordCredentials,
			spotifyCredentials: SpotifyCredentials[0],
		});

		this.trafficResponder.register(worker);

		worker.setMaxListeners(100);

		worker.on('message', (request) => {
			if (
				(request as AbstractMoosickRequest)?.type
				=== AbstractMoosickRequest.TYPE
			) {
				const { moosickWorker } = this;

				moosickWorker.postMessage(request);
				moosickWorker.on(
					'message',
					function onMessage(
						response:
							| MoosickMethodResponse
							| MoosickContinuationResponse<any>,
					) {
						if (
							(response as MoosickMethodResponse).id
								=== (request as MoosickMethodRequest<any>).id
							|| (response as MoosickContinuationResponse<any>)
								.methodRequestId
								=== (request as MoosickContinuationRequest)
									.methodRequestId
						) {
							worker.postMessage(response);
							moosickWorker.off('message', onMessage);
						}
					},
				);
			}
		});
	}
}

// eslint-disable-next-line no-new
new KimLeSong();
