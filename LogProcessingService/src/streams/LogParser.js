import { Transform } from 'node:stream';

/**
 * A Transform stream that parses a log line and emits an event for each log level.
 * It expects lines in the format: "TIMESTAMP|LEVEL|MESSAGE".
 */
class LogParser extends Transform {
    #eventEmitter;

    /**
     * @param {import('events').EventEmitter} eventEmitter - An EventEmitter instance to emit log events.
     * @param {import('stream').TransformOptions} options - Stream options.
     */
    constructor(eventEmitter, options) {
        super({ ...options, decodeStrings: false });
        this.#eventEmitter = eventEmitter;
    }

    /**
     * @param {string} line The line to transform.
     * @param {string} encoding The encoding of the line.
     * @param {import('stream').TransformCallback} callback A callback function to be called when processing is complete.
     */
    _transform(line, encoding, callback) {
        const [timestamp, level, ...messageParts] = line.toString().split('|');
        const message = messageParts.join('|');

        if (timestamp && level && message) {
            const log = {
                timestamp,
                level,
                message,
            };

            // Emit an event for the specific log level
            this.#eventEmitter.emit(`log:${level.toLowerCase()}`, log);
            
            // We can also emit a general 'log' event
            this.#eventEmitter.emit('log', log);

            // Pass the parsed log object downstream
            this.push(JSON.stringify(log));
        }

        callback();
    }
}

export default LogParser;
