# Reto: Job Queue & Event-Driven Worker System
## Objetivo general
Diseñar un sistema de procesamiento de jobs (tipo mini-Bull / RabbitMQ in-memory) usando EventEmitter como núcleo, sin librerías externas.

## Contexto del problema
El sistema recibe jobs (tareas) que pueden ser:
- CPU-bound
- I/O-bound
- Fallar
- Reintentarse
- El sistema debe **emitir eventos de ciclo de vida** y permitir **suscriptores externos** (logging, métricas, alertas).

## Arquitectura base
Componentes esperados
- `JobQueue`
- `Worker`
- `Job`
- `Scheduler` (opcional pero recomendado)

Todo se comunica **por eventos**, no por llamadas directas.

## Requisitos técnicos

### 1. JobQueue (EventEmitter core)
La cola debe:
- Extender `EventEmitterMantener`
- Mantener estado interno:
```txt
pending | running | completed | failed | retrying
```
Eventos mínimos:

```txt
job:queued
job:started
job:progress
job:completed
job:failed
job:retry
queue:drain
```

Ejemplo:

```js
queue.on('job:failed', (job, err) => {
  // retry, log, alertas
}); 
```

Evalúa:

- Diseño limpio 
- Eventos semánticos
- Bajo acoplamiento

### 2. Workers (control del event loop)

Cada worker:
- Procesa **1 job a la vez**
- Debe: No bloquear el event loop
Usar `setImmediate` para liberar el loop
- Reportar progreso vía eventos

```js
job.emit('progress', 50); 
```
#### Pregunta clave:
¿Por qué no ejecutar el job directamente en el listener?

### 3. Jobs asincrónicos (punto crítico)
Un job puede ser:

```js
async function jobFn(signal) {
  // signal = AbortSignal
}
```
## Requisitos:
- Soportar `AbortController` 
- Timeout configurable
- Cancelación en caliente

Eventos:
```txt
job:timeout
job:aborted
```