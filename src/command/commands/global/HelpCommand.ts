import type { MessageEmbed } from 'discord.js';
import * as GlobalCommandObj from '.';
import * as VoiceCommandObj from '../voice';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { AbstractGlobalCommand } from '../AbstractGlobalCommand.js';
import type { AbstractVoiceCommand } from '../AbstractVoiceCommand.js';

export class HelpCommand extends AbstractGlobalCommand {
	public static override id = 'help';
	public static override description = 'helps.';
	public static override aliases = ['h', '?'];

	public override async getEmbed(
		info: CommandBlueprint,
	): Promise<MessageEmbed> {
		return (await super.getEmbed(info))
			.setDescription("you're welcome.")
			.addField(`__${' '.repeat(161)}__`, '\u200B')
			.addField(`**🌏  global commands:**`, '\u200B')
			.addFields(
				GlobalCommands.map((GlobalCommand) =>
					HelpCommand.getCommandHelpField(GlobalCommand),
				),
			)
			.addField(`__${' '.repeat(161)}__`, '\u200B')
			.addField(`🎶  **channel commands:**`, '\u200B')
			.addFields(
				VoiceCommands.map((VoiceCommand) =>
					HelpCommand.getCommandHelpField(VoiceCommand),
				),
			);
	}

	private static getCommandHelpField(
		Command: typeof AbstractGlobalCommand | typeof AbstractVoiceCommand,
	) {
		const slash = Command.getSlashCommand();

		return {
			name: `\`!${slash.name}\`${
				Command.aliases.length > 0
					? ` (${Command.aliases
							.map((alias) => `\`!${alias}\``)
							.join('/')})`
					: ''
			}`,
			value: slash.description,
			inline: true,
		};
	}
}

// place at the bottom to let `HelpCommand` be defined before these
const GlobalCommands = Object.values(GlobalCommandObj);
const VoiceCommands = Object.values(VoiceCommandObj);
