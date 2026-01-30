# In-Memory Event-Driven Job Queue System

An internal, dependency-free implementation of a robust Job Queue in Node.js, designed to demonstrate high-performance asynchronous patterns, event-driven architecture, and adherence to SOLID principles.

## 🚀 Overview

This system provides a mechanism to manage asynchronous background tasks with:
- **Concurrency Control:** Limit the number of tasks running in parallel.
- **Retries:** Automatically retry failed jobs.
- **Timeouts:** Gracefully cancel jobs that exceed their allocated time.
- **Event-Driven Lifecycle:** Monitor every stage of a job's life (queued, started, progress, completed, failed) via events.
- **Zero External Dependencies:** Built entirely using Node.js native modules (`node:events`, `node:crypto`, `node:timers`).

## 🛠️ Architecture

The solution uses a non-blocking architecture leveraging the Node.js Event Loop.
- **`JobQueue`**: The orchestrator extending `EventEmitter`. It manages the queue state and schedules processing ticks using `setImmediate` to avoid starvation.
- **`Job`**: Extends `EventEmitter`. Holds the task's state, data, configuration, and emits its own progress events.
- **`AbortController`**: Used to handle timeouts and manual cancellations, propagating cancellation signals down to the user's task function.

## 📦 Installation

This project uses [pnpm](https://pnpm.io/).

1. **Navigate to the directory:**
   ```bash
   cd JobQueue&EventDrivenWorkinSys
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```
   *(Note: This project has 0 production dependencies. `pnpm install` is only needed if there are dev tools configured, but the core logic runs natively).*

## 🏃 Usage

### Running the Simulation
A simulation script (`src/index.js`) is provided to demonstrate the queue's capabilities (success, timeout, retry scenarios).

```bash
node src/index.js
```

### Library API

```javascript
import { JobQueue } from './src/JobQueue.js';
import { EVENTS } from './src/constants.js';

// 1. Initialize Queue with concurrency limit (e.g., 2 parallel jobs)
const queue = new JobQueue(2);

// 2. Listen to Events
// Event signature: (job, extraData)
queue.on(EVENTS.JOB_COMPLETED, (job) => {
  console.log(`Job ${job.id} finished!`);
});

queue.on(EVENTS.JOB_FAILED, (job, error) => {
  console.error(`Job ${job.id} failed: ${error.message}`);
});

queue.on(EVENTS.JOB_PROGRESS, (job, progress) => {
    console.log(`Job ${job.id} progress: ${progress}%`);
});

// 3. Define a Task
// Must accept: job (EventEmitter) and AbortSignal
const myTask = async (job, signal) => {
  if (signal.aborted) return;
  
  console.log('Processing:', job.data);
  job.emit('progress', 50); // Report progress directly on the job instance
  
  // Simulate work
  await new Promise(resolve => setTimeout(resolve, 100));
};

// 4. Add to Queue
queue.add(
  myTask, 
  { userId: 123 }, // Data
  { retries: 3, timeout: 5000 } // Options
);
```

## 📂 Project Structure

```text
/src
├── constants.js    # Shared constants (Status enums, Event names)
├── Job.js          # Job entity definition (extends EventEmitter)
├── JobQueue.js     # Core engine (Queue logic, Event emission)
└── index.js        # Usage simulation / Entry point
```

## ✅ Features Implemented

- [x] **Event-Driven:** Queue and Jobs extend `EventEmitter`.
- [x] **Concurrency:** Limits parallel execution.
- [x] **Retries:** Configurable retry attempts on failure.
- [x] **Timeouts:** Jobs are aborted if they exceed `timeout` ms.
- [x] **Progress Tracking:** Jobs report progress via events.
- [x] **Graceful Shutdown:** Uses `AbortSignal` for deep cancellation.
