import type { PlayEventEmitterSignature } from '../signatures/PlayEventEmitterSignature.js';
import { TypedEventEmitter } from './TypedEventEmitter.js';

export class PlayEventEmitter extends TypedEventEmitter<PlayEventEmitterSignature> {}
