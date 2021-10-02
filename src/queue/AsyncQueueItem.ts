import { TimeUtility } from '../resources/utilities/TimeUtility.js';
import { AbstractQueueItem } from './AbstractQueueItem.js';

export class AsyncQueueItem extends AbstractQueueItem {
	public declare id: Promise<string | null>;
	public declare url: Promise<string | null>;
	public declare externalUrl?: string;

	public readonly toMarkdown = async (isRealUrlPrioritized = false) => {
		return `[${this.getSimpleTitle()}](${
			isRealUrlPrioritized
				? (await this.url) ?? 'idk'
				: this.externalUrl ?? (await this.url) ?? 'idk'
		}) — \`${TimeUtility.hhmmss(this.duration)}\``;
	};

	public override readonly clone = (): AsyncQueueItem => {
		return AsyncQueueItem.from(this);
	};
}
