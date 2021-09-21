import type { ClientCredentialsItem } from '../../client/ClientCredentialsItem.js';
import { CommandManagerSingleton } from '../../command/CommandManagerSingleton.js';

export class GuildState {
	constructor(public id: string, private credentials: ClientCredentialsItem) {
		void CommandManagerSingleton.registerCommands(id, credentials);
	}

	public destroy() {}
}
