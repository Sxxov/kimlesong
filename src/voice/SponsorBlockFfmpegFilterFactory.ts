import type { Segment, SponsorBlock } from 'sponsorblock-api';

export class SponsorBlockFfmpegFilterFactory {
	constructor(private sponsorBlock: SponsorBlock) {}

	public async create(videoId: string) {
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

		const filter = segments.map(
			({ startTime, endTime }, i) =>
				`[0:a]atrim=start=${startTime}:end=${endTime},asetpts=PTS-STARTPTS[${i}a]`,
		);
		filter.push(
			`${filter.map((_, i) => `[${i}a]`).join('')}concat=n=${
				filter.length
			}:a=1[outa]`,
		);
		filter.push('-map [outa]');

		return filter;
	}
}
