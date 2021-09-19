import {
	Client,
	Guild,
	Intents,
	Interaction,
	Message,
	TextBasedChannels,
} from 'discord.js';
import assert from 'assert';
import { Log } from '../log/Log.js';
import JSONdb from 'simple-json-db';
import { Constants } from '../resources/Constants.js';
import { YoutubeMoosick } from 'youtube-moosick';
import { State } from '../state/StateManager.js';
import { ArrayStore } from '../resources/blocks/classes/store/stores/ArrayStore.js';
import * as commands from '../command/commands';
import { CommandManager } from '../command/CommandManager.js';

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

	private static commandManager = new CommandManager(
		process.env.TOKEN!,
		process.env.CLIENT_ID!,
	);

	@listener
	public static async onReady() {
		Log.info(`Logged in as ${this.client.user!.tag}!`);

		State.guildIds = new ArrayStore();
		State.guildIds.push(...client.guilds.cache.map((guild) => guild.id));
		State.guildIds.forEach((guildId) => {
			State.guildIdToQueue.set(guildId, new ArrayStore());
			void this.commandManager.registerCommands(guildId);
		});
		State.guildIds.subscribeLazy((guildIds, modified) => {
			if (modified) {
				// deleted items (-ve indices)
				for (let i = 0, l = modified.length; i > l; --i) {
					if (guildIds[i]) {
						State.guildIdToQueue.delete(guildIds[i]);
					}
				}

				// added items (+ve indices)
				for (let i = 0, l = modified.length; i < l; ++i) {
					if (guildIds[i]) {
						State.guildIdToQueue.set(guildIds[i], new ArrayStore());
						void this.commandManager.registerCommands(guildIds[i]);
					}
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

				playlist.subscribeLazy(async (p, modified) => {
					const addedPlaylist = modified!.find(Boolean);
					if (
						(addedPlaylist?.playlistContents.length ?? 0)
							>= Constants.PLAYLIST_CONTENT_LIMIT
						&& addedPlaylist?.continuation
					) {
						(
							client.channels.cache.get(
								State.guildIdToQueueChannelId.get(guildId)
									?? '',
							) as TextBasedChannels
						)?.send({
							embeds: [
								await new commands.PlayCommand().onAddLargePlaylist(),
							],
						});
					}
				});
			}
		});
	}

	@listener
	public static async onInteractionCreate(interaction: Interaction) {
		if (interaction.guildId && interaction.channelId) {
			State.guildIdToQueueChannelId.set(
				interaction.guildId,
				interaction.channelId,
			);
		}

		if (interaction.isCommand()) {
			await this.commandManager.run({
				...interaction,
				argument:
					interaction.options.getString(Constants.SLASH_ARGUMENT_NAME)
					?? '',
				command: interaction.commandName,
				reply: interaction.reply.bind(interaction) as Message['reply'],
			});
		}
	}

	@listener
	public static async onMessageCreate(message: Message) {
		if (message.author.bot) return;

		const prefix =
			prefixDb.get(message.guildId ?? 'null') ?? Constants.DEFAULT_PREFIX;

		if (!message.content.startsWith(prefix)) return;

		const content = message.content.substr(prefix.length).trim();
		const [, command, , argument] = /^(\w+)( )?(.*)?$/.exec(content) ?? [];

		if (message.guildId && message.channelId) {
			State.guildIdToQueueChannelId.set(
				message.guildId,
				message.channelId,
			);
		}

		await this.commandManager.run({
			argument,
			command,
			...message,
			reply: message.reply.bind(message),
		});
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
