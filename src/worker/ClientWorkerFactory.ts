import { Worker } from 'worker_threads';
import * as pathTool from 'path';
import { fileURLToPath } from 'url';
import type { ClientCredentialsItem } from '../client/ClientCredentialsItem.js';

export class ClientWorkerFactory {
	public create(credentials: ClientCredentialsItem) {
		return new Worker(
			pathTool.join(
				pathTool.dirname(fileURLToPath(import.meta.url)),
				'ClientWorker.js',
			),
			{
				workerData: credentials,
			},
		);
	}
}
