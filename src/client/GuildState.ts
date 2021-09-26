import type { Guild } from 'discord.js';
import type { ClientCredentialsItem } from './ClientCredentialsItem.js';
import { CommandManagerSingleton } from '../command/CommandManagerSingleton.js';
import { Constants } from '../resources/enums/Constants.js';

export class GuildState {
	public id: string;

	constructor(guild: Guild, private credentials: ClientCredentialsItem) {
		this.id = guild.id;

		void CommandManagerSingleton.registerCommands(guild.id, credentials);
		guild.me?.setNickname(Constants.DEFAULT_NICKNAME);
	}

	public destroy() {}
}
