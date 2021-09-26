import type { Worker } from 'worker_threads';
import type { PriorityRequest } from './requests/PriorityRequest.js';

export class TrafficRequestState {
	public isResponded = false;

	constructor(
		public requests: PriorityRequest[] = [],
		public workers: Worker[] = [],
	) {}
}
