import type { MessagePort } from 'worker_threads';
import type { ContinuableResult, YoutubeMoosick } from 'youtube-moosick';
import { IllegalStateError } from '../resources/errors/IllegalStateError.js';
import { WalkUtility } from '../resources/utilities/WalkUtility.js';
import { MoosickContinuationRequest } from './requests/MoosickContinuationRequest.js';
import { MoosickMethodRequest } from './requests/MoosickMethodRequest.js';
import { MoosickContinuationResponse } from './responses/MoosickContinuationResponse.js';
import { MoosickMethodResponse } from './responses/MoosickMethodResponse.js';

export class MoosickResponder {
	private requestIdToContinuable: Map<
		string,
		ContinuableResult<any, any, any>
	> = new Map();

	constructor(private worker: MessagePort, private ytm: YoutubeMoosick) {
		worker.on('message', async (message) => {
			await this.onMessage(message);
		});
	}

	private async onMessage(message: any) {
		if (
			(message as MoosickContinuationRequest).name
				=== MoosickContinuationRequest.name
			&& this.assertType<MoosickContinuationRequest>(message)
		) {
			const result = await this.requestIdToContinuable
				.get(message.methodRequestId)
				?.loadNext();

			this.worker.postMessage(
				new MoosickContinuationResponse(
					result ?? null,
					message.methodRequestId,
				),
			);

			return;
		}

		if (
			(message as MoosickMethodRequest<keyof YoutubeMoosick>).name
				=== MoosickMethodRequest.name
			&& this.assertType<MoosickMethodRequest<keyof YoutubeMoosick>>(
				message,
			)
		) {
			// @ts-expect-error message.params is the params of the method
			const result = await this.ytm[message.method](...message.params);

			this.storeContinuable(result, message.id);
			this.removeUnclonables(result);

			this.worker.postMessage(
				new MoosickMethodResponse(result, message.id),
			);

			return;
		}

		throw new IllegalStateError(
			'Worker requested with unknown request type',
		);
	}

	private storeContinuable(
		result: ContinuableResult<any, any, any> | Record<string, any>,
		requestId: string,
	) {
		if (result.loadNext != null) {
			this.requestIdToContinuable.set(
				requestId,
				result as ContinuableResult<any, any, any>,
			);
		}
	}

	private removeUnclonables(obj: Record<string | number | symbol, any>) {
		WalkUtility.walkAndReturnVoid(obj, (leaf, key, parent) => {
			if (typeof leaf === 'function') {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-dynamic-delete
				delete parent[key!];
			}
		});
	}

	private assertType<T>(obj: T): obj is T {
		return true;
	}
}
