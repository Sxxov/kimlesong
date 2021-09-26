import { parentPort } from 'worker_threads';
import { IllegalStateError } from '../resources/errors/IllegalStateError.js';
import { RequestPriorities } from './TrafficRequestPriorities.js';
import { PriorityTrafficRequest } from './requests/PriorityTrafficRequest.js';
import type { AbstractTrafficResponse } from './responses/AbstractTrafficResponse.js';
import { NotOkTrafficResponse } from './responses/NotOkTrafficResponse.js';
import { OkTrafficResponse } from './responses/OkTrafficResponse.js';

export class TrafficRequester {
	public static async requestError(messageId: string) {
		return this.request(messageId, RequestPriorities.LOW);
	}

	public static async request(
		messageId: string,
		priority = RequestPriorities.HIGH,
	) {
		parentPort?.postMessage(
			new PriorityTrafficRequest(messageId, priority),
		);

		return new Promise<boolean>((resolve) => {
			parentPort?.on(
				'message',
				function onMessage(message: AbstractTrafficResponse) {
					if (message.messageId !== messageId) return;

					switch (message.name) {
						case OkTrafficResponse.name:
							resolve(true);
							break;
						case NotOkTrafficResponse.name:
							resolve(false);
							break;
						default:
							throw new IllegalStateError(
								'Main thread responded with invalid response type',
							);
					}

					parentPort?.off('message', onMessage);
				},
			);
		});
	}
}
