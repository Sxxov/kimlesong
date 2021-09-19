import * as childProcess from 'child_process';
import { Log } from '../log/Log.js';

export class CrashHandlerSingleton {
	public static register() {
		process.on('uncaughtException', this.onError.bind(this));
		process.on('unhandledRejection', this.onError.bind(this));
	}

	private static onError(err: Error, origin: NodeJS.UncaughtExceptionOrigin) {
		Log.error(`FATAL: From ${origin.toString()}`);
		Log.error(err.stack);

		childProcess.fork(process.argv[1], {
			detached: true,
		});
	}
}
