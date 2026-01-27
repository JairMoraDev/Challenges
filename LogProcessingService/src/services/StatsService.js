/**
 * A service that listens to log events and aggregates statistics.
 */
class StatsService {
    #stats = {
        total: 0,
        levels: {
            info: 0,
            warn: 0,
            error: 0,
            debug: 0,
        },
    };

    /**
     * @param {import('events').EventEmitter} eventEmitter - An EventEmitter instance to listen for log events.
     */
    constructor(eventEmitter) {
        this._eventEmitter = eventEmitter;
    }

    /**
     * Attaches listeners to the event emitter for log events.
     */
    listen() {
        this._eventEmitter.on('log', (log) => {
            this.#stats.total++;
            const level = log.level.toLowerCase();
            if (this.#stats.levels[level] !== undefined) {
                this.#stats.levels[level]++;
            }
        });
    }

    /**
     * Prints the aggregated statistics to the console.
     */
    printStats() {
        console.log('--- Log Processing Stats ---');
        console.log(`Total logs processed: ${this.#stats.total}`);
        console.log('Logs by level:');
        for (const level in this.#stats.levels) {
            console.log(`  - ${level.toUpperCase()}: ${this.#stats.levels[level]}`);
        }
        console.log('--------------------------');
    }
}

export default StatsService;
