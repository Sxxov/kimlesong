import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const colorizer = winston.format.colorize();
export const Log = winston.createLogger({
	format: winston.format.combine(
		winston.format.timestamp({
			format: 'YYYY-MM-DD HH:mm:ss',
		}),
		winston.format.errors({ stack: true }),
		winston.format.splat(),
		winston.format.json(),
	),
	level: 'debug',
	transports: [
		new winston.transports.Console({
			format: winston.format.printf((info) =>
				colorizer.colorize(
					info.level,
					`[${String(
						info.timestamp,
					)}] [${info.level.toUpperCase()}]: ${info.message}${
						info.splat == null ? ' ' : `${String(info.splat)}`
					}`,
				),
			),
			level: 'debug',
		}),
		new DailyRotateFile({
			filename: '%DATE%.log',
			datePattern: 'YYYY-MM-DD-HH',
			zippedArchive: true,
			maxSize: '20m',
			maxFiles: '14d',
			dirname: './#logs',
			level: 'debug',
		}),
	],
});
