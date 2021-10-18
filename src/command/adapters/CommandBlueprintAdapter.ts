import type {
	ButtonInteraction,
	CommandInteraction,
	Message,
} from 'discord.js';
import { ClientsInChannelCacheSingleton } from '../../client/ClientsInChannelCacheSingleton.js';
import { Constants } from '../../resources/enums/Constants.js';
import type { CommandBlueprint } from '../CommandBlueprint.js';

export class CommandBlueprintAdapter {
	public static async adaptMessage(
		message: Message,
		commandId: string,
		argument: string,
	): Promise<CommandBlueprint> {
		return {
			id: message.id,
			channelId: message.channelId,
			guildId: message.guildId,
			userId: message.member?.id ?? null,
			argument,
			commandId,
			reply: message.reply.bind(message),
			clientsInChannel: await ClientsInChannelCacheSingleton.get(
				message.channelId,
			),
		};
	}

	public static async adaptCommandInteraction(
		interaction: CommandInteraction,
	): Promise<CommandBlueprint> {
		return {
			id: interaction.id,
			argument:
				interaction.options.getString(Constants.SLASH_ARGUMENT_NAME)
				?? '',
			channelId: interaction.channelId,
			commandId: interaction.commandName,
			guildId: interaction.guildId,
			reply: interaction.reply.bind(interaction) as Message['reply'],
			userId: interaction.user.id,
			clientsInChannel: await ClientsInChannelCacheSingleton.get(
				interaction.channelId,
			),
		};
	}

	public static async adaptButtonInteraction(
		interaction: ButtonInteraction,
		commandId: string,
	): Promise<CommandBlueprint> {
		return {
			id: interaction.id,
			argument: '',
			channelId: interaction.channelId,
			commandId,
			guildId: interaction.guildId,
			reply: interaction.update.bind(interaction) as Message['reply'],
			userId: interaction.user.id,
			clientsInChannel: await ClientsInChannelCacheSingleton.get(
				String(interaction.channelId),
			),
		};
	}
}
