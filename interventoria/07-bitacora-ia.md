# 07 · Bitácora de uso de IA y rúbrica de evaluación de salidas

Registro obligatorio de toda interacción con IA en este proyecto (regla de gobernanza del curso: qué se pidió, qué devolvió, qué se verificó, qué se corrigió o rechazó). El curso referencia una "Tabla 4.4" propia para evaluar salidas de IA que el equipo no tiene disponible (confirmado con el equipo) — la sección 2 documenta explícitamente la rúbrica sustituta construida para este proyecto, dejando claro que es un supuesto razonable y no la tabla oficial del curso.

## 1. Rúbrica de evaluación de salidas de IA (sustituta de la Tabla 4.4, no disponible)

| Criterio | Descripción | Escala |
|---|---|---|
| Exactitud factual | ¿Los datos, enlaces y cifras citados son verificables en la fuente real? | Alta / Media / Baja |
| Completitud | ¿Cubre lo que se le pidió sin omisiones relevantes? | Completa / Parcial / Insuficiente |
| Trazabilidad | ¿Cada afirmación es rastreable a una fuente (issue, commit, métrica) citada explícitamente? | Sí / Parcial / No |
| Honestidad de incertidumbre | ¿Declara explícitamente supuestos, límites o datos no verificables en vez de inventarlos? | Sí / No |
| Accionabilidad | ¿La salida permite tomar una decisión concreta sin reprocesarla? | Alta / Media / Baja |

## 2. Registro cronológico de interacciones (Nivel 1 — analista junior)

| # | Fecha | Qué se pidió | Qué devolvió la IA | Qué se verificó | Qué se corrigió/rechazó | Rúbrica |
|---|---|---|---|---|---|---|
| 1 | 2026-07-28 | Diagnosticar por qué Actions mostraba 0 corridas pese a que SonarCloud ya tenía datos | Explicó que `run-ci.yml` solo dispara en `pull_request` y que SonarCloud probablemente usaba Automatic Analysis, no CI | Se confirmó leyendo `run-ci.yml` directamente y consultando la API pública de SonarCloud (`components/show`) — ambas hipótesis se confirmaron correctas | Ninguna corrección necesaria | Exactitud: Alta / Completitud: Completa / Trazabilidad: Sí / Honestidad: Sí / Accionabilidad: Alta |
| 2 | 2026-07-28 | Clasificar 15–20 issues reales de axios (defecto/error/falla) | Tabla de 19 issues con enlaces reales a GHSA/CVE/issues de GitHub | Se verificó que **cada uno de los 19 enlaces existe** (extraídos directamente de `api.github.com`, no generados) | Ninguna — todos los datos vinieron de llamadas API reales, no de memoria del modelo | Exactitud: Alta / Completitud: Completa / Trazabilidad: Sí / Honestidad: Sí / Accionabilidad: Alta |
| 3 | 2026-07-28 | Estimar el CoNQ del incidente de cadena de suministro (#10604/#10636) | Memoria de cálculo con supuestos explícitos (tasa de descarga → instalaciones expuestas → costo aguas abajo) | Se verificaron las cifras base (461.8M descargas/mes, ventana de 2h54min) contra `api.npmjs.org` y el post mortem público; el factor "10% instalación fresca" es un supuesto declarado, no un dato medido | **Pendiente de revisión humana**: el equipo debe decidir si el factor del 10% es razonable o ajustarlo con su propio criterio antes de radicar | Exactitud: Media (depende del supuesto declarado) / Completitud: Completa / Trazabilidad: Sí / Honestidad: Sí (supuesto explícito) / Accionabilidad: Alta |
| 4 | 2026-07-28 | Proponer umbrales del Anexo ISO/IEC 25010 y condiciones de Quality Gate | Ponderación de 8 características + tabla de umbrales + configuración exacta para pegar en SonarCloud | Se verificaron los valores "reales medidos" contra `api/measures/component` de SonarCloud | La ponderación (pesos %) es **juicio profesional del modelo**, explícitamente marcada como discutible — el equipo debe revisarla y ajustarla si no la comparte | Exactitud: Alta (en los datos) / Completitud: Completa / Trazabilidad: Sí / Honestidad: Sí / Accionabilidad: Alta |
| 5 | 2026-07-28 | Clasificar 3 hallazgos de deuda técnica en el cuadrante de Fowler | 3 hallazgos con regla Sonar, esfuerzo real en horas, y cuadrante asignado con justificación narrativa | Se verificaron los `rule id`, líneas y `effort` contra `api/issues/search` de SonarCloud | El cuadrante asignado (Reckless/Prudent × Deliberate/Inadvertent) es interpretación humana-asistida por IA, no un dato medible — señalado explícitamente como criterio a validar por el equipo | Exactitud: Alta (datos) / Completitud: Completa / Trazabilidad: Sí / Honestidad: Sí / Accionabilidad: Alta |
| 6 | 2026-07-28 | Diseñar el agente Nivel 2 y ejecutar su PoC | Especificación completa + 2 ejecuciones reales documentadas en `04-gobernanza-ia.md` §4 | **Verificación humana pendiente** — Juan Esteban Guzmán Henao y Arcenio Adames Tobón deben confirmar por escrito aquí que revisaron ambas salidas | — | Ver checklist §3 |

## 3. Checklist de verificación humana pendiente (a firmar antes de radicar)

- [ ] Confirmar el factor de "10% instalación fresca" del CoNQ (fila 3) o reemplazarlo por un criterio propio justificado.
- [ ] Confirmar o ajustar la ponderación de características ISO 25010 (fila 4) — es juicio profesional del modelo, no un hecho.
- [ ] Revisar y firmar las dos ejecuciones del agente Nivel 2 (fila 6) — nombre, fecha, y si se está de acuerdo con la clasificación de confianza.

**Firma (equipo):** _______________________ Fecha: _______________
