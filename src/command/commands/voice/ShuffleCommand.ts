import type { MessageEmbed } from 'discord.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { AbstractVoiceCommand } from '../AbstractVoiceCommand.js';

export class ShuffleCommand extends AbstractVoiceCommand {
	public static override id = 'shuffle';
	public static override description = 'shuffles the queue.';
	public static override aliases = ['x'];

	public override async getEmbed(
		info: CommandBlueprint,
	): Promise<MessageEmbed> {
		const { queue } = this.ctx;

		if (queue == null) return ShuffleCommand.errorInternal();

		ShuffleCommand.applyShuffleToArray(queue.value);
		queue.trigger();

		return (await super.getEmbed(info)).setDescription('shuffled queue.');
	}

	public static applyShuffleToArray<T>(array: T[]) {
		for (let i = array.length - 2; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			const temp = array[i + 1];
			array[i + 1] = array[j + 1];
			array[j + 1] = temp;
		}
	}
}
