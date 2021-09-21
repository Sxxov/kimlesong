import { Client, Guild, Intents, Interaction, Message } from 'discord.js';
import assert from 'assert';
import { Log } from '../log/Log.js';
import JSONdb from 'simple-json-db';
import { Constants } from '../resources/Constants.js';
import { YoutubeMoosick } from 'youtube-moosick';
import { State } from '../state/State.js';
import { CommandManagerSingleton } from '../command/CommandManagerSingleton.js';
import { CommandBlueprintAdapter } from '../command/adapters/CommandBlueprintAdapter.js';
import { ClientCredentialsItem } from './ClientCredentialsItem.js';
import { GuildState } from '../state/states/GuildState.js';
import { VoiceChannelStateFactory } from '../state/states/VoiceChannelStateFactory.js';

const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});
const ytm = await YoutubeMoosick.new();
const prefixDb = new JSONdb<string>('./db/prefix/v1.json');

function listener(target: ClientSingleton, propertyKey: string) {
	assert(propertyKey.startsWith('on'));

	client.on(
		`${propertyKey[2].toLowerCase()}${propertyKey.substr(3)}`,
		(target[propertyKey as keyof ClientSingleton] as () => any).bind(
			target,
		),
	);
}

export class ClientSingleton {
	public static client = client;
	public static ytm = ytm;
	public static credentials = ClientCredentialsItem.from({
		token: process.env.TOKEN!,
		clientId: process.env.CLIENT_ID!,
	});

	public static voiceChannelStateFactory = new VoiceChannelStateFactory(
		this.client,
		this.ytm,
	);

	@listener
	public static async onReady() {
		Log.info(`Logged in as ${this.client.user!.tag}!`);

		State.guilds.append(
			client.guilds.cache.map(
				(guild) => new GuildState(guild.id, this.credentials),
			),
		);

		// State.guildIdToQueue.subscribeLazy((_, modified) => {
		// 	if (modified?.[0] && modified?.[1]) {
		// 		const [guildId, queue] = modified;

		// 		queue.subscribeLazy(() => {
		// 			State.guildIdToPendingMessage
		// 				.get(guildId)
		// 				?.channel.send(new commands.QueueCommand().onUpdated());
		// 		});
		// 	}
		// });

		// State.guildIdToQueuedPlaylists.subscribeLazy((_, modified) => {
		// 	if (modified?.[0] && modified?.[1]) {
		// 		const [guildId, playlist] = modified;

		// 		playlist.subscribeLazy(async (p, modified) => {
		// 			const addedPlaylist = modified!.find(Boolean);
		// 			if (
		// 				(addedPlaylist?.playlistContents.length ?? 0)
		// 					>= Constants.PLAYLIST_CONTENT_LIMIT
		// 				&& addedPlaylist?.continuation
		// 			) {
		// 				(
		// 					client.channels.cache.get(
		// 						State.guildIdToQueueChannelId.get(guildId)
		// 							?? '',
		// 					) as TextBasedChannels
		// 				)?.send({
		// 					embeds: [
		// 						await new PlayCommand().onAddLargePlaylist(),
		// 					],
		// 				});
		// 			}
		// 		});
		// 	}
		// });
	}

	@listener
	public static async onInteractionCreate(interaction: Interaction) {
		if (interaction.isCommand()) {
			await CommandManagerSingleton.run(
				CommandBlueprintAdapter.adaptCommandInteraction(interaction),
			);
		}

		if (interaction.isButton()) {
			await CommandManagerSingleton.act(interaction);
		}
	}

	@listener
	public static async onMessageCreate(message: Message) {
		if (message.author.bot) return;

		const prefix =
			prefixDb.get(message.guildId ?? 'null') ?? Constants.DEFAULT_PREFIX;

		if (!message.content.startsWith(prefix)) return;

		for (const line of message.content.split('\n')) {
			const content = line.substr(prefix.length).trim();
			const [, commandId, , argument] =
				/^(\w+)( )?(.*)?$/.exec(content) ?? [];

			await CommandManagerSingleton.run(
				CommandBlueprintAdapter.adaptMessage(
					message,
					commandId,
					argument,
				),
			);
		}
	}

	@listener
	public static async onGuildCreate(guild: Guild) {
		State.guilds.push(new GuildState(guild.id, this.credentials));
	}

	@listener
	public static async onGuildDelete(guild: Guild) {
		// server outage, not guild remove bot
		if (!guild.available) return;

		const [deleted] = State.guilds.splice(
			State.guilds.findIndex((g) => g.id === guild.id),
			1,
		);

		deleted.destroy();
	}
}
