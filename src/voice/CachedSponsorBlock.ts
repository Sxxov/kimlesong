import { Category, Segment, SponsorBlock, Video } from 'sponsorblock-api';
import type { VideoResolvable } from 'sponsorblock-api/lib/types/Video';

export class CachedSponsorBlock extends SponsorBlock {
	private static videoIdToSegmentsCache: Map<string | Video, Segment[]> =
		new Map();

	public override async getSegments(
		video: VideoResolvable,
		categories?: Category[],
		...requiredSegments: string[]
	): Promise<Segment[]> {
		const videoId = typeof video === 'string' ? video : video.videoID;
		const segments = CachedSponsorBlock.videoIdToSegmentsCache.get(videoId);

		if (segments != null) return segments;

		const result = await super.getSegments(
			video,
			categories,
			...requiredSegments,
		);

		CachedSponsorBlock.videoIdToSegmentsCache.set(videoId, result);

		return result;
	}
}
