# 02 · Anexo Técnico ISO/IEC 25010 — Umbrales de calidad de axios

`[IA]` Documento elaborado con asistencia de IA sobre mediciones reales de SonarCloud (`GuzGuz0208_axios`, extraídas 2026-07-28 vía API pública, análisis Automatic Analysis previo a la migración a CI). Punto de control humano: el equipo debe revisar la ponderación del §1 (es juicio profesional, discutible) y re-verificar los valores reales una vez el job `sonarcloud` corra en Actions.

## 1. Ponderación de características (adaptada a la naturaleza del componente)

axios es un **cliente HTTP**, propuesto como núcleo de una plataforma pública con **mantenimiento evolutivo por un equipo interno apoyado en IA**. Dos consecuencias de esto guían la ponderación: (1) toda request saliente de la plataforma pasa por este componente, así que un defecto de seguridad o fiabilidad aquí no es un bug más — es un punto único de falla transversal; (2) al ser mantenido evolutivamente, la mantenibilidad del código no es un lujo académico sino la variable que determina si el equipo interno puede intervenir con seguridad.

| Característica ISO/IEC 25010 | Peso | Justificación |
|---|---|---|
| Seguridad | 25% | 20 avisos de seguridad públicos reales en el historial (§4 de `01-diagnostico-defectos.md`), 7 de ellos de la misma familia (contaminación de prototipo) — el riesgo dominante del componente |
| Fiabilidad | 20% | Un cliente HTTP que crashea el proceso (issue #10558, EPIPE) o pierde datos silenciosamente (parseReviver) rompe la disponibilidad de *toda* la plataforma que lo consume, no solo una función |
| Mantenibilidad | 20% | Explícito en el encargo: plan de mantenimiento evolutivo por equipo interno + agentes de IA. Código de baja mantenibilidad es exactamente lo que hace insegura la intervención de IA (un junior de IA no puede refactorizar con confianza una función con complejidad cognitiva 145) |
| Compatibilidad | 15% | El propio proyecto se prueba contra Node (4 versiones LTS), navegador, Bun y Deno — es una librería transversal a todo el ecosistema JS; una regresión de compatibilidad (ver #7111, #5366) rompe consumidores silenciosamente |
| Eficiencia de desempeño | 10% | Issue real de degradación con payloads grandes (#6483) y acumulación de listeners bajo keep-alive (#10780) — relevante pero de impacto más acotado que seguridad/fiabilidad |
| Usabilidad | 5% | API estable y ampliamente documentada; el riesgo principal es de diagnosticabilidad de errores (mensajes "Network Error" genéricos), no de la superficie de la API en sí |
| Idoneidad funcional | 3% | Librería madura (12+ años), con adopción masiva (461M descargas/mes) — la completitud funcional no es una pregunta abierta |
| Portabilidad | 2% | Se solapa en gran parte con compatibilidad; peso residual para instalabilidad/empaquetado (CJS/ESM dual, tree-shaking) |

## 2. Umbrales por característica (mapeados a métricas medibles)

| Característica | Métrica verificable | Umbral propuesto | Valor real medido (2026-07-28) | ¿Cumple? |
|---|---|---|---|---|
| Seguridad | `security_rating` (Overall Code) | A (0 vulnerabilidades sin resolver) | D (4.0) — 52 vulnerabilidades abiertas | **No** |
| Seguridad | Vulnerabilidades `BLOCKER`/`CRITICAL` | 0 | 11 `BLOCKER` + 50 `CRITICAL` (de 467 issues totales) | **No** |
| Seguridad | `security_hotspots_reviewed` | 100% | 0 hotspots detectados (distinto de vulnerabilidades ya confirmadas — ver nota) | N/A |
| Fiabilidad | `reliability_rating` (Overall Code) | B o mejor | E (5.0) — 21 bugs abiertos | **No** |
| Fiabilidad | `reliability_remediation_effort` | ≤ 8 h | 103 min ≈ 1.7 h | **Sí** |
| Mantenibilidad | `sqale_rating` (Maintainability Rating) | A | A (1.0) | **Sí** |
| Mantenibilidad | Complejidad cognitiva por función | ≤ 15 (regla Sonar `S3776`) | Violado hasta 10× en `lib/adapters/http.js` (145 vs. 15 permitido, línea 508) | **No** (ver `03-deuda-tecnica.md`) |
| Mantenibilidad | `sqale_index` (deuda técnica total) | ≤ 5% del tiempo de desarrollo estimado (regla estándar Sonar) | 2,465 min ≈ 41.1 h sobre 10,877 LOC | Requiere cálculo de tiempo de desarrollo estimado para veredicto — reportado como dato bruto |
| Compatibilidad | Suites de compatibilidad en verde (Node 12–26, navegador, Bun, Deno) | 100% de jobs en verde | Pendiente de primera corrida completa del pipeline en el fork (ver `interventoria/04-gobernanza-ia.md` §2) | Pendiente |
| Eficiencia de desempeño | Duplicación de código (`duplicated_lines_density`) | ≤ 3% | 1.4% | **Sí** |
| Usabilidad | N/A — sin métrica automática de Sonar; evaluado en el paquete V&V (`05-vv-package.md`) | — | — | — |

**Nota sobre Security Hotspots vs. Vulnerabilities:** SonarCloud distingue *issues* de tipo `VULNERABILITY` (ya confirmados por la regla, cuentan directo en `security_rating`) de *Security Hotspots* (patrones que requieren revisión manual explícita). Este proyecto tiene 0 hotspots pero 52 vulnerabilidades confirmadas — el problema no es "código sospechoso sin revisar", es código con patrones de vulnerabilidad ya identificados con certeza por el analizador.

## 3. Configuración recomendada del Quality Gate en SonarCloud (Overall Code)

Pegar estas condiciones en SonarCloud → tu proyecto → Quality Gates → (clonar "Sonar way" o crear un gate nuevo) → agregar condiciones **sobre "Overall Code", no "New Code"** (el brief exige el veredicto sobre el código completo, no solo el diff):

| Métrica (nombre en la UI de SonarCloud) | Operador | Valor |
|---|---|---|
| Security Rating | is worse than | A |
| Reliability Rating | is worse than | B |
| Maintainability Rating | is worse than | A |
| Duplicated Lines (%) | is greater than | 3.0 |
| Blocker Issues | is greater than | 0 |

Con los valores reales medidos, **este Quality Gate emitiría veredicto FAIL** — por Security Rating (D vs. A exigido) y Reliability Rating (E vs. B exigido). Esto es un resultado correcto y esperado del sistema de calidad, no un error de configuración: el criterio de evaluación del proyecto (100 pts) es explícito en que la robustez del *sistema* de verificación no depende de que el repositorio audite apruebe.

## 4. Limitación conocida y recomendación

El pipeline actual (`run-ci.yml`) no publica un reporte de cobertura a SonarCloud — `npm run test:vitest:unit` no corre con `--coverage` y no hay dependencia de cobertura instalada (`@vitest/coverage-v8` o equivalente). Por eso no se incluyó `Coverage` como condición del Quality Gate: agregarla ahora produciría "no data" permanente, no un umbral real. **Recomendación para el equipo (fuera del alcance de esta interventoría, que no debe modificar el código fuente):** si se desea instrumentar cobertura, se requeriría añadir una dependencia de desarrollo — decisión que, según `AGENTS.md` del propio repositorio, requiere discusión explícita antes de implementarse, y por tanto se deja documentada aquí, no ejecutada.
