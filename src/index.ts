import type { Worker } from 'worker_threads';
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
	private clientWorkers: Worker[] = [];
	private moosickWorker = new WorkerFactory('MoosickWorker.js').create();
	private trafficResponder: TrafficResponder;

	constructor() {
		DiscordCredentials.forEach(this.registerClientWorker.bind(this));

		this.trafficResponder = new TrafficResponder(this.clientWorkers);
	}

	private registerClientWorker(discordCredentials: ClientCredentialsItem) {
		const worker = new WorkerFactory('ClientWorker.js').create({
			discordCredentials,
			spotifyCredentials: SpotifyCredentials[0],
		});

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

		this.clientWorkers.push(worker);
	}
}

// eslint-disable-next-line no-new
new KimLeSong();
