import { MessageEmbed } from 'discord.js';

const IS_ERROR = Symbol('IS_ERROR');

export class ErrorMessageEmbed extends MessageEmbed {
	public static readonly IS_ERROR = IS_ERROR;
	public [IS_ERROR] = true;
}
