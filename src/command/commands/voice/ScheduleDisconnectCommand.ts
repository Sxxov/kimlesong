import type { MessageEmbed } from 'discord.js';
import { EmbedErrorCodes } from '../../../resources/enums/EmbedErrorCodes.js';
import { TimeUtility } from '../../../resources/utilities/TimeUtility.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { AbstractVoiceCommand } from '../AbstractVoiceCommand.js';
import { DisconnectCommand } from './DisconnectCommand.js';

export class ScheduleDisconnectCommand extends AbstractVoiceCommand {
	public static override id = 'scheduledisconnect';
	public static override description =
		'disconnects & clears the queue after a specified amount of time in seconds or hh:mm:ss format.';

	public static override aliases = ['sdis', 'schedis', 'scheduledis', 'sd'];

	public override async getEmbed(
		info: CommandBlueprint,
	): Promise<MessageEmbed> {
		const queueDuration = this.ctx.queue.reduce(
			(prev, curr) => curr.duration + prev,
			0,
		);
		const ms = Math.min(
			info.argument.includes(':')
				? TimeUtility.ms(info.argument)
				: Number(info.argument) * 1000,
			queueDuration,
		);

		if (Number.isNaN(ms) || ms < 0)
			return this.Class.errorUser(EmbedErrorCodes.COMMAND_INVALID);

		this.ctx.scheduleDisconnectHandle = setTimeout(async () => {
			await info.reply(
				await new DisconnectCommand(this.ctx).getReply(info),
			);
		}, ms);

		return (await super.getEmbed(info)).setDescription(
			`disconnecting in ${TimeUtility.hhmmss(ms)}.`,
		);
	}
}
