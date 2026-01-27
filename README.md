# Node.js Advanced Challenges

This repository is dedicated to solving advanced Node.js challenges, focusing on performance, scalability, and the in-depth use of the platform's native APIs.

## Projects and Challenges

### 📂 [LogProcessingService](./LogProcessingService/)
A high-performance log processing service capable of efficiently handling massive files (1GB - 5GB).

* **Description:** Implementation of a processing pipeline using **Stream Processing** and **Event-Driven Architecture**.
* **Key Features:** * Built using pure Node.js (no external dependencies).
    * Manual memory management with constant Heap usage (<100MB).
    * Non-blocking processing to keep the Event Loop free.
    * Implementation of custom streams (`LineSplitter`, `LogParser`).

---