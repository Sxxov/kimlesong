import type { MessageEmbed } from 'discord.js';
import type { QueueItem } from '../../queue/QueueItem.js';
import { TimeUtility } from '../../resources/utilities/time.utility.js';
import { State } from '../../state/StateManager.js';
import type { CommandBlueprint } from '../CommandBlueprint.js';
import { AbstractCommand } from './AbstractCommand.js';

export class QueueCommand extends AbstractCommand {
	public name = 'queue';
	public description = 'Shows the current queue';
	public aliases = ['q'];

	public onUpdated(): MessageEmbed {
		throw new Error('Method not implemented.');
	}

	public override async reply(info: CommandBlueprint): Promise<MessageEmbed> {
		const queue = State.guildIdToQueue.get(info.guildId!);
		const timeout = State.guildIdToQueueMoreTimeout.get(info.guildId!);

		if (queue == null) return this.errorInternal();

		const nextPlaylistMore = timeout
			? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			  Number((timeout as any)._idleStart) +
			  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			  Number((timeout as any)._idleTimeout)
			: 0;

		const reply = (await super.reply(info))
			.setDescription(
				`${queue.length} item${
					queue.length === 1 ? '' : 's'
				}, ${TimeUtility.hhmmss(
					queue.reduce(
						(prev, queuePart) => queuePart.duration + prev,
						0,
					) ?? 0,
				)}`,
			)
			.setFooter(
				nextPlaylistMore > Date.now()
					? `next playlist more in ${TimeUtility.hhmmss(
							Date.now() - nextPlaylistMore,
					  )}`
					: '',
			);

		if (queue.length === 0) {
			reply.addField(String.raw`**¯\_(ツ)_/¯**`, 'maybe add something?');
		}

		if (queue.length > 0) {
			reply.addField(
				'__**now playing:**__',
				QueueCommand.stringifyQueueItem(queue.at(0)!),
			);
		}

		if (queue.length > 1) {
			reply.addField(
				'__**next up:**__',
				queue
					.slice(1)
					.map(
						(queueItem, i) =>
							`\`${String(i + 1).padStart(
								2,
								'0',
							)}.\` ${QueueCommand.stringifyQueueItem(
								queueItem,
							)}`,
					)
					.join('\n\n'),
			);
		}

		return reply;
	}

	public static stringifyQueueItem(queueItem: QueueItem) {
		return `[${queueItem.artist} - ${queueItem.title}](${
			queueItem.url
		}) — \`${TimeUtility.hhmmss(queueItem.duration)}\``;
	}
}
