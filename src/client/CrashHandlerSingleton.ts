import type { TextBasedChannels } from 'discord.js';
import { AbstractCommand } from '../command/commands/AbstractCommand.js';
import { Log } from '../log/Log.js';
import { State } from '../state/State.js';
import { ClientSingleton } from './ClientSingleton.js';

export class CrashHandlerSingleton {
	public static register() {
		process.on('uncaughtException', this.onError.bind(this));
		process.on('unhandledRejection', this.onError.bind(this));
	}

	private static onError(err: Error, origin: NodeJS.UncaughtExceptionOrigin) {
		State.guildIdToVoiceChannel.forEach((vc) => {
			try {
				void vc.lastCommandBlueprint?.reply({
					embeds: [AbstractCommand.errorInternal(503)],
				});
			} catch {
				void (
					ClientSingleton.client.guilds.cache
						.get(vc.guildId)
						?.channels.cache.get(
							vc.lastCommandBlueprint?.channelId ?? '',
						) as TextBasedChannels
				).send({
					embeds: [AbstractCommand.errorInternal(503)],
				});
			}
		});

		Log.error(`DEGRADED: From ${origin.toString()}`);
		Log.error(err.stack);
	}
}
