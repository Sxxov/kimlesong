import { createLogger, format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

export const Log = createLogger({
	format: format.combine(
		format.timestamp({
			format: 'YYY-MM-DD HH:mm:ss',
		}),
		format.errors({ stack: true }),
		format.splat(),
		format.json(),
	),
	transports: [
		new DailyRotateFile({
			filename: '%DATE%.log',
			datePattern: 'YYYY-MM-DD-HH',
			zippedArchive: true,
			maxSize: '20m',
			maxFiles: '14d',
			dirname: './#logs',
		}),
	],
});
