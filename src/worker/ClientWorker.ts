import { workerData } from 'worker_threads';
import type { ClientCredentialsItem } from '../client/ClientCredentialsItem.js';
import { ClientSingleton } from '../client/ClientSingleton.js';

export class ClientWorker {
	public static async register(credentials: ClientCredentialsItem) {
		await ClientSingleton.register(credentials);
	}
}

await ClientWorker.register(workerData);
