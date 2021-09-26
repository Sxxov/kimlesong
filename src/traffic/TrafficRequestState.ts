import type { Worker } from 'worker_threads';
import type { PriorityTrafficRequest } from './requests/PriorityTrafficRequest.js';

export class TrafficRequestState {
	public isResponded = false;

	constructor(
		public requests: PriorityTrafficRequest[] = [],
		public workers: Worker[] = [],
	) {}
}
