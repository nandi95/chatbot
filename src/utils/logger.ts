import { bold, cyan, gray, italic, red, yellow } from 'colors';
import { DEBUG, TZ as timeZone } from '../config';

/* eslint-disable @typescript-eslint/naming-convention,@typescript-eslint/prefer-enum-initializers */
export enum LogLevels {
    Debug,
    Info,
    Warn,
    Error,
    Fatal
}

/* eslint-enable @typescript-eslint/naming-convention,@typescript-eslint/prefer-enum-initializers */

const prefixes = new Map<LogLevels, string>([
    [LogLevels.Debug, 'DEBUG'],
    [LogLevels.Info, 'INFO'],
    [LogLevels.Warn, 'WARN'],
    [LogLevels.Error, 'ERROR'],
    [LogLevels.Fatal, 'FATAL']
]);
const noColor: (str: string) => string = (msg) => msg;
// eslint-disable-next-line @typescript-eslint/no-extra-parens
const colorFunctions = new Map<LogLevels, (str: string) => string>([
    [LogLevels.Debug, gray],
    [LogLevels.Info, cyan],
    [LogLevels.Warn, yellow],
    [LogLevels.Error, (str: string) => red(str)],
    [LogLevels.Fatal, (str: string) => red(bold(italic(str)))]
]);

function logger({
    logLevel = LogLevels.Info,
    name = 'Main'
}: {
    logLevel?: LogLevels;
    name?: string;
} = {}) {
    function log(level: LogLevels, ...args: unknown[]) {
        if (level < logLevel) return;
        let color = colorFunctions.get(level);
        if (!color) color = noColor;
        const date = new Date();
        const logValues: string[] = [
            `[${date.toLocaleDateString('en-GB', { timeZone })}` +
            ` ${date.toLocaleTimeString('en-GB', { timeZone })}]`,
            color(prefixes.get(level) ?? 'DEBUG'),
            name ? `${name} >` : '>',
            // @ts-expect-error - js can handle the type juggling
            ...args
        ];
        switch (level) {
            case LogLevels.Debug:
                if (!DEBUG) return;

                return console.debug(...logValues);
            case LogLevels.Info:
                return console.info(...logValues);
            case LogLevels.Warn:
                return console.warn(...logValues);
            case LogLevels.Error:
                return console.error(...logValues);
            case LogLevels.Fatal:
                return console.error(...logValues);
            default:
                return console.log(...logValues);
        }
    }

    function setLevel(level: LogLevels) {
        logLevel = level;
    }

    function debug(...args: unknown[]) {
        log(LogLevels.Debug, ...args);
    }

    function info(...args: unknown[]) {
        log(LogLevels.Info, ...args);
    }

    function warn(...args: unknown[]) {
        log(LogLevels.Warn, ...args);
    }

    function error(...args: unknown[]) {
        log(LogLevels.Error, ...args);
    }

    function fatal(...args: unknown[]) {
        log(LogLevels.Fatal, ...args);
    }

    return {
        log,
        setLevel,
        debug,
        info,
        warn,
        error,
        fatal
    };
}

export const log = logger({
    logLevel: DEBUG ? LogLevels.Debug : LogLevels.Info
});
