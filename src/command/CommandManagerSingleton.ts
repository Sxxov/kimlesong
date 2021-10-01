import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import * as GlobalCommandObj from './commands/global';
import * as VoiceCommandObj from './commands/voice';
import { AbstractCommand } from './commands/AbstractCommand.js';
import type { CommandBlueprint } from './CommandBlueprint.js';
import { Log } from '../log/Log.js';
import type { ButtonInteraction, MessageOptions } from 'discord.js';
import { ClientSingleton } from '../client/ClientSingleton.js';
import type { ClientCredentialsItem } from '../client/ClientCredentialsItem.js';
import type { AbstractGlobalCommand } from './commands/AbstractGlobalCommand.js';
import type { AbstractVoiceCommand } from './commands/AbstractVoiceCommand.js';
import { State } from '../state/State.js';
import { EmbedErrorCodes } from '../resources/enums/EmbedErrorCodes.js';
import { TrafficRequester } from '../traffic/TrafficRequester.js';
import { PlayCommand } from './commands/global';

const GlobalCommands = Object.values(GlobalCommandObj);
const VoiceCommands = Object.values(VoiceCommandObj);
const AllCommands = [...GlobalCommands, ...VoiceCommands];

export class CommandManagerSingleton {
	public static commandInstanceIdToInstanceCache = new Map<
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
			Command.id.toLowerCase() === info.commandId.toLowerCase()
			|| Command.aliases.includes(info.commandId);
		const replyCommand = async (command: AbstractCommand) => {
			const messageActionRow = await command.getAction(info);

			if (messageActionRow.components.length > 0) {
				this.commandInstanceIdToInstanceCache.set(
					command.instanceId,
					command,
				);
			}

			if (command.Class === PlayCommand) {
				const vcState = State.guildIdToVoiceChannel.get(info.guildId!);
				if (
					vcState
					&& vcState.id
						=== vcState.client.guilds.cache
							.get(info.guildId ?? '')
							?.members.cache.get(info.userId ?? '')?.voice
							.channelId
				) {
					if (await TrafficRequester.request(info.id))
						await reply(await command.getReply(info));
				} else if (await TrafficRequester.requestError(info.id))
					await reply(await command.getReply(info));

				return;
			}

			if (
				await TrafficRequester.request(
					// spoof message id to ensure it's unique
					// this enables support for multiple commands per message
					`${info.id}::${Date.now() * Math.random()}`,
				)
			)
				await reply(await command.getReply(info));
		};

		const reply = async (reply: MessageOptions) => {
			await info.reply(reply);

			Log.debug(
				`Reply: ${JSON.stringify(reply)} @ ${info.guildId ?? '?'}`,
			);
		};

		for (const Command of VoiceCommands as typeof AbstractVoiceCommand[]) {
			if (!isCallingCommand(Command)) continue;

			const voiceChannelId = ClientSingleton.client.guilds.cache
				.get(info.guildId!)
				?.members.cache.get(info.userId!)?.voice.channelId;

			if (voiceChannelId == null) {
				if (await TrafficRequester.requestError(info.id))
					await reply({
						embeds: [
							Command.errorUser(
								EmbedErrorCodes.CHANNEL_NOT_CONNECTED,
							),
						],
					});

				return;
			}

			const targetVC = State.guildIdToVoiceChannel.get(info.guildId!);

			if (targetVC == null || targetVC.id !== voiceChannelId) {
				if (await TrafficRequester.requestError(info.id))
					await reply({
						embeds: [
							Command.errorUser(EmbedErrorCodes.NOT_PLAYING),
						],
					});

				return;
			}

			targetVC.lastCommandBlueprint = info;

			await replyCommand(new Command(targetVC));

			return;
		}

		for (const Command of GlobalCommands) {
			if (!isCallingCommand(Command)) continue;

			await replyCommand(new Command());

			return;
		}

		if (await TrafficRequester.requestError(info.id))
			await reply({
				embeds: [
					AbstractCommand.errorUser(
						EmbedErrorCodes.COMMAND_NOT_FOUND,
					),
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
