import { Item } from '../resources/blocks/classes/item/Item.js';
import { TimeUtility } from '../resources/utilities/TimeUtility.js';

export abstract class AbstractQueueItem extends Item {
	public declare title: string;
	public declare artist: string;
	public declare duration: number;
	public abstract id: string | Promise<string>;
	public declare playlistId?: string;
	public abstract url: string | Promise<string>;

	public override readonly toString = () => {
		return `${this.getSimpleTitle()} — ${TimeUtility.hhmmss(
			this.duration,
		)}`;
	};

	public abstract readonly toMarkdown: () => string | Promise<string>;

	public readonly getSimpleTitle = () => {
		return this.title.includes(' - ')
			? this.title
			: `${this.artist} - ${this.title}`;
	};

	public abstract readonly clone: () => AbstractQueueItem;
}
