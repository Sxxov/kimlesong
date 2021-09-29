import { TimeUtility } from '../resources/utilities/TimeUtility.js';
import { AbstractQueueItem } from './AbstractQueueItem.js';

export class AsyncQueueItem extends AbstractQueueItem {
	public declare id: Promise<string>;
	public declare url: Promise<string>;
	public declare externalUrl?: string;

	public readonly toMarkdown = async (isRealUrlPrioritized = false) => {
		return `[${this.getSimpleTitle()}](${
			isRealUrlPrioritized
				? await this.url
				: this.externalUrl ?? (await this.url)
		}) — \`${TimeUtility.hhmmss(this.duration)}\``;
	};

	public override readonly clone = (): AsyncQueueItem => {
		return AsyncQueueItem.from(this);
	};
}
