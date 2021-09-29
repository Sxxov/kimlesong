import type { AsyncQueueItem } from '../../../queue/AsyncQueueItem.js';
import type { SyncQueueItem } from '../../../queue/SyncQueueItem.js';
import type { Signaturify } from '../emitters/TypedEventEmitter.js';
import type { PlayQueueEventNames } from '../names/PlayQueueEventNames.js';

export type PlayQueueEventEmitterSignature = Signaturify<
	IPlayQueueEventEmitterSignature,
	keyof IPlayQueueEventEmitterSignature
>;

interface IPlayQueueEventEmitterSignature {
	[PlayQueueEventNames.ERROR]: (error: Error) => void;
	[PlayQueueEventNames.INTERRUPT]: (
		queueItem: AsyncQueueItem | SyncQueueItem,
	) => void;
	[PlayQueueEventNames.QUEUE_ITEM_START]: (
		queueItem: AsyncQueueItem | SyncQueueItem,
	) => void;
	[PlayQueueEventNames.QUEUE_ITEM_END]: (
		queueItem: AsyncQueueItem | SyncQueueItem,
	) => void;
	[PlayQueueEventNames.QUEUE_START]: (
		queue: (AsyncQueueItem | SyncQueueItem)[],
	) => void;
	[PlayQueueEventNames.QUEUE_END]: (
		queue: (AsyncQueueItem | SyncQueueItem)[],
	) => void;
}
