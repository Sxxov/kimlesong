import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import * as RawCommandMap from './commands';
import { AbstractCommand } from './commands/AbstractCommand.js';
import type { CommandBlueprint } from './CommandBlueprint.js';
import { Log } from '../log/Log.js';

const Commands = Object.values(RawCommandMap).filter(
	(Command) => Command !== RawCommandMap.AbstractCommand,
);
const commands = Commands.map(
	(Command) => new (Command as new () => AbstractCommand)(),
);

export class CommandManager {
	public rest: REST;

	constructor(private token: string, private clientId: string) {
		this.rest = new REST({ version: '9' }).setToken(this.token);
	}

	public async run(info: CommandBlueprint) {
		for (const command of commands) {
			if (
				command.name === info.command
				|| command.aliases.includes(info.command)
			) {
				await info.reply({
					options: {},
					embeds: [await command.reply(info)],
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
				body: commands
					.map((command) => (command.name ? command.build() : false))
					// filter out invalid commands (AbstractCommand)
					.filter(Boolean),
			},
		);

		Log.debug(
			`Registered commands:\n${commands
				.map((command) => `\t${command.name}`)
				.join('\n')}`,
		);
	}
}
