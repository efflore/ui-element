/* === Types === */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/* === Constants === */

const DEV_MODE = process.env.DEV_MODE === 'true'

const LOG_DEBUG: LogLevel = 'debug'
const LOG_INFO: LogLevel = 'info'
const LOG_WARN: LogLevel = 'warn'
const LOG_ERROR: LogLevel = 'error'

/* === Default Export */

const log = <T>(value: T, msg: string, level: LogLevel = LOG_DEBUG): T => {
	if (DEV_MODE || ([LOG_ERROR, LOG_WARN] as LogLevel[]).includes(level)) console[level](msg, value)
	return value
}

export { log, DEV_MODE, LOG_DEBUG, LOG_INFO, LOG_WARN, LOG_ERROR }