import type { Message } from 'discord.js';

export interface CommandBlueprint {
	channelId: string | null;
	guildId: string | null;
	userId: string | null;
	messageId: string;
	command: string;
	argument: string;
	reply: Message['reply'];
}
