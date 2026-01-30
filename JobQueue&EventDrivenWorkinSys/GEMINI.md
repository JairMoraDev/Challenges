# SYSTEM INSTRUCTIONS & ROLE DEFINITION

## Role
You are an **Expert Node.js Backend Engineer** specialized in high-performance, asynchronous systems. You possess deep knowledge of the Node.js runtime internals, specifically the **Event Loop** phases (Timers, Poll, Check), memory management, and streams.

## Technical Criteria & Mindset
When solving the challenge below, you must adhere to the following standards:

1.  **Architecture:** Strictly follow **SOLID principles**. Ensure classes have single responsibilities and high cohesion.
2.  **Asynchrony:**
    - Never block the Event Loop.
    - Use `setImmediate` strategically to yield control during heavy recursive or iterative processes.
    - Prefer `async/await` over raw callbacks (except when interfacing with strict callback APIs).
3.  **Code Quality:**
    - Use **ES Modules** (`import`/`export`) exclusively.
    - Code must be **Production-Ready**: include JSDoc for methods, proper error handling (never swallow errors), and defensive programming checks.
    - Variable naming must be semantic and descriptive.
4.  **Constraints:**
    - **No external libraries** allowed (e.g., no `bull`, no `lodash`, no `uuid` external pkg). Use `node:crypto`, `node:events`, `node:util` only.
    - Assume a **MacOs/Unix** environment.
    - Use **pnpm** as the package manager in your instructions.

---

# TECHNICAL SPECIFICATION: Event-Driven Job Queue System (In-Memory)

## 1. Project Overview & Objective
The goal is to architect and implement a robust, in-memory **Job Queue System** using Node.js native capabilities (specifically `EventEmitter`). The system must manage asynchronous tasks with concurrency control, retry mechanisms, and graceful cancellation, mimicking the behavior of production libraries like BullMQ but without external dependencies.

**Core Philosophy:**
- **Non-blocking:** Heavy use of the Event Loop phases (`setImmediate`).
- **Event-Driven:** All state changes are broadcast via events. `Job` and `JobQueue` are EventEmitters.
- **Robustness:** Graceful handling of timeouts and task cancellations using `AbortController`.

## 2. Tech Stack & Environment
- **Runtime:** Node.js (v18+ recommended).
- **Module System:** ES Modules (`import` / `export`) is mandatory.
- **Package Manager:** pnpm.
- **External Libraries:** **STRICTLY PROHIBITED**. Use only Node.js built-ins (`events`, `crypto`, `timers`).

## 3. Project Structure
The solution must follow this exact directory structure:

```text
/JobQueue&EventDrivenWorkinSys
├── package.json        # "type": "module"
├── pnpm-lock.yaml
├── src
│   ├── constants.js    # Job statuses and Event names
│   ├── Job.js          # Job entity class (extends EventEmitter)
│   ├── JobQueue.js     # Main queue logic (extends EventEmitter)
│   └── index.js        # Entry point / Consumer simulation
└── README.md
```

## 4. Technical Requirements

### 4.1. Shared Constants (`src/constants.js`)
Define and export standard constants to avoid magic strings.
- **JOB_STATUS**: `pending`, `running`, `completed`, `failed`, `retrying`, `cancelled`, `aborted`.
- **EVENTS**: `job:queued`, `job:started`, `job:progress`, `job:completed`, `job:failed`, `job:retry`, `queue:drain`, `job:timeout`, `job:aborted`.

### 4.2. The Job Entity (`src/Job.js`)
A class representing a unit of work. **Must extend `node:events/EventEmitter`**.
- **Properties:**
  - `id`: UUID (use `crypto.randomUUID()`).
  - `data`: The payload for the task.
  - `taskFn`: The async function to execute.
  - `options`: `{ retries: number, timeout: number }`.
  - `status`: Current status (from `JOB_STATUS`).
  - `attempts`: Counter for execution tries.
- **Responsibilities:**
  - Store metadata.
  - Emit internal events (like `'progress'`).
  - It does **not** execute itself; it is managed by the Queue.

### 4.3. The Engine: JobQueue (`src/JobQueue.js`)
This is the core component. It **must extend** `node:events/EventEmitter`.

**State Management:**
- `queue`: Array (FIFO) of pending `Job` instances.
- `processing`: Counter of currently running jobs.
- `concurrency`: Max number of parallel jobs allowed (passed in constructor).

**Key Methods:**
1.  **`constructor(concurrency = 1)`**: Initialize state.
2.  **`add(taskFn, data, options)`**:
    - Creates a `Job`.
    - Pushes to internal queue.
    - Emits `EVENTS.JOB_QUEUED`.
    - Triggers the processor.
3.  **`_process()` (Private/Internal)**:
    - **CRITICAL:** This method must use `setImmediate(() => this._runNext())` to schedule execution. This prevents stack overflow and ensures I/O starvation does not occur during high-load enqueueing.
    - Checks concurrency limits (`processing < concurrency`).
    - Checks if queue is empty.
4.  **`_runNext()` (Private/Internal)**:
    - Pulls the next job.
    - Increments `processing` count.
    - Wraps execution in an `AbortController` context for timeouts.
    - Handles:
        - **Success:** Emits `job:completed` with `(job)`.
        - **Error/Abort:** Checks retry logic. If retries remain and not aborted manually, re-queue and emit `job:retry`. If exhausted or aborted, emit `job:failed` or `job:aborted`.
        - **Progress:** Listens to `job.on('progress')` and relays it to queue-level `job:progress`.
        - **Cleanup:** Decrements `processing` count and triggers `_process()` again (recursive step).

### 4.4. Task Execution Contract
The `taskFn` provided by the user must follow this signature:

```javascript
/**
 * @param {Job} job - The job instance (EventEmitter)
 * @param {AbortSignal} signal - To listen for cancellation/timeout
 */
async function myTask(job, signal) {
  // Implementation
  // job.emit('progress', 50);
}
```

- The Queue must instantiate an `AbortController`.
- If the job exceeds `options.timeout`, the Queue calls `controller.abort()`.
- The `taskFn` must respect `signal.aborted` or `signal.addEventListener('abort')` to stop work immediately.

## 5. Acceptance Criteria (The `src/index.js` Scenario)
Create a simulation in `src/index.js` that proves the architecture works. The file must import the Queue and simulate the following:

1.  Initialize `JobQueue` with `concurrency: 2`.
2.  **Job A (Heavy):** Takes 500ms, reports progress (25%, 50%...). Succeeded.
3.  **Job B (Timeout):** Tries to run for 2000ms but has a timeout of 1000ms. Must be cancelled correctly.
4.  **Job C (Flaky):** Fails initially, succeeds on retry.
5.  **Logging:** Attach console logs to all `JobQueue` events to visualize the flow using the signature `(job, extra)`.

## 6. Deliverables
Provide the complete code for all files listed in the Project Structure. Ensure the code is copy-paste ready and successfully runs with `node src/index.js`.
