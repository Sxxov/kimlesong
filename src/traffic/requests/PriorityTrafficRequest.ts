import type { TrafficRequestPriorities } from '../TrafficRequestPriorities.js';
import { AbstractTrafficRequest } from './AbstractTrafficRequest.js';

export class PriorityTrafficRequest extends AbstractTrafficRequest {
	constructor(
		public messageId: string,
		public clientsInChannel: number,
		public priority: TrafficRequestPriorities,
	) {
		super();
	}
}
