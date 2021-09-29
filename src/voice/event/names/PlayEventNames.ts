export const enum PlayEventNames {
	/** fired after a connection has been established */
	CONNECT = 'connect',
	/** fired after playing has started */
	START = 'start',
	/** fired after playing was interrupted */
	INTERRUPT = 'interrupt',
	/** fired after a queue item was played to the end successfully */
	END = 'end',
	/** fired after an error is thrown */
	ERROR = 'error',
}
