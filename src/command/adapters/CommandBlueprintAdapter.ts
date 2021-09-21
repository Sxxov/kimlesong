import type {
	ButtonInteraction,
	CommandInteraction,
	Message,
} from 'discord.js';

export class CommandBlueprintAdapter {
	public static adaptCommandInteraction(interaction: CommandInteraction) {
		return {
			argument: '',
			channelId: interaction.channelId,
			command: interaction.commandName,
			guildId: interaction.guildId,
			reply: interaction.reply.bind(interaction) as Message['reply'],
			userId: interaction.user.id,
			messageId: interaction.id,
		};
	}

	public static adaptButtonInteraction(
		interaction: ButtonInteraction,
		commandId: string,
	) {
		return {
			argument: '',
			channelId: interaction.channelId,
			command: commandId,
			guildId: interaction.guildId,
			reply: interaction.update.bind(interaction) as Message['reply'],
			userId: interaction.user.id,
			messageId: interaction.message.id,
		};
	}
}
