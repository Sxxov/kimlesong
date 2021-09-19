import { WalkUtility } from '../../../utilities';
import type { Item } from './Item.js';

export abstract class Factory<R extends Item, T extends Partial<Item> = R> {
	constructor(private Item: new () => R) {}

	public create(options: T): R {
		const instance = new this.Item();

		WalkUtility.mirror(options as unknown as R, instance);

		return instance;
	}
}
