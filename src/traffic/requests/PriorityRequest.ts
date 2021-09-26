import type { RequestPriorities } from '../TrafficRequestPriorities.js';
import { AbstractRequest } from './AbstractRequest.js';

export class PriorityRequest extends AbstractRequest {
	constructor(messageId: string, public priority: RequestPriorities) {
		super(messageId);
	}
}
