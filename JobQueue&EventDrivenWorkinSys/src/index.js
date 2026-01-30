import { JobQueue } from './JobQueue.js';
import { EVENTS } from './constants.js';
import { setTimeout } from 'node:timers/promises';

// --- Simulation Setup ---

const queue = new JobQueue(2); // Concurrency: 2

// Logging System
Object.values(EVENTS).forEach(eventName => {
  queue.on(eventName, (job, extra) => {
    const time = new Date().toISOString().split('T')[1].slice(0, -1);
    const id = job?.id || 'queue';
    
    let msg = `[${time}] [${eventName}] Job:${id}`;
    if (extra !== undefined) {
        if (extra instanceof Error) {
            msg += ` Error: ${extra.message}`;
        } else {
            msg += ` Data: ${JSON.stringify(extra)}`;
        }
    }
    console.log(msg);
  });
});

console.log('--- STARTING SIMULATION ---');

// --- Job Definitions ---

// Job A: Heavy Task (500ms), Reports Progress
const jobATask = async (job, signal) => {
  if (signal.aborted) return;
  
  await setTimeout(100);
  job.emit('progress', 25);
  
  await setTimeout(100);
  job.emit('progress', 50);
  
  await setTimeout(300); // Remaining time
  job.emit('progress', 100);
  
  return 'Job A Done';
};

// Job B: Timeout Task (Duration 2000ms > Timeout 1000ms)
const jobBTask = async (job, signal) => {
  console.log('   -> [Job B] Started. Will run for 2s (Timeout set to 1s)');
  try {
      // Simulate long work in chunks to allow abort check
      for (let i = 0; i < 20; i++) {
        // 1. Validation: Check signal manually inside loops
        if (signal.aborted) {
            console.log(`   -> [Job B] ⚠️ Detected signal.aborted at step ${i}!`);
            throw signal.reason || new Error('Aborted by signal');
        }
        await setTimeout(100); 
      }
  } catch (err) {
      // 2. Validation: Handle cleanup
      if (signal.aborted) {
          console.log(`   -> [Job B] 🛑 CLEANUP: Received signal reason: "${signal.reason?.message}". Stopping work.`);
          return; 
      }
      throw err;
  }
};

// Job C: Flaky Task (Fails 1st time, Succeeds 2nd)
let jobCFailures = 0;
const jobCTask = async (job, signal) => {
  if (jobCFailures < 1) {
    jobCFailures++;
    throw new Error('Random System Failure');
  }
  await setTimeout(200);
  return 'Job C Recovered';
};

// --- Execution ---

// 1. Add Job A
queue.add(jobATask, { name: 'Job A (Standard)' }, {});

// 2. Add Job B (Timeout)
queue.add(jobBTask, { name: 'Job B (Timeout)' }, { timeout: 1000 });

// 3. Add Job C (Retry)
queue.add(jobCTask, { name: 'Job C (Flaky)' }, { retries: 3 });