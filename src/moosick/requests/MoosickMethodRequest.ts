import type { YoutubeMoosick } from 'youtube-moosick';
import { AbstractMoosickRequest } from './AbstractMoosickRequest.js';

export class MoosickMethodRequest<
	MethodName extends keyof YoutubeMoosick,
> extends AbstractMoosickRequest {
	public id = String(Date.now() * Math.random());

	constructor(
		public method: MethodName,
		public params: Parameters<YoutubeMoosick[MethodName]>,
	) {
		super();
	}
}
