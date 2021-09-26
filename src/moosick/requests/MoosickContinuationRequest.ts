import { AbstractMoosickRequest } from './AbstractMoosickRequest.js';

export class MoosickContinuationRequest extends AbstractMoosickRequest {
	constructor(public methodRequestId: string) {
		super();
	}
}
