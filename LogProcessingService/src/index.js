import { createReadStream, existsSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { EventEmitter } from 'node:events';
import path from 'node:path';

import LineSplitter from './streams/LineSplitter.js';
import LogParser from './streams/LogParser.js';
import NullWritable from './streams/NullWritable.js';
import StatsService from './services/StatsService.js';

const FILE_PATH = path.join(process.cwd(), 'data', 'app.log');

async function main() {
    console.time('Total execution time');
    const startMemoryUsage = process.memoryUsage().heapUsed;

    if (!existsSync(FILE_PATH)) {
        console.error(`Error: Log file not found at '${FILE_PATH}'`);
        console.error('Please generate the log file first by running: npm run generate:logs -- <size_in_gb>');
        process.exit(1);
    }

    const eventEmitter = new EventEmitter();
    const statsService = new StatsService(eventEmitter);
    statsService.listen();

    try {
        await pipeline(
            createReadStream(FILE_PATH, { highWaterMark: 64 * 1024 }), // 64KB highWaterMark
            new LineSplitter(),
            new LogParser(eventEmitter),
            new NullWritable()
        );

        console.log('--- Pipeline finished successfully ---');

    } catch (err) {
        console.error('Pipeline failed:', err);
    } finally {
        const endMemoryUsage = process.memoryUsage().heapUsed;
        statsService.printStats();
        console.log(`\n--- Performance ---`);
        console.log(`Start memory usage: ${(startMemoryUsage / 1024 / 1024).toFixed(2)} MB`);
        console.log(`End memory usage: ${(endMemoryUsage / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Memory usage delta: ${((endMemoryUsage - startMemoryUsage) / 1024 / 1024).toFixed(2)} MB`);
        console.timeEnd('Total execution time');
    }
}

main();
