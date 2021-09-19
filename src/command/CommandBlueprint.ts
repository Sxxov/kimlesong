import type { Interaction, Message } from 'discord.js';

export interface CommandBlueprint
	extends Pick<Interaction, 'channel' | 'channelId' | 'guild' | 'guildId'> {
	command: string;
	argument: string;
	reply: Message['reply'];
}
