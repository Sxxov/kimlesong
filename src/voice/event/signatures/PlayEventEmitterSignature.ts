import type { VoiceConnection } from '@discordjs/voice';
import type { AsyncQueueItem } from '../../../queue/AsyncQueueItem.js';
import type { SyncQueueItem } from '../../../queue/SyncQueueItem.js';
import type { Signaturify } from '../emitters/TypedEventEmitter.js';
import type { PlayEventNames } from '../names/PlayEventNames.js';

export type PlayEventEmitterSignature = Signaturify<
	IPlayEventEmitterSignature,
	keyof IPlayEventEmitterSignature
>;

interface IPlayEventEmitterSignature {
	[PlayEventNames.ERROR]: (error: Error) => void;
	[PlayEventNames.START]: (queueItem: AsyncQueueItem | SyncQueueItem) => void;
	[PlayEventNames.INTERRUPT]: (
		queueItem: AsyncQueueItem | SyncQueueItem,
	) => void;
	[PlayEventNames.END]: (queueItem: AsyncQueueItem | SyncQueueItem) => void;
	[PlayEventNames.CONNECT]: (connection: VoiceConnection) => void;
}
