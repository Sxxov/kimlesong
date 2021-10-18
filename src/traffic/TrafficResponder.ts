import type { Worker } from 'worker_threads';
import { AbstractTrafficRequest } from './requests/AbstractTrafficRequest.js';
import { PriorityTrafficRequest } from './requests/PriorityTrafficRequest.js';
import { NotOkTrafficResponse } from './responses/NotOkTrafficResponse.js';
import { OkTrafficResponse } from './responses/OkTrafficResponse.js';
import { TrafficRequestPriorities } from './TrafficRequestPriorities.js';
import { TrafficRequestState } from './TrafficRequestState.js';

export class TrafficResponder {
	private messageIdToState = new Map<string, TrafficRequestState>();
	private guildIdToWorkerCount: Map<string, number> = new Map();

	constructor() {
		// handle possible null guildId requests & just respond immediately
		this.guildIdToWorkerCount.set(String(null), 1);
	}

	public register(worker: Worker) {
		worker.on('message', (message) => {
			this.onMessage(message, worker);
		});
	}

	private onMessage(message: any, worker: Worker) {
		if (
			(message as AbstractTrafficRequest)?.type
			!== AbstractTrafficRequest.TYPE
		) {
			return;
		}

		if (
			this.assertType<PriorityTrafficRequest>(message)
			&& message.name === PriorityTrafficRequest.name
		) {
			const { messageId } = message;
			let state = this.messageIdToState.get(messageId);

			if (state == null) {
				state = new TrafficRequestState();
				this.messageIdToState.set(messageId, state);
			}

			state.requests.push(message);
			state.workers.push(worker);

			switch (message.priority) {
				case TrafficRequestPriorities.LOW:
					if (
						state.requests.length >= message.clientsInChannel
						&& !state.isResponded
					) {
						state.isResponded = true;

						const [firstWorker, ...restWorkers] = state.workers;

						firstWorker.postMessage(
							new OkTrafficResponse(messageId),
						);
						restWorkers.forEach((worker) => {
							worker.postMessage(
								new NotOkTrafficResponse(messageId),
							);
						});
					}

					break;
				case TrafficRequestPriorities.HIGH:
					if (state.isResponded) {
						worker.postMessage(new NotOkTrafficResponse(messageId));
					} else {
						state.isResponded = true;
						worker.postMessage(new OkTrafficResponse(messageId));
					}

					break;
				default:
			}

			if (state.requests.length >= message.clientsInChannel) {
				this.messageIdToState.delete(messageId);
			}
		}
	}

	private assertType<T>(obj: T): obj is T {
		return true;
	}
}
