# 03 · Modelado del proceso as-is y deuda técnica

`[IA]` Elaborado con asistencia de IA sobre datos reales de `run-ci.yml`, `release-branch.yml`, `publish.yml`, `CONTRIBUTING.md` y la API de issues de SonarCloud (`GuzGuz0208_axios`, 2026-07-28). Punto de control humano: validar que el diagrama refleje lo que el equipo observa realmente al correr el pipeline, y confirmar los 3 hallazgos de deuda contra el código fuente citado.

## 1. Diagrama del proceso as-is

Ver [`03-proceso-as-is.drawio`](03-proceso-as-is.drawio) (abrir en [app.diagrams.net](https://app.diagrams.net) o la extensión de VS Code). Carriles: **Contribuidor**, **Mantenedor/Revisor**, **GitHub Actions (CI/CD)**, **Registro npm / Observabilidad externa**.

Puntos de control (Quality Gates) identificados en el flujo real:

1. **`run-ci.yml` en `pull_request`** — 8 jobs (build, lint, tests unitarios + navegador, empaquetado, `dependency-review-action`, smoke tests CJS/ESM/Bun/Deno). Ningún PR puede fusionarse si este gate falla.
2. **Aprobación humana del mantenedor** — gate independiente del CI; ambos deben estar en verde para el merge (carril Mantenedor, nodo `m2`).
3. **`run-ci.yml` en `push` a `v1.x` + job `sonarcloud` (agregado en esta interventoría, commit `eb0fc83` del fork)** — el único punto del proceso real donde se evalúa el **Overall Code** contra el Quality Gate de SonarCloud; antes de este fork, el proceso original no tenía este gate corriendo desde Actions (dependía del Automatic Analysis, fuera del pipeline versionado).
4. **`publish.yml`** — gate de integridad de publicación: `permissions: id-token: write` + `--provenance` (OIDC), adoptado como acción de prevención posterior al incidente de cadena de suministro (#10636, ver `01-diagnostico-defectos.md` §5).

El proceso real **no tiene un gate síncrono de seguridad antes del release** — los avisos de seguridad (GHSA/CVE) se generan de forma asíncrona, en cualquier punto del ciclo de vida, típicamente **después** de que la versión vulnerable ya fue publicada (ver los 20 avisos con fecha posterior a su versión afectada en `01-diagnostico-defectos.md`). Este es un hallazgo estructural relevante para el dictamen: el proceso detecta y corrige, pero no previene, en el sentido de que no hay un análisis de seguridad estático bloqueante *antes* del `npm publish`.

## 2. Deuda técnica — 3 hallazgos clasificados (cuadrante de Fowler)

El cuadrante de Fowler cruza **actitud** (Reckless=imprudente vs. Prudent=prudente) con **conciencia** (Deliberate=deliberado vs. Inadvertent=inadvertido).

### Hallazgo 1 — `lib/helpers/shouldBypassProxy.js`: expresiones regulares super-lineales

- **Evidencia SonarCloud:** regla `javascript:S8786` ("Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking"), líneas 60 y 262. Archivo con **20 issues abiertos en total** (5º archivo más denso del proyecto sobre 94 archivos con hallazgos — dato de la distribución completa en `06-dora-pareto.md` §2).
- **Esfuerzo de remediación (SonarCloud):** 2 × 20 min = **40 min** solo para estas dos reglas; ~1h10min si se suman las 12 issues restantes del archivo (parseInt, regex de clases de caracteres, optional chaining).
- **Cuadrante: Reckless + Inadvertent (imprudente e inadvertido).** La evidencia no es solo la regla estática: son **3 CVEs reales** sobre este mismo archivo con el mismo patrón — "corrección incompleta" (`GHSA-pjwm-pj3p-43mv`/CVE-2026-44492, `GHSA-pmwg-cvhr-8vh7`/CVE-2026-42043, y el CVE previo que ambos parchean, CVE-2025-62718). Tres intentos de arreglar el mismo archivo sin cubrir el espacio completo de entradas (direcciones IPv4-mapeadas-a-IPv6, subred de loopback RFC 1122) indica que el equipo **no tenía un modelo completo del problema** al escribir la lógica original — no es una decisión consciente de posponer el diseño, es no haber percibido la complejidad real de "parsear y comparar hosts/CIDRs de forma segura".
- **Recomendación (fuera de alcance de código, para el dictamen):** exigir, como condición de adopción, una batería de tests de caracterización sobre `shouldBypassProxy` con los casos límite ya identificados por los 3 CVEs antes de considerar el componente maduro en este aspecto.

### Hallazgo 2 — `lib/adapters/http.js`: complejidad cognitiva extrema

- **Evidencia SonarCloud:** regla `javascript:S3776`, línea 508: complejidad cognitiva **145** contra un límite permitido de 15 (**9.7× el umbral**); línea 249: complejidad **96** (6.4×); línea 1051: complejidad 20. Archivo con **37 issues abiertos** — el más denso de todo el proyecto (8% del total de 467 hallazgos, ver `06-dora-pareto.md` §2).
- **Esfuerzo de remediación (SonarCloud):** 2h15min + 1h26min + 10min ≈ **3h51min** solo en las 3 issues de complejidad.
- **Cuadrante: Reckless + Deliberate (imprudente y deliberado).** `http.js` es el adaptador HTTP principal — el archivo más antiguo y más tocado del proyecto (redirecciones, proxies, streams, HTTP/2, `maxBodyLength`, `insecureHTTPParser`, etc. se han ido añadiendo encima con el tiempo). Es, además, el archivo donde vive el defecto central de `CVE-2026-42264` (5 lecturas de config sin guarda de propiedad propia). Un equipo que mantiene activamente este archivo durante años necesariamente *sabe* que ha crecido más allá de lo razonable — la explicación más plausible no es ignorancia sino presión de velocidad de entrega ("no tenemos tiempo de rediseñar el adaptador mientras seguimos agregando features"). Es la deuda técnica más peligrosa de las tres: alta complejidad + defectos de seguridad reales conviven en el mismo archivo, lo cual es consistente con la literatura (funciones complejas son más difíciles de auditar correctamente).
- **Recomendación:** priorizar la descomposición de las funciones de las líneas 508 y 249 antes de que el equipo interno (apoyado en IA) intervenga este archivo — un agente de IA junior (Nivel 1) revisando una función de complejidad 145 tiene alto riesgo de pasar por alto un side-effect, exactamente el patrón que originó `CVE-2026-42264`.

### Hallazgo 3 — `tests/module/{cjs,esm}/tests/helpers/*-added-types.ts`: uso de `void` como idiom de type-testing

- **Evidencia SonarCloud:** regla `typescript:S3735` ("Remove this use of the void operator"), marcada **CRITICAL**, repetida 14 veces en `esm-added-types.ts` y 10 veces en `cjs-added-types.ts` (24 issues en total — la mayor concentración de un solo hallazgo en todo el proyecto).
- **Esfuerzo de remediación (SonarCloud):** 24 × 5 min = **2h00min** si se "corrigieran" literalmente.
- **Cuadrante: Prudent + Deliberate (prudente y deliberado).** Por diseño (`AGENTS.md`: *"Type compatibility is exercised through tests/module/cjs with TypeScript 4.9 and tests/module/esm with TypeScript 5.x"*), estos archivos existen exclusivamente para verificar que las declaraciones de tipos (`index.d.ts`/`index.d.cts`) compilan correctamente en ambos entornos. El patrón `void expresión;` es el idiom estándar de *type-testing* (usado por `dtslint` y equivalentes) para forzar al compilador a evaluar el tipo de una expresión sin generar una variable ni un efecto — no es código de aplicación, es una aserción de tipo. "Corregir" esta regla eliminaría la utilidad del archivo. **Esta es la deuda técnica correctamente aceptada del proyecto**: el equipo prioriza la fidelidad del type-check sobre el cumplimiento ciego de una regla de estilo genérica, y lo documenta explícitamente en su propia guía de contribución para agentes.
- **Recomendación:** en el Quality Gate del Anexo ISO 25010 (`02-anexo-iso25010.md`), excluir explícitamente `tests/module/**/*-added-types.ts` de las condiciones de `Code Smells`/`Maintainability Rating` mediante los *Issue exclusions* de SonarCloud, para no penalizar una decisión de diseño correcta con una alarma de calidad falsa.

## 3. Síntesis para el dictamen

De los tres hallazgos, **dos son deuda técnica real y peligrosa** (Hallazgo 1 y 2, ambos en el mismo vecindario de código que produjo CVEs reales) y **uno es deuda aceptada correctamente** (Hallazgo 3). Esta distinción — no toda alarma de SonarCloud es deuda técnica genuina — es exactamente el ejercicio de juicio profesional que exige la interventoría, y debe citarse explícitamente en el dictamen final (`00-informe-interventoria.md`) para no penalizar al proyecto por una excepción bien documentada.
