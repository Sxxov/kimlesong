import type { Worker } from 'worker_threads';
import { IllegalStateError } from '../resources/errors/IllegalStateError.js';
import { PriorityRequest } from './requests/PriorityRequest.js';
import { NotOkResponse } from './responses/NotOkResponse.js';
import { OkResponse } from './responses/OkResponse.js';
import { RequestPriorities } from './TrafficRequestPriorities.js';
import { TrafficRequestState } from './TrafficRequestState.js';

export class TrafficResponder {
	private messageIdToState = new Map<string, TrafficRequestState>();
	private workerCount: number;

	constructor(workers: Worker[]) {
		this.workerCount = workers.length;

		workers.forEach((worker) => {
			worker.on('message', (message) => {
				this.onMessage(message, worker);
			});
		});
	}

	private onMessage(message: PriorityRequest, worker: Worker) {
		if (message.name !== PriorityRequest.name)
			throw new IllegalStateError(
				'Worker requested with unknown request type',
			);

		const { messageId } = message;
		let state = this.messageIdToState.get(messageId);

		if (state == null) {
			state = new TrafficRequestState();
			this.messageIdToState.set(messageId, state);
		}

		state.requests.push(message);
		state.workers.push(worker);

		switch (message.priority) {
			case RequestPriorities.LOW:
				if (
					state.requests.length >= this.workerCount
					&& !state.isResponded
				) {
					state.isResponded = true;

					const [firstWorker, ...restWorkers] = state.workers;

					firstWorker.postMessage(new OkResponse(messageId));
					restWorkers.forEach((worker) => {
						worker.postMessage(new NotOkResponse(messageId));
					});
				}

				break;
			case RequestPriorities.HIGH:
				if (state.isResponded) {
					worker.postMessage(new NotOkResponse(messageId));
				} else {
					state.isResponded = true;
					worker.postMessage(new OkResponse(messageId));
				}

				break;
			default:
		}

		if (state.requests.length >= this.workerCount) {
			this.messageIdToState.delete(messageId);
		}
	}
}
