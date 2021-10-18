import type { MessageEmbed } from 'discord.js';
import { Constants } from '../../../resources/enums/Constants.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { AbstractVoiceCommand } from '../AbstractVoiceCommand.js';

export class UnscheduleDisconnectCommand extends AbstractVoiceCommand {
	public static override id = 'unscheduledisconnect';
	public static override description =
		'cancels the previously scheduled disconnection.';

	public static override aliases = [
		'unsdis',
		'unschedis',
		'unscheduledis',
		'unsd',
	];

	public override async getEmbed(
		info: CommandBlueprint,
	): Promise<MessageEmbed> {
		const { scheduleDisconnectHandle } = this.ctx;

		if (scheduleDisconnectHandle == null)
			return (await super.getEmbed(info))
				.setTitle(Constants.EMBED_TITLE_ERROR_USER)
				.setDescription(`no scheduled disconnection, try again.`);

		clearTimeout(scheduleDisconnectHandle);
		this.ctx.scheduleDisconnectHandle = null;

		return (await super.getEmbed(info)).setDescription(
			`unscheduled disconnection.`,
		);
	}
}
