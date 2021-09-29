export const enum PlayQueueEventNames {
	/** fired after playing was interrupted */
	INTERRUPT = 'interrupt',
	/** fired after an error is thrown */
	ERROR = 'error',
	/** fired after a queue item has been queued to play, but may not have started actually emitting sound */
	QUEUE_ITEM_START = 'queueItem.start',
	/** fired after a queue item was successfully played to the end */
	QUEUE_ITEM_END = 'queueItem.end',
	/** fired after the play queue successfully started playing */
	QUEUE_START = 'queue.start',
	/** fired after QUEUE_ITEM_END & there's no more songs */
	QUEUE_END = 'queue.end',
}
