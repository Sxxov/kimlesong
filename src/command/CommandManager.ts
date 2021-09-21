import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import * as GlobalCommandObj from './commands/global';
import * as VoiceCommandObj from './commands/voice';
import { AbstractCommand } from './commands/AbstractCommand.js';
import type { CommandBlueprint } from './CommandBlueprint.js';
import { Log } from '../log/Log.js';
import type { ButtonInteraction } from 'discord.js';
import { ClientSingleton } from '../client/ClientSingleton.js';

const GlobalCommands = Object.values(GlobalCommandObj);
const VoiceCommands = Object.values(VoiceCommandObj);
const AllCommands = [...GlobalCommands, ...VoiceCommands];

export class CommandManager {
	public rest: REST;
	private messageIdToCommandInstanceCache = new Map<
		string,
		AbstractCommand
	>();

	constructor(private token: string, private clientId: string) {
		this.rest = new REST({ version: '9' }).setToken(this.token);
	}

	public async act(interaction: ButtonInteraction) {
		for (const Command of AllCommands) {
			if (Command.actionIds.includes(interaction.customId)) {
				await new Command().act(interaction);

				Log.debug(
					`Action: ${Command.id} @ ${interaction.guildId ?? '?'}`,
				);

				return;
			}
		}
	}

	public async run(info: CommandBlueprint) {
		const isCallingCommand = (Command: typeof AbstractCommand) =>
			Command.id === info.command
			|| Command.aliases.includes(info.command);
		const reply = async (Command: new () => AbstractCommand) => {
			const command = new Command();
			const messageActionRow = await command.getAction(info);

			if (messageActionRow.components.length > 0) {
				this.messageIdToCommandInstanceCache.set(
					info.messageId,
					command,
				);
			}

			await info.reply({
				options: {},
				embeds: [await command.getEmbed(info)],
				components:
					messageActionRow.components.length > 0
						? [messageActionRow]
						: undefined,
			});

			Log.debug(`Reply: ${command.Class.id} @ ${info.guildId ?? '?'}`);
		};

		for (const Command of VoiceCommands) {
			if (!isCallingCommand(Command)) continue;

			const voiceChannel = ClientSingleton.client.guilds.cache
				.get(info.guildId!)
				?.members.cache.get(info.userId!)?.voice.channel;

			if (voiceChannel == null) {
				await info.reply({
					options: {},
					embeds: [Command.errorUser(420)],
				});

				return;
			}

			await reply(Command);

			return;
		}

		for (const Command of GlobalCommands) {
			if (!isCallingCommand(Command)) continue;

			await reply(Command);

			return;
		}

		await info.reply({
			embeds: [AbstractCommand.errorUser(404)],
		});
	}

	public async registerCommands(guildId: string) {
		await this.rest.put(
			Routes.applicationGuildCommands(this.clientId, guildId),
			{
				body: AllCommands.map((Command) =>
					Command.id ? Command.getSlashCommand() : false,
				),
			},
		);

		Log.debug(
			`Registered: ${AllCommands.map((Command) => `${Command.id}`).join(
				', ',
			)} @ ${guildId}`,
		);
	}
}
