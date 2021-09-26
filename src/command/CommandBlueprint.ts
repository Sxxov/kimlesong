import type { Message } from 'discord.js';

export interface CommandBlueprint {
	id: string;
	channelId: string | null;
	guildId: string | null;
	userId: string | null;
	commandId: string;
	argument: string;
	reply: Message['reply'];
}
