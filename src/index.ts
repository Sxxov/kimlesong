import type { Worker } from 'worker_threads';
import { Credentials } from './Credentials.js';
import { ClientWorkerFactory } from './worker/ClientWorkerFactory.js';
import type { ClientCredentialsItem } from './client/ClientCredentialsItem.js';
import { TrafficResponder } from './traffic/TrafficResponder.js';

export class KimLeSong {
	private workers: Worker[] = [];
	private trafficResponder: TrafficResponder;

	constructor() {
		Credentials.forEach(this.registerWorker.bind(this));

		this.trafficResponder = new TrafficResponder(this.workers);
	}

	private registerWorker(credentials: ClientCredentialsItem) {
		const worker = new ClientWorkerFactory().create(credentials);

		this.workers.push(worker);
	}
}

// eslint-disable-next-line no-new
new KimLeSong();
