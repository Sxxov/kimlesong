import { parentPort } from 'worker_threads';
import type {
	ContinuablePlaylistURL,
	ContinuableResult,
	ContinuableResultBlueprint,
	YoutubeMoosick,
} from 'youtube-moosick';
import type { Item } from 'youtube-moosick/dist/cjs/blocks/item';
import { MoosickContinuationRequest } from './requests/MoosickContinuationRequest.js';
import { MoosickMethodRequest } from './requests/MoosickMethodRequest.js';
import type { MoosickContinuationResponse } from './responses/MoosickContinuationResponse.js';
import type { MoosickMethodResponse } from './responses/MoosickMethodResponse.js';

export class MoosickRequester {
	public static async requestContinuation<T extends Item>(
		methodRequestId: string,
	): Promise<ContinuableResultBlueprint<T> | null> {
		const request = new MoosickContinuationRequest(methodRequestId);
		parentPort?.postMessage(request);

		return new Promise<ContinuableResultBlueprint<T> | null>((resolve) => {
			parentPort?.on(
				'message',
				function onMessage(message: MoosickContinuationResponse<T>) {
					if (message.methodRequestId !== request.methodRequestId)
						return;

					resolve(message.result);

					parentPort?.off('message', onMessage);
				},
			);
		});
	}

	public static async request<MethodName extends keyof YoutubeMoosick>(
		method: MethodName,
		...params: Parameters<YoutubeMoosick[MethodName]>
	): Promise<ReturnType<YoutubeMoosick[MethodName]>> {
		const request = new MoosickMethodRequest(method, params);
		parentPort?.postMessage(request);

		return new Promise<ReturnType<YoutubeMoosick[MethodName]>>(
			(resolve) => {
				parentPort?.on(
					'message',
					function onMessage(
						message: MoosickMethodResponse<
							ReturnType<YoutubeMoosick[MethodName]>
						>,
					) {
						if (message.id !== request.id) return;

						resolve(
							MoosickRequester.applyLoadNextProxy(
								message.result,
								message.id,
							),
						);

						parentPort?.off('message', onMessage);
					},
				);
			},
		);
	}

	private static applyLoadNextProxy<T>(
		result: T,
		methodRequestId: string,
	): T {
		(result as unknown as ContinuableResult<any, any, any>).loadNext =
			async () => MoosickRequester.requestContinuation(methodRequestId);

		if (
			(result as unknown as ContinuablePlaylistURL).playlistContents
			!= null
		) {
			(
				result as unknown as ContinuablePlaylistURL
			).playlistContents.loadNext = async () =>
				MoosickRequester.requestContinuation(methodRequestId);
		}

		return result;
	}
}
