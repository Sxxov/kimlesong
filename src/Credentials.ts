import { promises as fs } from 'fs';
import * as pathTool from 'path';
import { fileURLToPath } from 'url';
import type { ClientCredentialsItem } from './client/ClientCredentialsItem.js';

export const DiscordCredentials = JSON.parse(
	(await fs
		.readFile(
			pathTool.join(
				pathTool.dirname(fileURLToPath(import.meta.url)),
				'../#discord.credentials.json',
			),
			{ encoding: 'utf8' },
		)
		.catch(() => '')) ?? process.env.DISCORD_CREDENTIALS!,
) as ClientCredentialsItem[];

export const SpotifyCredentials = JSON.parse(
	(await fs
		.readFile(
			pathTool.join(
				pathTool.dirname(fileURLToPath(import.meta.url)),
				'../#spotify.credentials.json',
			),
			{ encoding: 'utf8' },
		)
		.catch(() => '')) ?? process.env.SPOTIFY_CREDENTIALS!,
) as ClientCredentialsItem[];
