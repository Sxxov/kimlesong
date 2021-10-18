import { ButtonInteraction, MessageButton, MessageEmbed } from 'discord.js';
import type { AsyncQueueItem } from '../../../queue/AsyncQueueItem.js';
import { Constants } from '../../../resources/enums/Constants.js';
import { CommandBlueprintAdapter } from '../../adapters/CommandBlueprintAdapter.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { AbstractVoiceCommand } from '../AbstractVoiceCommand.js';

export class NowCommand extends AbstractVoiceCommand {
	public static override id = 'now';
	public static override description = "shows what's playing now.";
	public static override aliases = ['n'];

	public override async getEmbed(
		info: CommandBlueprint,
	): Promise<MessageEmbed> {
		const { queue } = this.ctx;

		if (queue == null) return NowCommand.errorInternal();

		if (queue.length <= 0) {
			return (await super.getEmbed(info)).setDescription(
				'nothing playing.',
			);
		}

		const queueItem = queue.getAt(0);

		return (await super.getEmbed(info)).setDescription(
			`playing [\`${String(this.ctx.previousQueue.length + 1).padStart(
				2,
				'0',
			)}.\`](${
				// show external url here if there is
				(queueItem as AsyncQueueItem).externalUrl
				?? (await queueItem.url)
				?? '#'
			} "${queueItem.getSimpleTitle()}") ${await queueItem.toMarkdown(
				true,
			)}`,
		);
	}

	public override async act(interaction: ButtonInteraction) {
		const { actionId } = NowCommand.deserializeCustomId(
			interaction.customId,
		);

		const info: CommandBlueprint =
			await CommandBlueprintAdapter.adaptButtonInteraction(
				interaction,
				NowCommand.id,
			);

		// update before modifying queue so the message doesn't get deleted before responding
		await interaction.update({
			components: [
				await this.getAction(
					info,
					this.ctx.previousQueue.length
						- (actionId === Constants.EMBED_BUTTON_NOW_PREVIOUS
							? 1
							: 0)
						>= 1,
					this.ctx.queue.length
						+ (actionId === Constants.EMBED_BUTTON_NOW_NEXT ? 1 : 0)
						> 1,
					this.ctx.voiceManager.isPlaying,
				),
			],
		});

		if (actionId === Constants.EMBED_BUTTON_NOW_PLAY) {
			if (this.ctx.voiceManager.isPlaying)
				this.ctx.voiceManager.pauseQueue();
			else this.ctx.voiceManager.resumeQueue();
		}

		if (actionId === Constants.EMBED_BUTTON_NOW_NEXT) {
			const skipped = this.ctx.queue.shift();

			if (skipped) this.ctx.previousQueue.push(skipped);
		}

		if (actionId === Constants.EMBED_BUTTON_NOW_PREVIOUS) {
			const previous = this.ctx.previousQueue.pop();

			if (previous) this.ctx.queue.unshift(previous);
		}
	}

	public override async getAction(
		info: CommandBlueprint,
		isPreviousEnabled = this.ctx.previousQueue.length >= 1,
		isNextEnabled = this.ctx.queue.length > 1,
		isPaused = false,
	) {
		return (await super.getAction(info)).addComponents(
			new MessageButton()
				.setCustomId(
					this.getCustomId(Constants.EMBED_BUTTON_NOW_PREVIOUS),
				)
				.setLabel('⏮')
				.setStyle('SECONDARY')
				.setDisabled(!isPreviousEnabled),
			new MessageButton()
				.setCustomId(this.getCustomId(Constants.EMBED_BUTTON_NOW_PLAY))
				.setLabel(isPaused ? '▶' : '⏸')
				.setStyle('SECONDARY'),
			new MessageButton()
				.setCustomId(this.getCustomId(Constants.EMBED_BUTTON_NOW_NEXT))
				.setLabel('⏭')
				.setStyle('SECONDARY')
				.setDisabled(!isNextEnabled),
		);
	}
}
