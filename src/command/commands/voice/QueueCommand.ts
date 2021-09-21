import {
	ButtonInteraction,
	Message,
	MessageButton,
	MessageEmbed,
} from 'discord.js';
import type { QueueItem } from '../../../queue/QueueItem.js';
import { Constants } from '../../../resources/Constants.js';
import { TimeUtility } from '../../../resources/utilities/time.utility.js';
import { State } from '../../../state/State.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { AbstractCommand } from '../AbstractCommand.js';

export class QueueCommand extends AbstractCommand {
	public name = 'queue';
	public description = 'Shows the current queue';
	public aliases = ['q'];
	public override actionIds = [
		Constants.EMBED_BUTTON_QUEUE_NEXT,
		Constants.EMBED_BUTTON_QUEUE_PREVIOUS,
	] as string[];

	public onUpdated(): MessageEmbed {
		throw new Error('Method not implemented.');
	}

	public override async reply(
		info: CommandBlueprint,
		offset = 0,
	): Promise<MessageEmbed> {
		const queue = State.guildIdToQueue.get(info.guildId!);
		const timeout = State.guildIdToQueueMoreTimeout.get(info.guildId!);

		if (queue == null) return this.errorInternal();

		const nextPlaylistMore = timeout
			? Date.now() +
			  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			  Number((timeout as any)._idleStart)
			  - process.uptime() * 1000 +
			  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			  Number((timeout as any)._idleTimeout)
			: 0;

		const reply = (await super.reply(info))
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
			const queueItem = queue.at(0)!;

			reply.addField(
				queueItem.title,
				`[\`00.\` ](${queueItem.url}) by ${
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
						)}.\`](${queueItem.url}) by ${
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
				embeds: [this.errorInternal()],
			});
		}

		let [curr, total] = (
			interaction.message.embeds[0].footer?.text?.split('/') ?? []
		).map(Number);

		if (
			interaction.customId === Constants.EMBED_BUTTON_QUEUE_NEXT
			&& curr + 1 <= total
		) {
			++curr;
		}

		if (
			interaction.customId === Constants.EMBED_BUTTON_QUEUE_PREVIOUS
			&& Number(curr) - 1 >= 1
		) {
			--curr;
		}

		const info = {
			argument: '',
			channelId: interaction.channelId,
			command: this.name,
			guildId: interaction.guildId,
			reply: interaction.update.bind(interaction) as Message['reply'],
			userId: interaction.user.id,
		};
		const isPreviousEnabled = curr > 1;
		const isNextEnabled = curr < total;

		await interaction.update({
			options: {},
			embeds: [
				await this.reply(
					info,
					(curr - 1) * Constants.COMMAND_QUEUE_PAGE_SIZE,
				),
			],
			components: [
				await this.action(info, isPreviousEnabled, isNextEnabled),
			],
		});
	}

	public override async action(
		info: CommandBlueprint,
		isPreviousEnabled = false,
		isNextEnabled = true,
	) {
		return (await super.action(info)).addComponents(
			new MessageButton()
				.setCustomId(Constants.EMBED_BUTTON_QUEUE_PREVIOUS)
				.setLabel('←')
				.setStyle('SECONDARY')
				.setDisabled(!isPreviousEnabled),
			new MessageButton()
				.setCustomId(Constants.EMBED_BUTTON_QUEUE_NEXT)
				.setLabel('→')
				.setStyle('SECONDARY')
				.setDisabled(!isNextEnabled),
		);
	}

	public static stringifyQueueItem(queueItem: QueueItem) {
		return `[${queueItem.artist} - ${queueItem.title}](${
			queueItem.url
		}) — \`${TimeUtility.hhmmss(queueItem.duration)}\``;
	}
}
