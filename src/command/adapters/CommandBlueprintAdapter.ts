import type { ButtonInteraction, Message } from 'discord.js';

export class CommandBlueprintAdapter {
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
			messageId: interaction.id,
		};
	}
}
