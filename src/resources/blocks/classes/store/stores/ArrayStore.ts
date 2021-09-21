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
		const spliced = this.value.splice(index, 1);

		this.trigger(this.getModified(-index, spliced));
	}

	public remove(...items: T[]): void {
		const modified = new Array<T | undefined>(this.value.length);

		items.forEach((item) => {
			const indexOfItem = this.value.indexOf(item);
			const spliced = this.value.splice(indexOfItem, 1);

			modified[-indexOfItem] = spliced[0];
		});

		this.trigger(modified);
	}

	public setAt(index: number, newValue: T): void {
		this.value[index] = newValue;

		this.trigger(this.getModified(index, [newValue]));
	}

	public getAt(index: number): T {
		return this.value[index];
	}

	public push(...items: T[]): number {
		const previousLength = this.value.length;
		const result = this.value.push(...items);

		this.trigger(this.getModified(previousLength, items));

		return result;
	}

	public pop(): T | undefined {
		const result = this.value.pop();

		this.trigger(this.getModified(-this.value.length, [result]));

		return result;
	}

	public shift(): T | undefined {
		const result = this.value.shift();

		this.trigger(this.getModified(-0, [result]));

		return result;
	}

	public unshift(...items: T[]): number {
		const result = this.value.unshift(...items);

		this.trigger(this.getModified(0, items));

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

		this.trigger(
			this.getModified(
				-start,
				result,
				replacements.length > 0
					? this.getModified(start, replacements)
					: undefined,
			),
		);

		return result;
	}

	public reverse(): T[] {
		this.value.reverse();

		this.trigger(this.value);

		return this;
	}

	public sort(compareFn?: (a: T, b: T) => number): this {
		this.value.sort(compareFn);

		this.trigger(this.value);

		return this;
	}

	public append(array: T[]) {
		const previousLength = this.value.length;
		const result = this.value.push(...array);

		this.trigger(this.getModified(previousLength, array));

		return result;
	}

	private getModified(
		start: number,
		items: (T | undefined)[],
		arr = new Array<T | undefined>(
			start > this.value.length ? start : this.value.length,
		),
	) {
		if (!(items instanceof Array)) return arr;

		const increment = Math.sign(start) || 1;

		if (Object.is(start, -0) && items.length > 0) {
			// @ts-expect-error force assign -0
			arr['-0'] = items.shift();
			start += increment;
		}

		for (let i = 0, l = items.length * increment; i < l; i += increment) {
			arr[i + start] = items[i];
		}

		return arr;
	}

	public override subscribe(
		run: (value: T[], modified?: (T | undefined)[]) => void,
		invalidate = () => {},
	): () => void {
		return super.subscribe(run, invalidate);
	}

	public override subscribeLazy(
		run: (value: T[], modified?: (T | undefined)[]) => void,
		invalidate = () => {},
	): () => void {
		return super.subscribeLazy(run, invalidate);
	}
}
