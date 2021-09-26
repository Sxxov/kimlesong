import { TimeUtility } from '../resources/utilities/time.utility.js';
import { AbstractQueueItem } from './AbstractQueueItem.js';

export class SyncQueueItem extends AbstractQueueItem {
	public declare id: string;
	public declare url: string;

	public readonly toMarkdown = () => {
		return `[${this.getSimpleTitle()}](${
			this.url
		}) — \`${TimeUtility.hhmmss(this.duration)}\``;
	};

	public override readonly clone = (): SyncQueueItem => {
		return SyncQueueItem.from(this);
	};
}
