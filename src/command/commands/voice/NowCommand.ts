import { ButtonInteraction, MessageButton, MessageEmbed } from 'discord.js';
import { Constants } from '../../../resources/enums/Constants.js';
import { CommandBlueprintAdapter } from '../../adapters/CommandBlueprintAdapter.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { AbstractVoiceCommand } from '../AbstractVoiceCommand.js';

export class NowCommand extends AbstractVoiceCommand {
	public static override id = 'now';
	public static override description = "shows what's playing now";
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

		return (await super.getEmbed(info)).setDescription(
			`playing ${queue.getAt(0).toMarkdown()}`,
		);
	}

	public override async act(interaction: ButtonInteraction) {
		const { actionId } = NowCommand.deserializeCustomId(
			interaction.customId,
		);

		if (actionId === Constants.EMBED_BUTTON_NOW_REPEAT) {
			const [current] = this.ctx.queue;

			if (current) this.ctx.queue.splice(0, 1, current.clone());
		}

		if (actionId === Constants.EMBED_BUTTON_NOW_NEXT) {
			const skipped = this.ctx.queue.shift();

			if (skipped) this.ctx.previousQueue.push(skipped);
		}

		if (actionId === Constants.EMBED_BUTTON_NOW_PREVIOUS) {
			const previous = this.ctx.previousQueue.pop();

			if (previous) this.ctx.queue.unshift(previous);
		}

		const info: CommandBlueprint =
			CommandBlueprintAdapter.adaptButtonInteraction(
				interaction,
				NowCommand.id,
			);

		await interaction.update({
			components: await this.getActions(info),
		});
	}

	public override async getAction(
		info: CommandBlueprint,
		isPreviousEnabled = this.ctx.previousQueue.length > 1,
		isNextEnabled = this.ctx.queue.length > 1,
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
				.setCustomId(
					this.getCustomId(Constants.EMBED_BUTTON_NOW_REPEAT),
				)
				.setLabel('🔁')
				.setStyle('SECONDARY'),
			new MessageButton()
				.setCustomId(this.getCustomId(Constants.EMBED_BUTTON_NOW_NEXT))
				.setLabel('⏭')
				.setStyle('SECONDARY')
				.setDisabled(!isNextEnabled),
		);
	}
}
