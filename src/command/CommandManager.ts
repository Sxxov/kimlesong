import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types';
import assert from 'assert';
import * as commands from './commands';
import type { AbstractCommand } from './commands/AbstractCommand.js';

assert(process.env.TOKEN);
assert(process.env.CLIENT_ID);

export class CommandManager {
	public static rest = new REST({ version: '9' }).setToken(
		process.env.TOKEN!,
	);

	public static async registerCommands(guildId: string) {
		await this.rest.put(
			Routes.applicationGuildCommands(process.env.CLIENT_ID!, guildId),
			{
				body: Object.values(commands)
					.map(
						(Command) =>
							new (Command as new () => AbstractCommand)(),
					)
					// filter out invalid commands (AbstractCommand)
					.filter((command) => command.reply),
			},
		);
	}
}
