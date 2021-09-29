import { EventEmitter } from 'events';
import type TypedEmitter from 'typed-emitter';

export type EventEmitterOptions = ConstructorParameters<typeof EventEmitter>[0];

export type Signaturify<Interface extends Record<IndexSignature, (...args: any[]) => void>, IndexSignature extends string | symbol = string | symbol> = {
	// @ts-expect-error typescript is lying it indexes fine
	[key in `${keyof Interface}`]: Interface[key];
};

export class TypedEventEmitter<Signatures extends Record<string | symbol, (...args: any[]) => void>> extends (
	EventEmitter as { new<T>(options?: EventEmitterOptions): TypedEmitter<T> }
)<Signatures> {}