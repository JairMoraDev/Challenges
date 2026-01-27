import fs from 'node:fs';
import path from 'node:path';

// --- Configuration ---
const LOG_LEVELS = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
const LOREM_IPSUM = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
];
const DEFAULT_FILE_NAME = 'app.log';

/**
 * Returns a random log level from the LOG_LEVELS array.
 * @returns {string} A random log level.
 */
function getRandomLogLevel() {
    return LOG_LEVELS[Math.floor(Math.random() * LOG_LEVELS.length)];
}

/**
 * Returns a random message from the LOREM_IPSUM array.
 * @returns {string} A random log message.
 */
function getRandomMessage() {
    return LOREM_IPSUM[Math.floor(Math.random() * LOREM_IPSUM.length)];
}

/**
 * Creates a single log line string.
 * @returns {string} A formatted log line with a newline character.
 */
function createLogLine() {
    const timestamp = new Date().toISOString();
    const level = getRandomLogLevel();
    const message = getRandomMessage();
    return `${timestamp}|${level}|${message}\n`;
}

/**
 * Generates a log file of a specified size.
 * This function uses a writable stream and properly handles backpressure to avoid
 * memory issues when generating very large files.
 *
 * @param {string} filePath - The full path of the file to be created.
 * @param {number} sizeInGB - The target size of the file in gigabytes.
 */
function generateLogFile(filePath, sizeInGB) {
    const targetSizeInBytes = sizeInGB * 1024 * 1024 * 1024;
    const writer = fs.createWriteStream(filePath);
    let writtenBytes = 0;

    console.log(`Starting generation of ~${sizeInGB}GB log file at: ${filePath}`);
    console.time('generationTime');

    const writeChunk = () => {
        let canWrite = true;
        while (writtenBytes < targetSizeInBytes && canWrite) {
            const logLine = createLogLine();
            const buffer = Buffer.from(logLine, 'utf-8');
            writtenBytes += buffer.length;
            
            // The `write` method returns false if the internal buffer is full.
            // This is the signal to stop writing and wait for the 'drain' event.
            canWrite = writer.write(buffer);
        }

        if (writtenBytes < targetSizeInBytes) {
            // If we stopped writing, it's because the buffer is full.
            // We must wait for it to drain before continuing.
            writer.once('drain', writeChunk);
        } else {
            // We've written the target amount. Close the stream.
            writer.end(() => {
                console.log('Log file generation successfully completed.');
                console.log(`Final file size: ${(writtenBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`);
                console.timeEnd('generationTime');
            });
        }
    };

    writeChunk(); // Start the writing process
}


// --- Main Execution ---
(function main() {
    const args = process.argv.slice(2);
    // Find the first argument that is a valid number
    const sizeArg = args.find(arg => !isNaN(parseFloat(arg)));
    const sizeInGB = parseFloat(sizeArg);

    if (isNaN(sizeInGB) || sizeInGB <= 0) {
        console.error('Error: Invalid size provided.');
        console.error('Usage: node src/utils/generate-logs.js <size_in_gb> or pnpm run generate:logs -- <size_in_gb>');
        console.error('Example: node src/utils/generate-logs.js 1.5');
        process.exit(1);
    }

    // Create a 'data' directory in the project root if it doesn't exist.
    // This is a good practice to separate generated data from source code.
    const outputDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`Created directory: ${outputDir}`);
    }

    const logFilePath = path.join(outputDir, DEFAULT_FILE_NAME);

    generateLogFile(logFilePath, sizeInGB);
})();