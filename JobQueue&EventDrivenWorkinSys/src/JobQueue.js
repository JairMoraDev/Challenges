import { EventEmitter } from 'node:events';
import { setImmediate } from 'node:timers';
import { Job } from './Job.js';
import { JOB_STATUS, EVENTS } from './constants.js';

/**
 * In-memory Event-Driven Job Queue.
 * Manages concurrency, retries, and timeouts.
 */
export class JobQueue extends EventEmitter {
  /**
   * @param {number} concurrency - Maximum number of concurrent jobs.
   */
  constructor(concurrency = 1) {
    super();
    this.concurrency = concurrency;
    this.queue = [];
    this.processing = 0;
  }

  /**
   * Adds a new job to the queue.
   * @param {Function} taskFn - The async function to execute.
   * @param {any} data - Input data for the task.
   * @param {Object} options - Job options (retries, timeout).
   * @returns {Job} The created job instance.
   */
  add(taskFn, data, options) {
    const job = new Job(taskFn, data, options);
    this.queue.push(job);
    this.emit(EVENTS.JOB_QUEUED, job);
    
    // Trigger processing asynchronously
    this._process();
    
    return job;
  }

  /**
   * Internal method to schedule the next job execution.
   * Uses setImmediate to yield control to the Event Loop.
   * @private
   */
  _process() {
    // If we have capacity and jobs waiting
    if (this.processing < this.concurrency && this.queue.length > 0) {
      setImmediate(() => this._runNext());
    }
    
    if (this.queue.length === 0 && this.processing === 0) {
        this.emit(EVENTS.QUEUE_DRAIN);
    }
  }

  /**
   * Pulls the next job and executes it.
   * @private
   */
  async _runNext() {
    // Double check constraints inside the async tick
    if (this.processing >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    this.processing++;
    
    job.status = JOB_STATUS.RUNNING;
    job.attempts++;
    this.emit(EVENTS.JOB_STARTED, job);

    // Proxy job progress events to queue
    const progressHandler = (progress) => {
        this.emit(EVENTS.JOB_PROGRESS, job, progress);
    };
    job.on('progress', progressHandler);

    const controller = new AbortController();
    const { signal } = controller;
    let timeoutId = null;

    // Handle Timeout
    if (job.options.timeout > 0) {
      timeoutId = setTimeout(() => {
        controller.abort(new Error('JobTimeout'));
      }, job.options.timeout);
    }

    try {
        // Execute Task
        // Pass 'job' instance so task can emit 'progress' or access data
        await job.taskFn(job, signal);

        // Success Handling
        if (timeoutId) clearTimeout(timeoutId);

        if (signal.aborted) {
            throw signal.reason || new Error('Aborted');
        }
        
        job.status = JOB_STATUS.COMPLETED;
        this.emit(EVENTS.JOB_COMPLETED, job);

    } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);

        // Check if error is due to our timeout or user cancellation
        const isTimeout = signal.aborted && signal.reason?.message === 'JobTimeout';
        const isAborted = signal.aborted && !isTimeout;

        if (isTimeout) {
            job.status = JOB_STATUS.CANCELLED; 
            this.emit(EVENTS.JOB_TIMEOUT, job);
        } else if (isAborted) {
            job.status = JOB_STATUS.ABORTED;
            this.emit(EVENTS.JOB_ABORTED, job);
        } else {
            // Standard Failure
            this.emit(EVENTS.JOB_FAILED, job, error);
        }

        const canRetry = job.options.retries > 0 && job.attempts <= job.options.retries;
        
        if (!isAborted && canRetry && !isTimeout) {
            job.status = JOB_STATUS.RETRYING;
            this.emit(EVENTS.JOB_RETRY, job);
            this.queue.push(job); 
        } else if (!isAborted && !isTimeout) {
             job.status = JOB_STATUS.FAILED;
        }

    } finally {
      job.off('progress', progressHandler); // Cleanup listener
      this.processing--;
      // Recursive step via process
      this._process();
    }
  }
}