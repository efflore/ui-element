/* === Types === */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/* type Log<A> = {
  (): A
  map: <B>(f: (a: A) => B, mapMsg?: string, mapLevel?: LogLevel) => Log<B>
  chain: <B>(f: (a: A) => Log<B>) => Log<B>
} */

/* === Constants === */

const DEV_MODE = process.env.DEV_MODE === 'true'

const LOG_DEBUG: LogLevel = 'debug'
const LOG_INFO: LogLevel = 'info'
const LOG_WARN: LogLevel = 'warn'
const LOG_ERROR: LogLevel = 'error'

/* === Internal Functions === */

const shouldLog = (level: LogLevel): boolean => DEV_MODE || (level === LOG_WARN) || (level === LOG_ERROR)

/* === Default Export */

const log = <T>(value: T, msg: string, level: LogLevel = LOG_DEBUG): T => {
  if (shouldLog(level)) console[level](msg, value)
  return value
}

/* const log = <A>(value: A, msg: string, level: LogLevel = LOG_DEBUG): Log<A> => {
  const l = () => {
    if (shouldLog(level)) console[level](msg, value)
    return value
  }
  l.map = <B>(f: (a: A) => B, msgB: string = msg, levelB: LogLevel = level): Log<B> =>
    log(f(l()), msgB, levelB)
  l.chain = <B>(f: (a: A) => Log<B>): Log<B> => f(l())
  return l
} */

export { /* type Log, */ log, DEV_MODE, LOG_DEBUG, LOG_INFO, LOG_WARN, LOG_ERROR }