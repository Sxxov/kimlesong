import type {
	ButtonInteraction,
	CommandInteraction,
	Message,
} from 'discord.js';
import type { CommandBlueprint } from '../CommandBlueprint.js';

export class CommandBlueprintAdapter {
	public static adaptMessage(
		message: Message,
		commandId: string,
		argument: string,
	): CommandBlueprint {
		return {
			id: message.id,
			channelId: message.channelId,
			guildId: message.guildId,
			userId: message.member?.id ?? null,
			argument,
			commandId,
			reply: message.reply.bind(message),
		};
	}

	public static adaptCommandInteraction(
		interaction: CommandInteraction,
	): CommandBlueprint {
		return {
			id: interaction.id,
			argument: '',
			channelId: interaction.channelId,
			commandId: interaction.commandName,
			guildId: interaction.guildId,
			reply: interaction.reply.bind(interaction) as Message['reply'],
			userId: interaction.user.id,
		};
	}

	public static adaptButtonInteraction(
		interaction: ButtonInteraction,
		commandId: string,
	): CommandBlueprint {
		return {
			id: interaction.id,
			argument: '',
			channelId: interaction.channelId,
			commandId,
			guildId: interaction.guildId,
			reply: interaction.update.bind(interaction) as Message['reply'],
			userId: interaction.user.id,
		};
	}
}
