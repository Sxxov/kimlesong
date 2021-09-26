import type { ContinuableResultBlueprint } from 'youtube-moosick';
import type { Item } from 'youtube-moosick/dist/cjs/blocks/item';
import { AbstractMoosickResponse } from './AbstractMoosickResponse.js';

export class MoosickContinuationResponse<
	T extends Item,
> extends AbstractMoosickResponse {
	constructor(
		public result: ContinuableResultBlueprint<T> | null,
		public methodRequestId: string,
	) {
		super();
	}
}
