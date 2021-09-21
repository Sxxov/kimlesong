import type { VoiceChannelState } from '../../state/states/VoiceChannelState.js';
import { AbstractCommand } from './AbstractCommand.js';

export class AbstractVoiceCommand extends AbstractCommand {
	constructor(protected ctx: VoiceChannelState) {
		super();
	}
}
