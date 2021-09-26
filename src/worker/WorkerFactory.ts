import { Worker } from 'worker_threads';
import * as pathTool from 'path';
import { fileURLToPath } from 'url';

export class WorkerFactory {
	constructor(private path: string) {}

	public create(workerData?: any) {
		return new Worker(
			pathTool.join(
				pathTool.dirname(fileURLToPath(import.meta.url)),
				this.path,
			),
			{
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				workerData,
			},
		);
	}
}
