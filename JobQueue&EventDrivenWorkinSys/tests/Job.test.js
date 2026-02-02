import { jest } from '@jest/globals';
import { Job } from '../src/Job.js';
import { JOB_STATUS } from '../src/constants.js';

describe('Job', () => {
    const mockTask = jest.fn();
    const data = { foo: 'bar' };

    test('should initialize with correct default values', () => {
        const job = new Job(mockTask, data);

        expect(job.id).toBeDefined();
        expect(job.taskFn).toBe(mockTask);
        expect(job.data).toBe(data);
        expect(job.status).toBe(JOB_STATUS.PENDING);
        expect(job.attempts).toBe(0);
        expect(job.options).toEqual({
            retries: 0,
            timeout: 0
        });
    });

    test('should accept custom options', () => {
        const options = { retries: 3, timeout: 5000 };
        const job = new Job(mockTask, data, options);

        expect(job.options).toEqual({
            retries: 3,
            timeout: 5000
        });
    });

    test('should override default options with provided ones', () => {
        const options = { retries: 5 };
        const job = new Job(mockTask, data, options);

        expect(job.options).toEqual({
            retries: 5,
            timeout: 0
        });
    });
});
