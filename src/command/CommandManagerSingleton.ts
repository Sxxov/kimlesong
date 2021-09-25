import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import * as GlobalCommandObj from './commands/global';
import * as VoiceCommandObj from './commands/voice';
import { AbstractCommand } from './commands/AbstractCommand.js';
import type { CommandBlueprint } from './CommandBlueprint.js';
import { Log } from '../log/Log.js';
import type { ButtonInteraction } from 'discord.js';
import { ClientSingleton } from '../client/ClientSingleton.js';
import type { ClientCredentialsItem } from '../client/ClientCredentialsItem.js';
import type { AbstractGlobalCommand } from './commands/AbstractGlobalCommand.js';
import type { AbstractVoiceCommand } from './commands/AbstractVoiceCommand.js';
import { State } from '../state/State.js';
import { EmbedErrorCodes } from '../resources/enums/EmbedErrorCodes.js';

const GlobalCommands = Object.values(GlobalCommandObj);
const VoiceCommands = Object.values(VoiceCommandObj);
const AllCommands = [...GlobalCommands, ...VoiceCommands];

export class CommandManagerSingleton {
	private static commandInstanceIdToInstanceCache = new Map<
		number,
		AbstractCommand
	>();

	public static async act(interaction: ButtonInteraction) {
		const { instanceId } = AbstractCommand.deserializeCustomId(
			interaction.customId,
		);

		const command = this.commandInstanceIdToInstanceCache.get(
			Number(instanceId),
		);

		if (command == null) {
			Log.error(
				`Attempted to act on non-existant command: ${
					interaction.customId
				} @ ${interaction.guildId ?? '?'}`,
			);

			await interaction.update({
				components: undefined,
			});

			return;
		}

		await command.act(interaction);

		Log.debug(
			`Action: ${command.Class.id} @ ${interaction.guildId ?? '?'}`,
		);
	}

	public static async run(info: CommandBlueprint) {
		const isCallingCommand = (
			Command: typeof AbstractGlobalCommand | typeof AbstractVoiceCommand,
		) =>
			Command.id === info.commandId
			|| Command.aliases.includes(info.commandId);
		const reply = async (command: AbstractCommand) => {
			const messageActionRow = await command.getAction(info);

			if (messageActionRow.components.length > 0) {
				this.commandInstanceIdToInstanceCache.set(
					command.instanceId,
					command,
				);
			}

			await info.reply(await command.getReply(info));

			Log.debug(`Reply: ${command.Class.id} @ ${info.guildId ?? '?'}`);
		};

		for (const Command of VoiceCommands as typeof AbstractVoiceCommand[]) {
			if (!isCallingCommand(Command)) continue;

			const voiceChannelId = ClientSingleton.client.guilds.cache
				.get(info.guildId!)
				?.members.cache.get(info.userId!)?.voice.channelId;

			if (voiceChannelId == null) {
				await info.reply({
					options: {},
					embeds: [
						Command.errorUser(
							EmbedErrorCodes.CHANNEL_NOT_CONNECTED,
						),
					],
				});

				return;
			}

			const targetVC = State.guildIdToVoiceChannel.get(info.guildId!);

			if (targetVC == null) {
				await info.reply({
					embeds: [Command.errorUser(EmbedErrorCodes.NOT_PLAYING)],
				});

				return;
			}

			targetVC.lastCommandBlueprint = info;

			await reply(new Command(targetVC));

			return;
		}

		for (const Command of GlobalCommands) {
			if (!isCallingCommand(Command)) continue;

			await reply(new Command());

			return;
		}

		await info.reply({
			embeds: [
				AbstractCommand.errorUser(EmbedErrorCodes.COMMAND_NOT_FOUND),
			],
		});
	}

	public static async registerCommands(
		guildId: string,
		{ token, clientId }: ClientCredentialsItem,
	) {
		await new REST({ version: '9' })
			.setToken(token)
			.put(Routes.applicationGuildCommands(clientId, guildId), {
				body: AllCommands.map((Command) =>
					Command.id ? Command.getSlashCommand() : false,
				),
			});

		Log.debug(
			`Registered: ${AllCommands.map((Command) => `${Command.id}`).join(
				', ',
			)} @ ${guildId}`,
		);
	}
}
