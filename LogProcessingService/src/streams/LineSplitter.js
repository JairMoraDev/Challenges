import { Transform } from 'node:stream';
import { StringDecoder } from 'node:string_decoder';

/**
 * A Transform stream that splits a stream of binary data into individual lines.
 * It handles multi-byte characters and line breaks that span across multiple chunks.
 */
class LineSplitter extends Transform {
    #decoder = new StringDecoder('utf-8');
    #buffer = '';

    /**
     * @param {Buffer} chunk The chunk of data to transform.
     * @param {string} encoding The encoding of the chunk.
     * @param {import('stream').TransformCallback} callback A callback function to be called when processing is complete.
     */
    _transform(chunk, encoding, callback) {
        // Append the current chunk to the buffer
        this.#buffer += this.#decoder.write(chunk);
        
        // Process the buffer to find complete lines
        let boundary;
        while ((boundary = this.#buffer.indexOf('\n')) !== -1) {
            const line = this.#buffer.substring(0, boundary);
            this.#buffer = this.#buffer.substring(boundary + 1);
            this.push(line);
        }

        callback();
    }

    /**
     * Called when there is no more data to be consumed from the input stream.
     * It processes any remaining data in the buffer.
     * @param {import('stream').TransformCallback} callback A callback function to be called when flushing is complete.
     */
    _flush(callback) {
        // Flush any remaining bytes from the decoder
        this.#buffer += this.#decoder.end();

        // If there's any remaining data in the buffer, it's the last line
        if (this.#buffer) {
            this.push(this.#buffer);
            this.#buffer = '';
        }
        callback();
    }
}

export default LineSplitter;
