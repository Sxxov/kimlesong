import type { AbstractQueueItem } from './AbstractQueueItem.js';
import type { AsyncQueueItem } from './AsyncQueueItem.js';
import type { SyncQueueItem } from './SyncQueueItem.js';

export class QueueArray<
	T extends AbstractQueueItem = AsyncQueueItem | SyncQueueItem,
> extends Array<T> {
	constructor(
		length = 0,
		public unfilteredLength = length,
		public isLargePlaylist = unfilteredLength >= 100,
	) {
		super(length);
	}

	public static isQueueArray(
		array: (AsyncQueueItem | SyncQueueItem)[] | QueueArray,
	) {
		return (
			this.isArray(array)
			&& typeof (array as QueueArray).unfilteredLength === 'number'
			&& typeof (array as QueueArray).isLargePlaylist === 'number'
		);
	}

	public static extend<
		T extends AbstractQueueItem = AsyncQueueItem | SyncQueueItem,
	>(
		array: T[],
		unfilteredLength = array.length,
		isLargePlaylist = unfilteredLength >= 100,
	) {
		(array as QueueArray<T>).unfilteredLength = unfilteredLength;
		(array as QueueArray<T>).isLargePlaylist = isLargePlaylist;

		return array as QueueArray<T>;
	}
}
