import type { AsyncQueueItem } from '../../queue/AsyncQueueItem.js';
import type { SyncQueueItem } from '../../queue/SyncQueueItem.js';
import { ClientError } from '../../resources/errors/ClientError.js';

export class PlayFailureError extends ClientError {
	constructor(queueItem: AsyncQueueItem | SyncQueueItem) {
		super(`i can't seem to play ${queueItem.getSimpleTitle()}.`);
	}
}
