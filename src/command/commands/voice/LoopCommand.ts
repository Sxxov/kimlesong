import type { MessageEmbed } from 'discord.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { AbstractVoiceCommand } from '../AbstractVoiceCommand.js';

export class LoopCommand extends AbstractVoiceCommand {
	public static override id = 'loop';
	public static override description =
		'enables/disables looping of the queue.';

	public static override aliases = ['l'];

	public override async getEmbed(
		info: CommandBlueprint,
	): Promise<MessageEmbed> {
		if (this.ctx.unsubscribeQueueLoop != null) {
			this.ctx.unsubscribeQueueLoop();
			this.ctx.unsubscribeQueueLoop = null;

			if (this.ctx.queueLoopedItemsStartIndex != null) {
				this.ctx.previousQueue.push(
					...this.ctx.queue.splice(
						this.ctx.queueLoopedItemsStartIndex,
						this.ctx.queue.length,
					),
				);
				this.ctx.queueLoopedItemsStartIndex = null;
			}

			return (await super.getEmbed(info)).setDescription(
				'disabled queue loop',
			);
		}

		this.ctx.queueLoopedItemsStartIndex = this.ctx.queue.length;
		this.ctx.previousQueue.value.push(...this.ctx.queue.value);
		this.ctx.unsubscribeQueueLoop = this.ctx.previousQueue.subscribe(
			(previousQueue) => {
				if (previousQueue.length <= 0) return;

				const loopItems = this.ctx.previousQueue.value.splice(
					0,
					this.ctx.queue.length
						+ (previousQueue.length - this.ctx.queue.length) / 2,
				);

				this.ctx.queueLoopedItemsStartIndex! -= loopItems.length;
				this.ctx.queueLoopedItemsStartIndex ||= this.ctx.queue.length;

				this.ctx.queue.push(...loopItems);
			},
		);

		return (await super.getEmbed(info)).setDescription(
			'enabled queue loop',
		);
	}
}
