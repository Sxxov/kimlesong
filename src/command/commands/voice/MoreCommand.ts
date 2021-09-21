import type { SlashCommandBuilder } from '@discordjs/builders';
import type { MessageEmbed } from 'discord.js';
import type { ContinuablePlaylistURL } from 'youtube-moosick';
import { Constants } from '../../../resources/Constants.js';
import { State } from '../../../state/StateManager.js';
import type { CommandBlueprint } from '../../CommandBlueprint.js';
import { AbstractCommand } from '../AbstractCommand.js';

export class MoreCommand extends AbstractCommand {
	public name = 'more';
	public description = 'Load more of the large playlist in the queue.';
	public aliases = ['m'];

	public override build(): SlashCommandBuilder {
		return super
			.build()
			.addStringOption((option) =>
				option
					.setName(Constants.SLASH_ARGUMENT_NAME)
					.setDescription(
						'the name, id, or url of the playlist to load more from',
					)
					.setRequired(false),
			) as SlashCommandBuilder;
	}

	public static more(): ContinuablePlaylistURL | null {
		const playlists = State.guildIdToQueuedPlaylists.get('');

		if (playlists == null) return null;

		for (const playlist of playlists) {
			if (playlist.continuation) {
				void playlist.playlistContents.loadNext();

				return playlist;
			}
		}

		return null;
	}

	public override async reply(info: CommandBlueprint): Promise<MessageEmbed> {
		const playlist = MoreCommand.more();

		if (playlist?.headers?.playlistName == null) {
			return (await super.reply(info)).setDescription(
				'nothing more to load.',
			);
		}

		return (await super.reply(info)).setDescription(
			`loading more from "${playlist?.headers?.playlistName}"...`,
		);
	}
}
