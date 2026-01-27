# 📂 Contexto del Proyecto: Log Processing Service (Native Node.js Challenge)

## 1. Descripción del Reto
**Objetivo:** Construir un servicio de procesamiento de logs de alto rendimiento capaz de manejar archivos masivos (1GB - 5GB) usando **Stream Processing** y **Event-Driven Architecture**.
**Filosofía:** "Node.js Pure". Sin librerías externas. Gestión manual de memoria y flujo de datos.

## 2. Restricciones Técnicas (ESTRICTO)
* **Runtime:** Node.js v22.20.0 (definido en `.nvmrc`).
* **Package Manager:** `pnpm` (definido en `package.json`).
* **Dependencias:** CERO (`package.json` sin `dependencies` runtime). Solo módulos nativos: `node:fs`, `node:stream`, `node:events`, `node:util`, `node:string_decoder`.
* **Memoria:** Uso de Heap constante (<100MB) independientemente del tamaño del archivo.
* **Non-Blocking:** Prohibido bloquear el Event Loop. La CPU debe estar disponible para otras tareas mientras se procesa el archivo.

## 3. Tech Stack & APIs
* **Streams:** `Readable` (Source), `Transform` (Parsing), `Writable` (Drain).
* **Pipeline:** Uso de `stream.pipeline` para manejo automático de errores y limpieza de recursos.
* **Decoding:** Uso de `StringDecoder` para manejo seguro de caracteres multibyte en chunks binarios.

## 4. Definición de Datos
Formato: `TIMESTAMP|LEVEL|MESSAGE`
Ejemplo: `2024-11-01T10:23:45Z|INFO|User uploaded file`

## 5. Arquitectura del Pipeline
El flujo de datos debe seguir estrictamente este orden:

`File Source` -> `LineSplitter (Transform)` -> `LogParser (Transform)` -> `NullDrain (Writable)`

1.  **File Source:** `fs.createReadStream` con `highWaterMark` ajustado (ej. 64KB).
2.  **LineSplitter:**
    * Recibe chunks binarios (Buffers).
    * Usa `StringDecoder` para decodificar texto seguramente.
    * Acumula fragmentos y emite líneas completas downstream.
3.  **LogParser:**
    * Recibe strings (líneas).
    * Parsea el contenido (`String.split('|')`).
    * **Side Effect:** Emite eventos de negocio (`log:info`, `log:error`) vía una instancia inyectada de `EventEmitter`.
    * Pasa los datos al siguiente stream (o los descarta).
4.  **StatsService:**
    * Clase que escucha los eventos del `LogParser`.
    * Mantiene contadores en memoria.
    * *Nota:* No es parte del pipeline de streams, es un observador.
5.  **NullDrain:**
    * Un `Writable` stream mudo que simplemente acepta datos y llama al callback. Necesario para mantener el flujo del pipeline activo (pulling data).

## 6. Instrucciones Específicas para Gemini
1.  **Manejo de "Last Line":** En el `LineSplitter`, asegúrate de procesar el buffer remanente cuando se llame al método `_flush`.
2.  **Backpressure:** Explica cómo el uso de `callback()` en los streams `_transform` gestiona la contrapresión nativamente.
3.  **Generador de Datos:** Antes de implementar la solución, crea un script `utils/generate-logs.js` que genere un archivo dummy de un tamaño configurable (ej. 1GB) para poder probar el rendimiento.
4.  **Performance:** Mide el tiempo de ejecución con `performance.now()` y `process.memoryUsage()` al finalizar.

## 7. Estructura de Archivos
```text
/
├── src/
│   ├── streams/
│   │   ├── LineSplitter.js   # Transform: Buffer -> Lines
│   │   ├── LogParser.js      # Transform: Line -> Event Emission
│   │   └── NullWritable.js   # Writable: Final del tubo
│   ├── services/
│   │   └── StatsService.js   # Logica de agregación (Observer)
│   ├── utils/
│   │   └── generate-logs.js  # Script para crear archivos de 1GB+
│   └── index.js              # Composition Root & Pipeline execution
├── .nvmrc
├── pnpm-lock.yaml
└── package.json
```

## 8. Comandos de Ejecución

Para interactuar con el proyecto, utiliza los siguientes scripts definidos en `package.json`:

*   **Generar Logs de Prueba:**
    ```bash
    pnpm run generate:logs -- 0.1
    ```
    Este comando ejecuta `src/utils/generate-logs.js` para crear un archivo `app.log` de 0.1 Gb en tamaño en el directorio `data/`, necesario para simular las condiciones de producción y probar el rendimiento del pipeline.

*   **Iniciar el Servicio de Procesamiento:**
    ```bash
    pnpm run start
    ```
    Este comando inicia el servicio principal ejecutando `src/index.js`, que lee el archivo `data/app.log` y lo procesa a través del pipeline de streams. Al finalizar, mostrará estadísticas como el total de logs procesados por nivel y el tiempo total de ejecución.

## 9. Personalidad
Actúa como un Ingeniero de software experto en I/O. Valoras la eficiencia sobre la sintaxis corta. Prefieres for loops sobre forEach en rutas críticas (hot paths).