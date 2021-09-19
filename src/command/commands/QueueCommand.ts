import { AbstractCommand } from './AbstractCommand.js';

export class QueueCommand extends AbstractCommand {
	public name = 'queue';
	public description = 'Shows the current queue';

	public onUpdated(): string {
		throw new Error('Method not implemented.');
	}

	public reply(): string {
		throw new Error('Method not implemented.');
	}
}
