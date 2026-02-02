import { jest } from '@jest/globals';
import LineSplitter from '../../src/streams/LineSplitter.js';
import { Readable } from 'node:stream';

describe('LineSplitter', () => {
    test('should split a simple multi-line string', (done) => {
        const splitter = new LineSplitter();
        const input = 'line1\nline2\nline3';
        const expected = ['line1', 'line2', 'line3'];
        const result = [];

        splitter.on('data', (chunk) => {
            result.push(chunk.toString());
        });

        splitter.on('end', () => {
            expect(result).toEqual(expected);
            done();
        });

        splitter.write(Buffer.from(input));
        splitter.end();
    });

    test('should handle split lines across chunks', (done) => {
        const splitter = new LineSplitter();
        const chunk1 = 'li';
        const chunk2 = 'ne1\nli';
        const chunk3 = 'ne2';
        const expected = ['line1', 'line2'];
        const result = [];

        splitter.on('data', (chunk) => {
            result.push(chunk.toString());
        });

        splitter.on('end', () => {
            expect(result).toEqual(expected);
            done();
        });

        splitter.write(Buffer.from(chunk1));
        splitter.write(Buffer.from(chunk2));
        splitter.write(Buffer.from(chunk3));
        splitter.end();
    });

    test('should handle last line without newline', (done) => {
        const splitter = new LineSplitter();
        const input = 'line1\nline2'; // No trailing newline
        const expected = ['line1', 'line2'];
        const result = [];

        splitter.on('data', (chunk) => {
            result.push(chunk.toString());
        });

        splitter.on('end', () => {
            expect(result).toEqual(expected);
            done();
        });

        splitter.write(Buffer.from(input));
        splitter.end();
    });

    test('should handle multi-byte characters', (done) => {
        const splitter = new LineSplitter();
        // Euro sign is 3 bytes: 0xE2 0x82 0xAC
        const euro = '€';
        const input = `Price: ${euro}\nEnd`;

        const result = [];

        splitter.on('data', (chunk) => {
            result.push(chunk.toString());
        });

        splitter.on('end', () => {
            expect(result).toEqual([`Price: ${euro}`, 'End']);
            done();
        });

        // Split the multibyte character across chunks
        // '€' in utf8 buffer
        const buffer = Buffer.from(input);
        // Index of euro: "Price: " is 7 chars.

        // Write first part including 1 byte of Euro
        splitter.write(buffer.subarray(0, 8));
        // Write rest
        splitter.write(buffer.subarray(8));
        splitter.end();
    });
});
