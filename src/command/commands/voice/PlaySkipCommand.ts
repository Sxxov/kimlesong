import type { MessageEmbed } from 'discord.js';
import { QueueManager } from '../../../queue/QueueManager.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { AbstractVoiceCommand } from '../AbstractVoiceCommand.js';

export class PlaySkipCommand extends AbstractVoiceCommand {
	public static override id = 'playskip';
	public static override description =
		'skips the current song and plays the requested item.';

	public static override aliases = ['ps'];

	public override async getEmbed(
		info: CommandBlueprint,
	): Promise<MessageEmbed> {
		const skipped = this.ctx.queue.value.shift();

		const [first, ...rest] = await new QueueManager(
			this.ctx,
		).unshiftQueueFromSearch(info.argument);

		return (await super.getEmbed(info)).setDescription(
			`skipped ${
				(await skipped?.toMarkdown()) ?? ''
			}\nplaying ${await first.toMarkdown()}${
				rest.length > 0 ? `\n\n+ ${rest.length} more` : ''
			}`,
		);
	}
}
