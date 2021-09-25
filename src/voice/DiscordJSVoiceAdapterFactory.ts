import type {
	DiscordGatewayAdapterCreator,
	DiscordGatewayAdapterLibraryMethods,
} from '@discordjs/voice';
import {
	Client,
	Constants as DiscordConstants,
	Guild,
	Snowflake,
	VoiceChannel,
} from 'discord.js';
import type {
	GatewayVoiceServerUpdateDispatchData,
	GatewayVoiceStateUpdateDispatchData,
} from 'discord.js/node_modules/discord-api-types';

export class DiscordJSVoiceAdapterFactory {
	private adapters = new Map<
		Snowflake,
		DiscordGatewayAdapterLibraryMethods
	>();

	private trackedClients = new Set<Client>();

	private trackedShards = new Map<number, Set<Snowflake>>();

	private trackClient(client: Client) {
		if (this.trackedClients.has(client)) return;

		this.trackedClients.add(client);

		client.ws.on(
			DiscordConstants.WSEvents.VOICE_SERVER_UPDATE,
			(payload: GatewayVoiceServerUpdateDispatchData) => {
				this.adapters
					.get(payload.guild_id)
					?.onVoiceServerUpdate(payload);
			},
		);
		client.ws.on(
			DiscordConstants.WSEvents.VOICE_STATE_UPDATE,
			(payload: GatewayVoiceStateUpdateDispatchData) => {
				if (
					payload.guild_id
					&& payload.session_id
					&& payload.user_id === client.user?.id
				) {
					this.adapters
						.get(payload.guild_id)
						?.onVoiceStateUpdate(payload);
				}
			},
		);
		client.on(DiscordConstants.Events.SHARD_DISCONNECT, (_, shardId) => {
			const guilds = this.trackedShards.get(shardId);
			if (guilds) {
				for (const guildID of guilds.values()) {
					this.adapters.get(guildID)?.destroy();
				}
			}

			this.trackedShards.delete(shardId);
		});
	}

	private trackGuild(guild: Guild) {
		let guilds = this.trackedShards.get(guild.shardId);
		if (!guilds) {
			guilds = new Set();
			this.trackedShards.set(guild.shardId, guilds);
		}

		guilds.add(guild.id);
	}

	public create(channel: VoiceChannel): DiscordGatewayAdapterCreator {
		return (methods) => {
			this.adapters.set(channel.guild.id, methods);
			this.trackClient(channel.client);
			this.trackGuild(channel.guild);

			return {
				sendPayload: (data) => {
					if (
						channel.guild.shard.status
						=== DiscordConstants.Status.READY
					) {
						channel.guild.shard.send(data);
						return true;
					}

					return false;
				},
				destroy: () => {
					channel.client.ws.removeAllListeners(
						DiscordConstants.WSEvents.VOICE_SERVER_UPDATE,
					);
					channel.client.ws.removeAllListeners(
						DiscordConstants.WSEvents.VOICE_STATE_UPDATE,
					);
					channel.client.ws.removeAllListeners(
						DiscordConstants.Events.SHARD_DISCONNECT,
					);
					return this.adapters.delete(channel.guild.id);
				},
			};
		};
	}
}
