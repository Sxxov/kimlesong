import { AbstractMoosickResponse } from './AbstractMoosickResponse.js';

export class MoosickMethodResponse<R = void> extends AbstractMoosickResponse {
	constructor(public result: R, public id: string) {
		super();
	}
}
