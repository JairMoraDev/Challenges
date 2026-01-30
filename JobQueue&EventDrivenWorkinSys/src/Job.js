import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import { JOB_STATUS } from './constants.js';

/**
 * Represents a unit of work to be executed by the JobQueue.
 * Extends EventEmitter to allow reporting progress and internal events.
 */
export class Job extends EventEmitter {
  /**
   * @param {Function} taskFn - The async function to execute.
   * @param {any} data - The payload to be passed to the task function.
   * @param {Object} [options={}] - Configuration options for the job.
   * @param {number} [options.retries=0] - Number of retry attempts allowed on failure.
   * @param {number} [options.timeout=0] - Execution timeout in milliseconds (0 = no timeout).
   */
  constructor(taskFn, data, options = {}) {
    super();
    this.id = randomUUID();
    this.taskFn = taskFn;
    this.data = data;
    
    // Defensive copy of options with defaults
    this.options = {
      retries: 0,
      timeout: 0,
      ...options
    };

    this.status = JOB_STATUS.PENDING;
    this.attempts = 0;
  }
}