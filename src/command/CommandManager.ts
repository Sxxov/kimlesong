import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import * as GlobalCommandObj from './commands/global';
import * as VoiceCommandObj from './commands/voice';
import { AbstractCommand } from './commands/AbstractCommand.js';
import type { CommandBlueprint } from './CommandBlueprint.js';
import { Log } from '../log/Log.js';
import type { ButtonInteraction } from 'discord.js';

const GlobalCommands = Object.values(GlobalCommandObj);
const globalCommands = GlobalCommands.map(
	(Command) => new (Command as new () => AbstractCommand)(),
);

const VoiceCommands = Object.values(VoiceCommandObj);
const voiceCommands = VoiceCommands.map(
	(Command) => new (Command as new () => AbstractCommand)(),
);

const AllCommands = [...GlobalCommands, ...VoiceCommands];
const allCommands = [...globalCommands, ...voiceCommands];

export class CommandManager {
	public rest: REST;

	constructor(private token: string, private clientId: string) {
		this.rest = new REST({ version: '9' }).setToken(this.token);
	}

	public async act(interaction: ButtonInteraction) {
		for (const command of allCommands) {
			if (command.actionIds.includes(interaction.customId)) {
				await command.act(interaction);

				Log.debug(
					`Action: ${command.name} @ ${interaction.guildId ?? '?'}`,
				);

				return;
			}
		}
	}

	public async run(info: CommandBlueprint) {
		for (const command of allCommands) {
			if (
				command.name === info.command
				|| command.aliases.includes(info.command)
			) {
				const messageActionRow = await command.action(info);

				await info.reply({
					options: {},
					embeds: [await command.reply(info)],
					components:
						messageActionRow.components.length > 0
							? [messageActionRow]
							: undefined,
				});

				Log.debug(`Reply: ${command.name} @ ${info.guildId ?? '?'}`);

				return;
			}
		}

		await info.reply({
			embeds: [AbstractCommand.EMBED_ERROR_404],
		});
	}

	public async registerCommands(guildId: string) {
		await this.rest.put(
			Routes.applicationGuildCommands(this.clientId, guildId),
			{
				body: allCommands
					.map((command) => (command.name ? command.build() : false))
					// filter out invalid commands (AbstractCommand)
					.filter(Boolean),
			},
		);

		Log.debug(
			`Registered: ${allCommands
				.map((command) => `${command.name}`)
				.join(', ')} @ ${guildId}`,
		);
	}
}
