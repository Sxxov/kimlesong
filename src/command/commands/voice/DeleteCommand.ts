import type { MessageEmbed } from 'discord.js';
import { EmbedErrorCodes } from '../../../resources/enums/EmbedErrorCodes.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { AbstractVoiceCommand } from '../AbstractVoiceCommand.js';

export class DeleteCommand extends AbstractVoiceCommand {
	public static override id = 'delete';
	public static override description =
		'deletes a single (eg. `del 1`) queue index or multiple (eg. `del 1-10`, `del 1,2,3`).';

	public static override aliases = ['del', 'remove', 'rem', 'rm'];

	public override async getEmbed(
		info: CommandBlueprint,
	): Promise<MessageEmbed> {
		const parts = info.argument
			.split(',')
			.map((part) => /(\d-\d)|(\d)/.exec(part)?.[0] ?? null);

		if (parts.includes(null))
			return this.Class.errorUser(EmbedErrorCodes.COMMAND_INVALID);

		const indicesToBeDeleted = Array.from<number>(
			new Set<number>(
				parts.flatMap((part) => {
					if (part!.includes('-')) {
						const [from, to] = part!.split('-');
						const result = [];

						for (
							let i = Number(from), l = Number(to) + 1;
							i < l;
							++i
						) {
							result.push(i - 1);
						}

						return result;
					}

					return Number(part) - 1;
				}),
			),
		);

		if (
			indicesToBeDeleted.some((index) => Number.isNaN(Number(index)))
			|| indicesToBeDeleted.length <= 0
		)
			return this.Class.errorUser(EmbedErrorCodes.COMMAND_INVALID);

		if (
			indicesToBeDeleted.some(
				(index) =>
					Number(index) < 0
					|| Number(index)
						>= this.ctx.queue.length
							+ this.ctx.previousQueue.length,
			)
		)
			return this.Class.errorUser(EmbedErrorCodes.INDEX_OUT_OF_BOUNDS);

		const deleted = this.delete(...indicesToBeDeleted);

		if (deleted.length <= 0) return this.Class.errorInternal();

		this.ctx.previousQueue.append(deleted);

		return (await super.getEmbed(info)).setDescription(
			`deleted ${await deleted[0].toMarkdown()}${
				deleted.length > 1 ? ` (+ ${deleted.length - 1} more)` : ''
			}.`,
		);
	}

	private delete(...indices: number[]) {
		const previousQueueOffset = this.ctx.previousQueue.length;

		indices.sort((a, b) => b - a);

		return indices.map((index, i) => {
			const queueIndex = index - previousQueueOffset;

			if (queueIndex < 0)
				return this.ctx.previousQueue.splice(index - i, 1)[0];

			return this.ctx.queue.splice(queueIndex, 1)[0];
		});
	}
}
