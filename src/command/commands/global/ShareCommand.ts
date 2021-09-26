import type { MessageEmbed } from 'discord.js';
import { Constants } from '../../../resources/enums/Constants.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { AbstractGlobalCommand } from '../AbstractGlobalCommand.js';

export class ShareCommand extends AbstractGlobalCommand {
	public static override id = 'share';
	public static override description =
		'returns the link to add the bot to another server';

	public override async getEmbed(
		info: CommandBlueprint,
	): Promise<MessageEmbed> {
		return (await super.getEmbed(info)).setDescription(
			Constants.SHARE_URLS,
		);
	}
}
