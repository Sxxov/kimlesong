import { Readable, Duplex, DuplexOptions } from 'stream';
import { createWriteStream } from 'fs';
import ytdl, { YTDLStreamOptions } from 'discord-ytdl-core';
import type { Segment, SponsorBlock } from 'sponsorblock-api';
import type { AsyncQueueItem } from '../queue/AsyncQueueItem.js';
import type { SyncQueueItem } from '../queue/SyncQueueItem.js';
import { TimeUtility } from '../resources/utilities/TimeUtility.js';
import { IllegalArgumentError } from '../resources/errors/IllegalArgumentError.js';

export class SponsorBlockReadable extends Duplex {
	private currentReadable!: Readable;
	private queueItem!: AsyncQueueItem | SyncQueueItem;
	private sponsorBlock!: SponsorBlock;
	private isFinished = false;

	public override _read() {}

	public override read(size?: number) {
		if (this.writableFinished && this.readableLength <= 0) {
			this.emit('end');
			this.emit('close');
		}

		return super.read(size) as Buffer;
	}

	public override end() {}

	public close() {
		this.emit('close');
	}

	// Writes the data, push and set the delay/timeout
	public override _write(
		chunk: Buffer,
		encoding: BufferEncoding,
		next: (error?: Error | null) => void,
	) {
		this.push(chunk);
		next();
	}

	// When all the data is done passing, it stops.
	public override _final() {
		this.push(null);
	}

	private constructor(options: DuplexOptions = {}) {
		super(options);
	}

	public static async new(
		queueItem: AsyncQueueItem | SyncQueueItem,
		sponsorBlock: SponsorBlock,
		options: YTDLStreamOptions = {},
	) {
		const me = new this();
		me.queueItem = queueItem;
		me.sponsorBlock = sponsorBlock;

		const id = await queueItem.id;
		const url = await queueItem.url;

		if (id == null || url == null)
			throw new IllegalArgumentError(
				'attempted to construct with nullish id or url',
			);

		const segments = await me.getSegments(id);
		const execute = async () => {
			let lastSegmentEnd = 0;
			const ws = createWriteStream('./a.ogg');

			me.on('close', () => {
				ws.close();
			});

			for (let i = 0, l = segments.length + 1; i < l; ++i) {
				const segment: Segment | null = segments[i] ?? null;

				if (segment && segment.startTime <= 0) {
					lastSegmentEnd = segments[0].endTime;

					continue;
				}

				try {
					const readable = me.createYtdlReadableFromTo(
						url,
						lastSegmentEnd,
						segment?.startTime ?? Infinity,
						options,
					);

					// const readable = me.createYtdlReadable(await queueItem.url);

					me.currentReadable = readable;

					let isErrored = false;

					readable.pipe(me);
					me.pipe(ws);

					await new Promise<void>((resolve) => {
						readable.once('close', resolve);
						readable.on('close', () => {
							console.log('close');
						});
						readable.once('error', (err) => {
							me.emit('error', err);
							isErrored = true;
							resolve();
						});
					}).finally(() => {
						readable.removeAllListeners();
						// readable.unpipe(me);

						if (i - l === 1) me.isFinished = true;
					});

					if (isErrored) return;

					lastSegmentEnd = segment?.endTime ?? 0;
				} catch (err: unknown) {
					me.emit('error', err);
				}
			}
		};

		void execute();

		return me;
	}

	private createYtdlReadableFromTo(
		url: string,
		fromSecs: number,
		toSecs: number,
		options: YTDLStreamOptions = {},
	) {
		return this.createYtdlReadable(url, {
			...options,
			encoderArgs: [
				'-ss',
				TimeUtility.hhmmss(fromSecs * 1000, false),
				...(Number.isFinite(toSecs)
					? ['-to', TimeUtility.hhmmss(toSecs * 1000, false)]
					: []),
			],
		});
	}

	private async getSegments(videoId: string) {
		let segments: Segment[];

		try {
			segments = await this.sponsorBlock.getSegments(videoId, [
				'sponsor',
				'selfpromo',
				'interaction',
				'intro',
				'outro',
				'preview',
				'music_offtopic',
			]);
		} catch {
			return [];
		}

		return segments;
	}

	private createYtdlReadable(url: string, options: YTDLStreamOptions = {}) {
		return ytdl(url, {
			highWaterMark: 32 * 1024 * 1024,
			filter: 'audioonly',
			opusEncoded: true,
			...options,
		});
	}
}
