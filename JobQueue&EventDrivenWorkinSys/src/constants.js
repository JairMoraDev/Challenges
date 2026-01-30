/**
 * Job execution status.
 * @readonly
 * @enum {string}
 */
export const JOB_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  RETRYING: 'retrying',
  CANCELLED: 'cancelled',
  ABORTED: 'aborted'
};

/**
 * Event names emitted by the JobQueue.
 * @readonly
 * @enum {string}
 */
export const EVENTS = {
  JOB_QUEUED: 'job:queued',
  JOB_STARTED: 'job:started',
  JOB_PROGRESS: 'job:progress',
  JOB_COMPLETED: 'job:completed',
  JOB_FAILED: 'job:failed',
  JOB_RETRY: 'job:retry',
  QUEUE_DRAIN: 'queue:drain',
  JOB_TIMEOUT: 'job:timeout',
  JOB_ABORTED: 'job:aborted'
};