import { promises as fs } from 'fs';
import * as pathTool from 'path';
import { fileURLToPath } from 'url';
import type { ClientCredentialsItem } from './client/ClientCredentialsItem.js';

export const Credentials = JSON.parse(
	(await fs
		.readFile(
			pathTool.join(
				pathTool.dirname(fileURLToPath(import.meta.url)),
				'../#credentials.json',
			),
			{ encoding: 'utf8' },
		)
		.catch(() => '')) ?? process.env.CREDENTIALS!,
) as ClientCredentialsItem[];
