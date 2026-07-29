# 06 · Métricas DORA, diagrama de Pareto y densidad de defectos

`[IA]` Elaborado con asistencia de IA sobre datos reales de la API de GitHub (releases, pull requests) y la API pública de SonarCloud (`GuzGuz0208_axios`), extraídos 2026-07-28. Punto de control humano: revisar la metodología de cada proxy (declarada explícitamente porque ninguna métrica DORA es observable directamente desde datos públicos) antes de citar las cifras en el dictamen.

## 1. Métricas DORA (estimadas desde actividad pública del repositorio)

Ninguna de las 4 métricas DORA es medible directamente sin acceso a los sistemas internos de despliegue de axios (no expuestos públicamente). Se documentan proxies explícitos basados en releases y PRs reales.

### 1.1 Frecuencia de despliegue

- Dato real: 30 releases públicos entre 2025-04-24 (`v1.9.0`) y 2026-07-26 (`v1.19.0`) = 458 días, de los cuales 22 son de la línea `1.x` y 8 de la línea `0.x` (mantenimiento paralelo).
- Cálculo: 30 releases / 458 días ≈ **1 release cada 15.3 días ≈ 2.0 releases/mes**.
- **Banda DORA: Alto desempeño** (entre "una vez por semana" y "una vez al mes", según los umbrales estándar de la comunidad DORA).

### 1.2 Lead time para cambios

