import type { GuildChannel } from 'discord.js';
import { DiscordCredentials } from '../Credentials.js';
import { ClientSingleton } from './ClientSingleton.js';

export class ClientsInChannelCacheSingleton {
	public static channelIdToClientCountMapCache: Map<string, number> =
		new Map();

	public static invalidate(channelId: string) {
		this.channelIdToClientCountMapCache.delete(channelId);
	}

	public static async fetch(channelId: string) {
		const channel = (await (
			ClientSingleton.client.channels.cache.find(
				(channel) => channel.id === channelId,
			) as GuildChannel
		)?.fetch(true)) as GuildChannel;

		const clientsInChannel = channel?.members.filter((member) =>
			DiscordCredentials.some(
				(credentials) => credentials.clientId === member.id,
			),
		).size;

		this.channelIdToClientCountMapCache.set(channelId, clientsInChannel);

		return clientsInChannel;
	}

	public static async get(channelId: string) {
		return (
			this.channelIdToClientCountMapCache.get(channelId)
			?? this.fetch(channelId)
		);
	}
}
