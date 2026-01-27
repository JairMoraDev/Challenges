import { Writable } from 'node:stream';

/**
 * A Writable stream that discards all data.
 * Used to keep the pipeline flowing.
 */
class NullWritable extends Writable {
    _write(chunk, encoding, callback) {
        // Data is processed by upstream events, so we just discard it here.
        callback();
    }
}

export default NullWritable;