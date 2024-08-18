type LogLevel = 'debug' | 'info' | 'warn' | 'error';
declare const DEV_MODE: boolean;
declare const LOG_DEBUG: LogLevel;
declare const LOG_INFO: LogLevel;
declare const LOG_WARN: LogLevel;
declare const LOG_ERROR: LogLevel;
declare const log: <T>(value: T, msg: string, level?: LogLevel) => T;
export { /* type Log, */ log, DEV_MODE, LOG_DEBUG, LOG_INFO, LOG_WARN, LOG_ERROR };
