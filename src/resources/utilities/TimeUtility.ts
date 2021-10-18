export class TimeUtility {
	public static hhmmss(ms: number, isSecondsFloored = true) {
		const msOnly = ms % 1000;
		ms = (ms - msOnly) / 1000;
		const secs = ms % 60;
		ms = (ms - secs) / 60;
		const mins = ms % 60;
		const hrs = (ms - mins) / 60;

		return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(
			2,
			'0',
		)}:${String(secs).padStart(2, '0')}${
			isSecondsFloored
				? ''
				: `.${String(msOnly).padStart(2, '0').replace('.', '')}`
		}`;
	}

	public static msStrict(hhmmss: string) {
		const hh = Number(hhmmss.substr(0, 2));
		const mm = Number(hhmmss.substr(3, 2));
		const ss = Number(hhmmss.substr(6, 2));

		return hh * 60 * 60 * 1000 + mm * 60 * 1000 + ss * 60 * 1000;
	}

	public static ms(hhmmss: string) {
		const hhmmssParts = hhmmss.split(':').map((number) => Number(number));

		if (hhmmssParts.length < 3) {
			hhmmssParts.unshift(
				...new Array<number>(3 - hhmmssParts.length).fill(0),
			);
		}

		const [hh, mm, ss] = hhmmssParts;

		return hh * 60 * 60 * 1000 + mm * 60 * 1000 + ss * 60 * 1000;
	}
}
