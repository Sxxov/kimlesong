import { Log } from '../log/Log.js';

export class CrashHandlerSingleton {
	public static register() {
		process.on('uncaughtException', this.onError.bind(this));
		process.on('unhandledRejection', this.onError.bind(this));
	}

	private static onError(err: Error, origin: NodeJS.UncaughtExceptionOrigin) {
		Log.error(`DEGRADED: From ${origin.toString()}`);
		Log.error(err.stack);
	}
}
