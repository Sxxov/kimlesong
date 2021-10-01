import { Client, Guild, Intents, Interaction, Message } from 'discord.js';
import assert from 'assert';
import { Log } from '../log/Log.js';
import JSONdb from 'simple-json-db';
import { Constants } from '../resources/enums/Constants.js';
import { State } from '../state/State.js';
import { CommandManagerSingleton } from '../command/CommandManagerSingleton.js';
import { CommandBlueprintAdapter } from '../command/adapters/CommandBlueprintAdapter.js';
import type { ClientCredentialsItem } from './ClientCredentialsItem.js';
import { GuildState } from './GuildState.js';
import { VoiceChannelStateFactory } from '../voice/VoiceChannelStateFactory.js';
import { CrashHandlerSingleton } from './CrashHandlerSingleton.js';
import AbortController from 'abort-controller';
import { MoosickApi } from '../moosick/MoosickApi.js';
import SpotifyWebApi from 'spotify-web-api-node';
import type { YoutubeMoosick } from 'youtube-moosick';

export class ClientSingleton {
	public static prefixDb = new JSONdb<string>('./db/prefix/v1.json');
	public static client = new Client({
		intents: [
			Intents.FLAGS.GUILDS,
			Intents.FLAGS.GUILD_MESSAGES,
			Intents.FLAGS.GUILD_VOICE_STATES,
		],
		presence: {
			status: 'dnd',
			activities: [
				{
					name: 'ur mom',
					type: 'LISTENING',
				},
			],
		},
	});

	public static ytm = new MoosickApi() as YoutubeMoosick;
	public static spotify = new SpotifyWebApi();
	public static credentials: ClientCredentialsItem;

	public static async register(
		discordCredentials: ClientCredentialsItem,
		spotifyCredentials: ClientCredentialsItem,
	) {
		this.credentials = discordCredentials;

		(global as Record<any, any>).AbortController = AbortController;

		CrashHandlerSingleton.register();

		this.spotify.setCredentials({
			clientId: spotifyCredentials.clientId,
			clientSecret: spotifyCredentials.token,
		});

		await this.authenticateSpotify();
		await this.client.login(discordCredentials.token);
	}

	private static async authenticateSpotify() {
		const spotifyAuthResult = await this.spotify.clientCredentialsGrant();

		this.spotify.setAccessToken(spotifyAuthResult.body.access_token);

		setTimeout(() => {
			void this.authenticateSpotify();
		}, spotifyAuthResult.body.expires_in * 1000 - 5000);
	}

	public static voiceChannelStateFactory = new VoiceChannelStateFactory(
		this.client,
		this.ytm,
		this.spotify,
	);

	@ClientSingleton.listener
	public static async onReady() {
		Log.info(`Logged in as ${this.client.user!.tag}!`);

		State.guilds.append(
			this.client.guilds.cache.map(
				(guild) => new GuildState(guild, this.credentials),
			),
		);
	}

	@ClientSingleton.listener
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

	@ClientSingleton.listener
	public static async onMessageCreate(message: Message) {
		if (message.author.bot) return;

		const prefix =
			this.prefixDb.get(message.guildId ?? 'null')
			?? Constants.DEFAULT_PREFIX;

		if (!message.content.startsWith(prefix)) return;

		for (const line of message.content.split('\n')) {
			const content = line.substr(prefix.length).trim();
			const [, commandId, , argument] =
				/^(\w+|\?)( )?(.*)?$/.exec(content) ?? [];

			await CommandManagerSingleton.run(
				CommandBlueprintAdapter.adaptMessage(
					message,
					commandId.toLowerCase(),
					argument,
				),
			);
		}
	}

	@ClientSingleton.listener
	public static async onGuildCreate(guild: Guild) {
		State.guilds.push(new GuildState(guild, this.credentials));
	}

	@ClientSingleton.listener
	public static async onGuildDelete(guild: Guild) {
		// server outage, not guild remove bot
		if (!guild.available) return;

		const [deleted] = State.guilds.splice(
			State.guilds.findIndex((g) => g.id === guild.id),
			1,
		);

		deleted.destroy();
	}

	public static listener(target: ClientSingleton, propertyKey: string) {
		assert(propertyKey.startsWith('on'));

		ClientSingleton.client.on(
			`${propertyKey[2].toLowerCase()}${propertyKey.substr(3)}`,
			(target[propertyKey as keyof ClientSingleton] as () => any).bind(
				target,
			),
		);
	}
}
