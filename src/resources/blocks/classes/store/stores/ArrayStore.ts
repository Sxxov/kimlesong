import { ExtendableStore } from './ExtendableStore.js';

export type ArrayStorify<T extends any[]> = T extends (infer U)[]
	? ArrayStore<U>
	: never;

export interface ArrayStore<T = unknown>
	extends ExtendableStore<T[]>,
		Array<T> {}

export class ArrayStore<T = unknown> extends ExtendableStore<T[]> {
	private currentLength = 0;

	constructor(length = 0, isWritable?: boolean) {
		super(new Array<T>(length), isWritable);
	}

	public [Symbol.iterator](): IterableIterator<T> {
		return this.value.values();
	}

	public get length(): number {
		return this.value.length;
	}

	public removeAt(index: number): void {
		this.value.splice(index, 1);

		this.trigger();
	}

	public remove(...items: T[]): void {
		items.forEach((item) => {
			const indexOfItem = this.value.indexOf(item);
			this.value.splice(indexOfItem, 1);
		});

		this.trigger();
	}

	public setAt(index: number, newValue: T): T {
		this.value[index] = newValue;

		this.trigger();

		return newValue;
	}

	public getAt(index: number): T {
		return this.value[index];
	}

	public push(...items: T[]): number {
		const result = this.value.push(...items);

		this.trigger();

		return result;
	}

	public pop(): T | undefined {
		const result = this.value.pop();

		this.trigger();

		return result;
	}

	public shift(): T | undefined {
		const result = this.value.shift();

		this.trigger();

		return result;
	}

	public unshift(...items: T[]): number {
		const result = this.value.unshift(...items);

		this.trigger();

		return result;
	}

	public splice(start: number, deleteCount?: number): T[];
	public splice(
		start: number,
		deleteCount: number,
		...replacements: T[]
	): T[];
	public splice(
		start: number,
		deleteCount?: number,
		...replacements: T[]
	): T[] {
		const result =
			replacements.length > 0
				? this.value.splice(start, deleteCount!, ...replacements)
				: this.value.splice(start, deleteCount);

		this.trigger();

		return result;
	}

	public reverse(): T[] {
		this.value.reverse();

		this.trigger();

		return this;
	}

	public sort(compareFn?: (a: T, b: T) => number): this {
		this.value.sort(compareFn);

		this.trigger();

		return this;
	}

	public append(array: T[]) {
		const result = this.value.push(...array);

		this.trigger();

		return result;
	}
}
