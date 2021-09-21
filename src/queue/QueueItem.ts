import { Item } from '../resources/blocks/classes/item/Item.js';
import { TimeUtility } from '../resources/utilities/time.utility.js';

export class QueueItem extends Item {
	public declare title: string;
	public declare artist: string;
	public declare duration: number;
	public declare id: string;
	public declare playlistId?: string;
	public declare url: string;

	public override readonly toString = () => {
		return `${this.artist} - ${this.title} — ${TimeUtility.hhmmss(
			this.duration,
		)}`;
	};

	public readonly toMarkdown = () => {
		return `[${this.artist} - ${this.title}](${
			this.url
		}) — \`${TimeUtility.hhmmss(this.duration)}\``;
	};
}
