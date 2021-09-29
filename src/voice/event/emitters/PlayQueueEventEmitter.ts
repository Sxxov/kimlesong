import type { PlayQueueEventEmitterSignature } from '../signatures/PlayQueueEventEmitterSignature.js';
import { TypedEventEmitter } from './TypedEventEmitter.js';

export class PlayQueueEventEmitter extends TypedEventEmitter<PlayQueueEventEmitterSignature> {}
