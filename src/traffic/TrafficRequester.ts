import { parentPort } from 'worker_threads';
import { IllegalStateError } from '../resources/errors/IllegalStateError.js';
import { RequestPriorities } from './TrafficRequestPriorities.js';
import { PriorityRequest } from './requests/PriorityRequest.js';
import type { AbstractResponse } from './responses/AbstractResponse.js';
import { NotOkResponse } from './responses/NotOkResponse.js';
import { OkResponse } from './responses/OkResponse.js';

export class TrafficRequester {
	public static async requestError(messageId: string) {
		return this.request(messageId, RequestPriorities.LOW);
	}

	public static async request(
		messageId: string,
		priority = RequestPriorities.HIGH,
	) {
		parentPort?.postMessage(new PriorityRequest(messageId, priority));

		return new Promise<boolean>((resolve) => {
			parentPort?.on(
				'message',
				function onMessage(message: AbstractResponse) {
					if (message.messageId !== messageId) return;

					switch (message.name) {
						case OkResponse.name:
							resolve(true);
							break;
						case NotOkResponse.name:
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
