# Node.js Advanced Challenges

Este repositorio está dedicado a la resolución de retos avanzados de Node.js, enfocados en el rendimiento, la escalabilidad y el uso profundo de las APIs nativas de la plataforma.

## Proyectos y Retos

### 📂 [LogProcessingService](./LogProcessingService/)
Un servicio de procesamiento de logs de alto rendimiento capaz de manejar archivos masivos (1GB - 5GB) de forma eficiente.

*   **Descripción:** Implementación de un pipeline de procesamiento utilizando **Stream Processing** y **Event-Driven Architecture**.
*   **Características Clave:** 
    *   Uso de Node.js puro (sin dependencias externas).
    *   Gestión manual de memoria con un uso de Heap constante (<100MB).
    *   Procesamiento no bloqueante para mantener el Event Loop libre.
    *   Implementación de streams personalizados (`LineSplitter`, `LogParser`).

---
