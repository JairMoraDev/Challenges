import { jest } from '@jest/globals';
import { JobQueue } from '../src/JobQueue.js';
import { EVENTS, JOB_STATUS } from '../src/constants.js';

describe('JobQueue', () => {
    let queue;

    beforeEach(() => {
        queue = new JobQueue(2); // Concurrency of 2
    });

    test('should add a job to the queue', () => {
        const taskFn = jest.fn();
        const job = queue.add(taskFn, { some: 'data' });

        expect(queue.queue).toHaveLength(1);
        expect(job.status).toBe(JOB_STATUS.PENDING);
    });

    test('should emit JOB_QUEUED event when adding a job', (done) => {
        const taskFn = jest.fn();

        queue.on(EVENTS.JOB_QUEUED, (job) => {
            expect(job).toBeDefined();
            expect(job.data).toEqual({ val: 1 });
            done();
        });

        queue.add(taskFn, { val: 1 });
    });

    test('should process jobs respecting concurrency', (done) => {
        const job1Fn = jest.fn().mockResolvedValue('result1');
        const job2Fn = jest.fn().mockResolvedValue('result2');
        const job3Fn = jest.fn().mockResolvedValue('result3');

        // We use a small delay to simulate async work and ensure concurrency is respected
        // Note: In a real test we might want to use fake timers, but for simplicity we rely on event loop here
        // or just check that they start.

        queue = new JobQueue(1); // Concurrency 1 to force sequential execution

        const job1 = queue.add(job1Fn, {});
        const job2 = queue.add(job2Fn, {});

        let completedCount = 0;

        queue.on(EVENTS.JOB_COMPLETED, (job) => {
            completedCount++;
            if (completedCount === 1) {
                expect(job.id).toBe(job1.id);
                expect(job1Fn).toHaveBeenCalled();
                expect(job2Fn).not.toHaveBeenCalled();
            } else if (completedCount === 2) {
                expect(job.id).toBe(job2.id);
                expect(job2Fn).toHaveBeenCalled();
                done();
            }
        });
    });

    test('should handle job failure and emit JOB_FAILED', (done) => {
        const error = new Error('Task failed');
        const taskFn = jest.fn().mockRejectedValue(error);

        queue.add(taskFn, {});

        queue.on(EVENTS.JOB_FAILED, (job, err) => {
            expect(err).toBe(error);
            // Status is updated after the event emission in the current implementation
            // so we check it in the next tick
            setImmediate(() => {
                expect(job.status).toBe(JOB_STATUS.FAILED);
                done();
            });
        });
    });

    test('should retry failed jobs if retries > 0', (done) => {
        const taskFn = jest.fn()
            .mockRejectedValueOnce(new Error('Fail 1'))
            .mockResolvedValueOnce('Success');

        const job = queue.add(taskFn, {}, { retries: 1 });

        let failureCount = 0;
        let retryCount = 0;

        queue.on(EVENTS.JOB_FAILED, () => failureCount++); // Should not be emitted ultimately if retry succeeds?
        // Based on implementation:
        // this.emit(EVENTS.JOB_FAILED, job, error);
        // ...
        // if (canRetry) { ... this.emit(EVENTS.JOB_RETRY, job); ... } else { job.status = FAILED }
        // So JOB_FAILED is emitted even if it retries.

        queue.on(EVENTS.JOB_RETRY, (j) => {
            expect(j.id).toBe(job.id);
            retryCount++;
        });

        queue.on(EVENTS.JOB_COMPLETED, (j) => {
            expect(j.id).toBe(job.id);
            expect(taskFn).toHaveBeenCalledTimes(2);
            expect(retryCount).toBe(1);
            done();
        });
    });

    test('should handle timeouts', (done) => {
        const taskFn = jest.fn().mockImplementation((job, signal) => {
            return new Promise((resolve, reject) => {
                const id = setTimeout(resolve, 100);
                signal.addEventListener('abort', () => {
                    clearTimeout(id);
                    reject(signal.reason); // Reject when aborted so await returns
                });
            });
        });

        queue.add(taskFn, {}, { timeout: 10 });

        queue.on(EVENTS.JOB_TIMEOUT, (job) => {
            expect(job.status).toBe(JOB_STATUS.CANCELLED);
            done();
        });
    });

    test('should emit QUEUE_DRAIN when all jobs are processed', (done) => {
        queue.add(jest.fn().mockResolvedValue(1), {});
        queue.add(jest.fn().mockResolvedValue(2), {});

        let completed = 0;
        queue.on(EVENTS.JOB_COMPLETED, () => completed++);

        queue.on(EVENTS.QUEUE_DRAIN, () => {
            expect(completed).toBe(2);
            expect(queue.queue.length).toBe(0);
            expect(queue.processing).toBe(0);
            done();
        });
    });
});
