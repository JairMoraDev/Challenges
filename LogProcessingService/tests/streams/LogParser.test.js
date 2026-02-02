import { jest } from '@jest/globals';
import LogParser from '../../src/streams/LogParser.js';
import { EventEmitter } from 'node:events';

describe('LogParser', () => {
    let eventEmitter;
    let parser;

    beforeEach(() => {
        eventEmitter = new EventEmitter();
        parser = new LogParser(eventEmitter, {});
    });

    test('should parse a valid log line and emit events', (done) => {
        const line = '2023-10-27T10:00:00Z|INFO|This is a message';
        const expectedLog = {
            timestamp: '2023-10-27T10:00:00Z',
            level: 'INFO',
            message: 'This is a message'
        };

        let logEventEmitted = false;
        let specificLogEventEmitted = false;

        eventEmitter.on('log', (log) => {
            expect(log).toEqual(expectedLog);
            logEventEmitted = true;
        });

        eventEmitter.on('log:info', (log) => {
            expect(log).toEqual(expectedLog);
            specificLogEventEmitted = true;
        });

        parser.on('data', (chunk) => {
            const parsed = JSON.parse(chunk.toString());
            expect(parsed).toEqual(expectedLog);
        });

        parser.on('end', () => {
            expect(logEventEmitted).toBe(true);
            expect(specificLogEventEmitted).toBe(true);
            done();
        });

        parser.write(line);
        parser.end();
    });

    test('should handle message with delimiters', (done) => {
        const line = '2023-10-27T10:00:00Z|ERROR|Error code | 500';
        const expectedLog = {
            timestamp: '2023-10-27T10:00:00Z',
            level: 'ERROR',
            message: 'Error code | 500'
        };

        eventEmitter.on('log', (log) => {
            expect(log).toEqual(expectedLog);
        });

        parser.on('data', (chunk) => {
            const parsed = JSON.parse(chunk.toString());
            expect(parsed).toEqual(expectedLog);
        });

        parser.on('end', done);

        parser.write(line);
        parser.end();
    });

    test('should ignore invalid lines', (done) => {
        const line = 'Invalid log line';

        let logEventEmitted = false;
        eventEmitter.on('log', () => {
            logEventEmitted = true;
        });

        parser.on('data', () => {
            // Should not receive data for invalid line
        });

        parser.on('end', () => {
            expect(logEventEmitted).toBe(false);
            done();
        });

        parser.write(line);
        parser.end();
    });
});
