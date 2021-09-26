import { ButtonInteraction, MessageButton, MessageEmbed } from 'discord.js';
import type { AsyncQueueItem } from '../../../queue/AsyncQueueItem.js';
import type { SyncQueueItem } from '../../../queue/SyncQueueItem.js';
import { Constants } from '../../../resources/enums/Constants.js';
import { TimeUtility } from '../../../resources/utilities/TimeUtility.js';
import { CommandBlueprintAdapter } from '../../adapters/CommandBlueprintAdapter.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { AbstractVoiceCommand } from '../AbstractVoiceCommand.js';

export class QueueCommand extends AbstractVoiceCommand {
	public static override id = 'queue';
	public static override description = 'shows the current queue.';
	public static override aliases = ['q'];
	public static override actionIds = [
		Constants.EMBED_BUTTON_QUEUE_NEXT,
		Constants.EMBED_BUTTON_QUEUE_PREVIOUS,
	] as string[];

	public onUpdated(): MessageEmbed {
		throw new Error('Method not implemented.');
	}

	public override async getEmbed(
		info: CommandBlueprint,
		offset = 0,
	): Promise<MessageEmbed> {
		const { queue, queuedPlaylistsTimeouts } = this.ctx;

		let timeout: NodeJS.Timeout;

		let nextTimeoutSinceProcessStart = Infinity;
		for (let i = 0, l = queuedPlaylistsTimeouts.length; i < l; ++i) {
			const queuedPlaylistsTimeout = queuedPlaylistsTimeouts.getAt(i);

			const timeoutSinceProcessStart =
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				Number((queuedPlaylistsTimeout as any)._idleStart) +
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				Number((queuedPlaylistsTimeout as any)._idleTimeout);

			if (timeoutSinceProcessStart < nextTimeoutSinceProcessStart) {
				timeout = queuedPlaylistsTimeout!;
				nextTimeoutSinceProcessStart = timeoutSinceProcessStart;
			}
		}

		if (queue == null) return QueueCommand.errorInternal();

		const nextPlaylistMore = timeout!
			? Date.now() +
			  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			  Number((timeout as any)._idleStart)
			  - process.uptime() * 1000 +
			  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			  Number((timeout as any)._idleTimeout)
			: 0;

		const reply = (await super.getEmbed(info))
			.setDescription(
				`${queue.length} item${queue.length === 1 ? '' : 's'}${
					nextPlaylistMore > Date.now()
						? ` _(+ more in \`${Math.floor(
								(nextPlaylistMore - Date.now()) / 1000,
						  )}s\`)_`
						: ''
				} — \`${TimeUtility.hhmmss(
					queue.reduce(
						(prev, queuePart) => queuePart.duration + prev,
						0,
					) ?? 0,
				)}\``,
			)
			.setFooter(
				`${
					Math.floor(offset / Constants.COMMAND_QUEUE_PAGE_SIZE) + 1
				}/${Math.floor(
					queue.length / Constants.COMMAND_QUEUE_PAGE_SIZE,
				)}`,
			);

		reply.addField(`__${' '.repeat(161)}__`, '\u200B');

		if (queue.length === 0) {
			reply.addField(String.raw`**¯\_(ツ)_/¯**`, 'maybe add something?');
		}

		if (queue.length > 0) {
			const queueItem = queue.getAt(0)!;
			const url = await queueItem.url;

			reply.addField(
				queueItem.title,
				`[\`00.\` ](${url} "${queueItem.getSimpleTitle()}") by ${
					queueItem.artist
				} — \`${TimeUtility.hhmmss(queueItem.duration)}\``,
			);
		}

		if (queue.length > 1) {
			reply.addField(`__${' '.repeat(161)}__`, '\u200B');
			reply.addFields(
				queue
					.slice(
						offset + 1,
						offset + 1 + Constants.COMMAND_QUEUE_PAGE_SIZE,
					)
					.map((queueItem, i) => ({
						name: queueItem.title,
						value: `[\`${String(i + 1 + offset).padStart(
							2,
							'0',
						)}.\`](${
							(queueItem as AsyncQueueItem).externalUrl
								? (queueItem as AsyncQueueItem).externalUrl
								  ?? '#'
								: (queueItem as SyncQueueItem).url
						} "${queueItem.getSimpleTitle()}") by ${
							queueItem.artist
						} — \`${TimeUtility.hhmmss(queueItem.duration)}\``,
					})),
			);
		}

		return reply;
	}

	public override async act(interaction: ButtonInteraction) {
		if (interaction.message.embeds[0].footer?.text == null) {
			await interaction.reply({
				options: {},
				embeds: [QueueCommand.errorInternal()],
			});
		}

		let [curr, total] = (
			interaction.message.embeds[0].footer?.text?.split('/') ?? []
		).map(Number);

		const { actionId } = QueueCommand.deserializeCustomId(
			interaction.customId,
		);

		if (
			actionId === Constants.EMBED_BUTTON_QUEUE_NEXT
			&& curr + 1 <= total
		) {
			++curr;
		}

		if (
			actionId === Constants.EMBED_BUTTON_QUEUE_PREVIOUS
			&& Number(curr) - 1 >= 1
		) {
			--curr;
		}

		const info: CommandBlueprint =
			CommandBlueprintAdapter.adaptButtonInteraction(
				interaction,
				QueueCommand.id,
			);
		const isPreviousEnabled = curr > 1;
		const isNextEnabled = curr < total;

		await interaction.update({
			options: {},
			embeds: [
				await this.getEmbed(
					info,
					(curr - 1) * Constants.COMMAND_QUEUE_PAGE_SIZE,
				),
			],
			components: [
				await this.getAction(info, isPreviousEnabled, isNextEnabled),
			],
		});
	}

	public override async getAction(
		info: CommandBlueprint,
		isPreviousEnabled = false,
		isNextEnabled = this.ctx.queue.length
			> Constants.COMMAND_QUEUE_PAGE_SIZE,
	) {
		return (await super.getAction(info)).addComponents(
			new MessageButton()
				.setCustomId(
					this.getCustomId(Constants.EMBED_BUTTON_QUEUE_PREVIOUS),
				)
				.setLabel('➖')
				.setStyle('SECONDARY')
				.setDisabled(!isPreviousEnabled),
			new MessageButton()
				.setCustomId(
					this.getCustomId(Constants.EMBED_BUTTON_QUEUE_REFRESH),
				)
				.setLabel('💫')
				.setStyle('SECONDARY'),
			new MessageButton()
				.setCustomId(
					this.getCustomId(Constants.EMBED_BUTTON_QUEUE_NEXT),
				)
				.setLabel('➕')
				.setStyle('SECONDARY')
				.setDisabled(!isNextEnabled),
		);
	}
}