- Metodología: se tomó una muestra de 14 PRs recientes de tipo `fix`/`feat`/`refactor`/`chore(release)` (excluyendo PRs de bots de dependencias, que no representan trabajo de ingeniería) y se calculó `closed_at - created_at`.
- Muestra real (horas): 1.0, 7.25, 8.2, 11.6, 12.7, 16.1, 18.8, 24, 31.65, 168, 240, 240, 312, 312.
- **Mediana ≈ 21.4 horas (< 1 día).** Mínimo real: **1 hora** ([#10749 "fix: header security issues"](https://github.com/axios/axios/pull/10749), creado y mergeado el mismo día). Máximo real: 13 días (refactors/features no urgentes).
- **Banda DORA: límite Alto/Elite** — la mediana está bajo el umbral de 1 día de "Elite", pero la cola larga (refactors de hasta 13 días) impide clasificar el conjunto completo como Elite de forma consistente.

### 1.3 Tasa de fallos de cambios (Change Failure Rate)

- Metodología (proxy, sin acceso a datos de incidentes internos): se cuenta un release como "posible hotfix" cuando el siguiente release de la misma línea aparece en **≤ 7 días**, señal indirecta de una corrección urgente.
- Datos reales (línea `1.x`, 22 releases): `v1.12.1` (+1d), `v1.12.2` (+2d), `v1.13.1` (+1d), `v1.13.2` (+7d), `v1.13.4` (+7d), `v1.15.2` (+2d, **confirmado como parche de seguridad** — corrige `CVE-2026-42264` entre otros, ver `01-diagnostico-defectos.md`) = **6 de 22 releases (27.3%)**.
- **Banda DORA: Medio** (los benchmarks DORA sitúan "Elite" en 0–15%; 27.3% es una señal de que aproximadamente 1 de cada 4 releases requiere corrección rápida — coherente con el historial denso de CVEs de la familia "contaminación de prototipo").

### 1.4 Tiempo de restauración (MTTR) — dos medidas distintas y no comparables

axios expone dos tipos de "incidente" muy distintos en los datos reales, así que se reportan por separado en vez de forzarlos a una sola cifra:

**(a) MTTR de vulnerabilidad (proceso de divulgación coordinada):** de los 20 avisos de seguridad reales auditados, **19 de 20 ya tenían una versión corregida publicada semanas antes de la fecha de divulgación pública** (ejemplo: `GHSA-q8qp-cvcw-x6jj`/CVE-2026-42264 divulgado 2026-04-24, corregido en `v1.15.2` el 2026-04-21 — 3 días **antes**; el lote de 10 avisos divulgados el 2026-07-06 ya estaba corregido en `v1.18.0`/`v0.33.0` desde el 2026-06-13, 23 días antes). **MTTR efectivo para el usuario que actualiza a tiempo ≈ 0** — consistente con la política explícita de `SECURITY.md`: *"We try to release the fix before publishing the advisory so users can patch before vulnerability details are public."*

**(b) MTTR de incidente activo (compromiso de cadena de suministro, #10604):** ventana real de exposición = **2 horas 54 minutos** (00:21 a 03:15 UTC, 2026-03-31) desde la publicación de la versión maliciosa hasta su retiro del registro npm. Es una cifra rápida en términos de contención, pero el CoNQ (`01-diagnostico-defectos.md` §5) muestra que "rápido" en horas todavía significó ~2.3M instalaciones potencialmente expuestas, porque el volumen de descarga de axios es masivo (19.1M/día).

## 2. Diagrama de Pareto — distribución real de hallazgos SonarCloud por archivo

Datos completos: 467 hallazgos abiertos distribuidos en 94 archivos (consulta paginada completa a `api/issues/search`, 2026-07-28).

| Archivo | Hallazgos | % acumulado |
|---|---|---|
| `lib/adapters/http.js` | 37 | 7.9% |
| `index.d.cts` | 30 | 14.3% |
| `lib/adapters/fetch.js` | 24 | 19.5% |
| `lib/utils.js` | 22 | 24.2% |
| `lib/helpers/shouldBypassProxy.js` | 20 | 28.5% |
| `tests/module/esm/tests/helpers/esm-index.ts` | 18 | 32.3% |
| `tests/module/esm/tests/helpers/esm-added-types.ts` | 17 | 36.0% |
| `tests/module/cjs/tests/helpers/cjs-typing.ts` | 16 | 39.4% |
| `examples/server.js` | 14 | 42.4% |
| `tests/module/cjs/tests/helpers/cjs-added-types.ts` | 13 | 45.2% |
| `lib/core/AxiosHeaders.js` | 13 | 48.0% |
| `lib/helpers/estimateDataURLDecodedBytes.js` | 11 | 50.3% |
| *(83 archivos adicionales)* | 232 | 100.0% |

**Lectura de Pareto:** el 80% acumulado de hallazgos (373 de 467) se alcanza en 34 de los 94 archivos con hallazgos — es decir, **36.2% de los archivos concentran el 80% de los hallazgos**. No es un Pareto 80/20 estricto, pero sí hay concentración real: el **12.8% de los archivos concentra el 50%** de los hallazgos (12 archivos de 94). Los primeros 5 archivos de la tabla —todos código de producción (`lib/`), no tests ni ejemplos— concentran el **28.5%** del total con solo el 5.3% de los archivos afectados.

Ver gráfico Pareto sugerido para el informe final: eje izquierdo = hallazgos por archivo (barras, orden descendente), eje derecho = % acumulado (línea), línea de referencia horizontal en 80%.

## 3. Densidad de defectos por módulo (hallazgos / KLOC)

Densidad ≠ conteo absoluto — un archivo grande acumula más hallazgos en términos absolutos sin ser necesariamente el de peor calidad *por línea*. Se calculó `ncloc` real por archivo vía SonarCloud para separar ambas lecturas:

| Archivo | Hallazgos | NCLOC | Densidad (hallazgos/KLOC) | Lectura |
|---|---|---|---|---|
| `lib/helpers/estimateDataURLDecodedBytes.js` | 11 | 112 | **98.2** | Densidad más alta del proyecto — casi 1 hallazgo cada 10 líneas |
| `lib/helpers/shouldBypassProxy.js` | 20 | 208 | **96.2** | Confirma cuantitativamente el Hallazgo 1 de `03-deuda-tecnica.md`: no es percepción, es la 2ª densidad más alta del proyecto |
| `lib/adapters/fetch.js` | 24 | 498 | 48.2 | Por encima del promedio del proyecto |
| `lib/utils.js` | 22 | 515 | 42.7 | En línea con el promedio del proyecto |
| **Promedio del proyecto** | 467 | 10,877 | **42.9** | Línea base de referencia |
| `lib/core/AxiosHeaders.js` | 13 | 359 | 36.2 | Cercano al promedio |
| `lib/adapters/http.js` | 37 | 1,059 | 34.9 | **Por debajo** del promedio del proyecto pese a ser el mayor contribuyente absoluto |

**Hallazgo clave para el dictamen:** `lib/adapters/http.js` es el archivo con más hallazgos en términos absolutos (37, el mayor de todo el proyecto) precisamente *porque* es el archivo más grande (1,059 líneas) — su densidad real (34.9/KLOC) está por debajo del promedio del proyecto. El problema real de `http.js` no es volumen de hallazgos triviales, es **concentración de severidad** (complejidad cognitiva 145 en una sola función, ver `03-deuda-tecnica.md` Hallazgo 2) y ser el epicentro del CVE de mayor severidad (`CVE-2026-42264`). En cambio, `shouldBypassProxy.js` y `estimateDataURLDecodedBytes.js` sí tienen un problema de densidad genuino (>2× el promedio del proyecto) pese a ser archivos pequeños. Ambas lecturas — densidad y severidad concentrada — son necesarias y se complementan; usar solo una subestima el riesgo real del componente.
