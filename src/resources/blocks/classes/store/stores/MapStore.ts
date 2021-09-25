import { ExtendableStore } from './ExtendableStore.js';

export type MapStorify<T extends Map<any, any>> = T extends Map<
	infer K,
	infer V
>
	? MapStore<K, V>
	: never;

// @ts-expect-error Forcefully override `#set`
export interface MapStore<K = string, V = unknown>
	extends ExtendableStore<Map<K, V>>,
		Pick<Map<K, V>, Exclude<keyof Map<K, V>, 'set'>> {}

export class MapStore<K = string, V = unknown> extends ExtendableStore<
	Map<K, V>
> {
	constructor(isWritable?: boolean) {
		super(new Map(), isWritable);
	}

	// @ts-expect-error Forcefully override `#set`
	public override set(key: K, value: V): this {
		this.value.set(key, value);

		this.trigger();

		return this;
	}

	public setStore(value: this) {
		super.set(value);
	}

	public delete(key: K): boolean {
		const result = this.value.delete(key);

		if (result) {
			this.trigger();
		}

		return result;
	}

	public clear(): void {
		this.value.clear();

		this.trigger();
	}

	public getOrAssign(key: K, value: V) {
		let result = this.get(key);

		if (result === undefined) {
			result = value;
			this.set(key, value);
		}

		return result;
	}

	public getOrAssignFromFactory(key: K, valueFactory: () => V) {
		let result = this.get(key);

		if (result === undefined) {
			result = valueFactory();
			this.set(key, result);
		}

		return result;
	}
}
