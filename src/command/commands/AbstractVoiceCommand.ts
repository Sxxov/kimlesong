import type { BaseGuildVoiceChannel } from 'discord.js';
import type { VoiceChannelState } from '../../voice/VoiceChannelState.js';
import { AbstractCommand } from './AbstractCommand.js';

export class AbstractVoiceCommand extends AbstractCommand {
	constructor(protected ctx: VoiceChannelState) {
		super();
	}

	protected override getAuthorName() {
		return `#${
			(
				this.ctx.client.channels.cache.get(
					this.ctx.id,
				) as BaseGuildVoiceChannel
			).name
		}`;
	}
}
