import { workerData } from 'worker_threads';
import type { ClientCredentialsItem } from '../client/ClientCredentialsItem.js';
import { ClientSingleton } from '../client/ClientSingleton.js';

export class ClientWorker {
	public static async register(
		discordCredentials: ClientCredentialsItem,
		spotifyCredentials: ClientCredentialsItem,
	) {
		await ClientSingleton.register(discordCredentials, spotifyCredentials);
	}
}

await ClientWorker.register(
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	workerData.discordCredentials,
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	workerData.spotifyCredentials,
);
