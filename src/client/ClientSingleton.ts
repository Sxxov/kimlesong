import { Client, Guild, Intents, Interaction, Message } from 'discord.js';
import assert from 'assert';
import { PingCommand } from '../command/commands/PingCommand.js';
import { Log } from '../log/Log.js';
import JSONdb from 'simple-json-db';
import { Constants } from '../resources/Constants.js';
import { YoutubeMoosick } from 'youtube-moosick';
import { State } from '../state/StateManager.js';
import { ArrayStore } from '../resources/blocks/classes/store/stores/ArrayStore.js';
import * as commands from '../command/commands';

const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});
const ytm = await YoutubeMoosick.new();
const prefixDb = new JSONdb<string>('./db/prefix/v1.json');

function listener(target: ClientSingleton, propertyKey: string) {
	assert(propertyKey.startsWith('on'));

	client.on(
		`${propertyKey[2].toLowerCase()}${propertyKey.substr(3)}`,
		target[propertyKey as keyof ClientSingleton],
	);
}

export class ClientSingleton {
	public static client = client;
	public static ytm = ytm;

	@listener
	public static async onReady() {
		Log.info(`Logged in as ${this.client.user!.tag}!`);

		State.guildIds = new ArrayStore();
		State.guildIds.push(...client.guilds.cache.map((guild) => guild.id));
		State.guildIds.subscribe((guildIds, modified) => {
			if (modified) {
				// deleted items (-ve indices)
				for (let i = 0, l = modified.length; i > l; --i) {
					if (guildIds[i]) State.guildIdToQueue.delete(guildIds[i]);
				}

				// added items (+ve indices)
				for (let i = 0, l = modified.length; i < l; ++i) {
					if (guildIds[i])
						State.guildIdToQueue.set(guildIds[i], new ArrayStore());
				}
			}
		});

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

		State.guildIdToQueuedPlaylists.subscribeLazy((_, modified) => {
			if (modified?.[0] && modified?.[1]) {
				const [guildId, playlist] = modified;

				if (
					(playlist.headers?.songCount ?? 0)
					> Constants.PLAYLIST_CONTENT_LIMIT
				) {
					// TODO(sxxov): set State.guildIdToQueueChannel somewhere
					State.guildIdToQueueChannel
						.get(guildId)
						?.send(new commands.PlayCommand().onAddLargePlaylist());
				}
			}
		});
	}

	@listener
	public static async onInteractionCreate(interaction: Interaction) {
		if (!interaction.isCommand()) return;

		if (interaction.commandName === new PingCommand().name) {
			await interaction.reply('Pong!');
		}
	}

	@listener
	public static async onMessage(message: Message) {
		if (message.author.bot) return;

		const prefix =
			prefixDb.get(message.guildId ?? 'null') ?? Constants.DEFAULT_PREFIX;

		if (!message.content.startsWith(prefix)) return;

		const content = message.content.substr(prefix.length).trim();
		const [command, argument] = /^(\w+)( .*)?$/.exec(content) ?? [];
	}

	@listener
	public static async onGuildCreate(guild: Guild) {
		State.guildIds?.push(guild.id);
	}

	@listener
	public static async onGuildDelete(guild: Guild) {
		// server outage, not guild remove bot
		if (!guild.available) return;

		State.guildIds?.splice(State.guildIds.indexOf(guild.id), 1);
	}
}
