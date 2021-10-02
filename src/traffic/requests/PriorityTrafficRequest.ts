import type { TrafficRequestPriorities } from '../TrafficRequestPriorities.js';
import { AbstractTrafficRequest } from './AbstractTrafficRequest.js';

export class PriorityTrafficRequest extends AbstractTrafficRequest {
	constructor(messageId: string, public priority: TrafficRequestPriorities) {
		super(messageId);
	}
}
