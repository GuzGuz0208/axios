# Informe de Interventoría — axios/axios

**Equipo auditor:** Juan Esteban Guzmán Henao (Dirección de Interventoría, Gestión de Evidencia — repositorio) y Arcenio Adames Tobón (Auditoría Técnica, Gestión de Evidencia — bitácora de IA).

**Objeto de auditoría:** [`axios/axios`](https://github.com/axios/axios) — cliente HTTP, JavaScript. Fork de trabajo: [`GuzGuz0208/axios`](https://github.com/GuzGuz0208/axios) (rama `v1.x`). Tablero SonarCloud: [`GuzGuz0208_axios`](https://sonarcloud.io/summary/overall?id=GuzGuz0208_axios&branch=v1.x).

**Encargo:** concepto técnico vinculante sobre la adopción de axios como núcleo de una plataforma pública, con mantenimiento evolutivo por un equipo interno apoyado en agentes de IA.

`[IA]` Este documento consolida los hallazgos de los anexos 01–07, elaborados con asistencia de IA sobre datos reales (APIs públicas de GitHub y SonarCloud, 2026-07-28). **El dictamen de §5 es un borrador que Dirección de Interventoría debe revisar, ajustar según su propio juicio profesional, y firmar antes de radicar** — no es una conclusión que la IA esté autorizada a emitir por sí sola (ver `04-gobernanza-ia.md` §2.3, tabla de riesgos, fila "Uso de IA para tomar el dictamen final").

---

## 1. Resumen ejecutivo

axios es el cliente HTTP más descargado del ecosistema JavaScript (**461.8 millones de descargas/mes**, dato real de npm). Es una librería madura (12+ años), con licencia MIT, gobernanza de seguridad notablemente formal (política de divulgación con SLA de 60 días, runbook de respuesta a incidentes con tiempos exactos, atestación de proveniencia OIDC en el pipeline de publicación) y un desempeño de ingeniería que, medido con proxies DORA reales, se ubica en la banda **Alta** en frecuencia de despliegue y lead time.

Al mismo tiempo, la auditoría encontró un **patrón sistémico de vulnerabilidad real**: 7 de 20 avisos de seguridad públicos analizados pertenecen a la misma familia de causa raíz (lecturas de configuración sin guarda de propiedad propia → contaminación de prototipo), y un sub-patrón de 3 correcciones incompletas sucesivas sobre la misma lógica de `NO_PROXY`. El Quality Gate parametrizado sobre el Anexo ISO/IEC 25010 (§2 más abajo) **falla hoy** sobre Overall Code, específicamente en las dos características de mayor peso (Seguridad 25%, Fiabilidad 20%). Y el proyecto tiene, en su historial reciente (marzo de 2026), un incidente real de compromiso de cadena de suministro cuyo costo de no calidad se estima en **~US$927,500**, del cual el 99.6% lo pagan los consumidores del paquete, no axios.

Ninguno de estos dos conjuntos de hechos anula al otro. El dictamen de §5 los concilia.

## 2. Mapa de evidencia (anexos de este informe)

| Anexo | Contenido | Hallazgo principal |
|---|---|---|
| [`01-diagnostico-defectos.md`](01-diagnostico-defectos.md) | Constitución del equipo, due diligence, 19 issues reales clasificados (defecto/error/falla), CoNQ del incidente de cadena de suministro | CoNQ ≈ US$927,500; 7/19 issues son la misma familia de causa raíz |
| [`02-anexo-iso25010.md`](02-anexo-iso25010.md) | Ponderación ISO/IEC 25010, umbrales, configuración de Quality Gate | Quality Gate fallaría hoy: Security Rating D, Reliability Rating E |
| [`03-proceso-as-is.drawio`](03-proceso-as-is.drawio) / [`03-deuda-tecnica.md`](03-deuda-tecnica.md) | Diagrama de proceso PR→release, 3 hallazgos de deuda técnica (Fowler) | 2/3 hallazgos son deuda peligrosa real ligada a CVEs; 1/3 es deuda correctamente aceptada |
| [`04-gobernanza-ia.md`](04-gobernanza-ia.md) | Matriz de gobernanza, anexo normativo IA (ISO 42001/23894), agente Nivel 2 + PoC | Gobernanza de seguridad madura; gobernanza de IA inexistente (brecha que la entidad debe cerrar) |
| [`05-vv-package.md`](05-vv-package.md) | Inspección formal + 10 casos de prueba de caja negra, ejecutados realmente | 10/10 PASS — el módulo históricamente más vulnerable del proyecto pasa hoy la regresión |
| [`06-dora-pareto.md`](06-dora-pareto.md) | Métricas DORA, Pareto (467 hallazgos/94 archivos), densidad de defectos | Alto desempeño en despliegue/lead time; Change Failure Rate proxy 27.3% |
| [`07-bitacora-ia.md`](07-bitacora-ia.md) | Bitácora de IA y rúbrica de evaluación de salidas | 6 interacciones registradas, 3 con verificación humana pendiente |

## 3. Estado del pipeline de verificación (prerrequisito técnico)

- **Fork:** [`GuzGuz0208/axios`](https://github.com/GuzGuz0208/axios), rama `v1.x`.
- **Corrección aplicada (commit `eb0fc83`):** `run-ci.yml` solo disparaba en `pull_request`; se agregó trigger `push` sobre `v1.x` y un job `sonarcloud`.
- **Corrección aplicada (commit `d8e296d`):** el paso `Dependency Review` solo funciona con el contexto de un Pull Request (diff base/head); al agregar el trigger `push` empezó a fallar en cada push directo. Se marcó condicional (`if: github.event_name == 'pull_request'`).
- **Estado verificado (commit `d8e296d`):** los 8 jobs originales del pipeline (build, lint, tests unitarios, tests de navegador, empaquetado, y smoke/module tests de CJS/ESM/Bun/Deno en toda la matriz de Node) **corren en verde**. El job `sonarcloud` fallaba con el mensaje `Running this GitHub Action without SONAR_TOKEN is not recommended` (exit code 3) — indicando que el secret no estaba disponible en ese momento.
- **Estado tras la configuración del secret por el equipo:** pendiente de confirmar en la próxima corrida (ver commit posterior a este).
- **URL del pipeline:** `https://github.com/GuzGuz0208/axios/actions`
- **URL del tablero:** `https://sonarcloud.io/summary/overall?id=GuzGuz0208_axios&branch=v1.x`

**Acción pendiente antes de radicar:** confirmar que el job `sonarcloud` pasa en verde y reemplazar esta sección con el veredicto final del Quality Gate calculado desde CI.

## 4. Síntesis cuantitativa

| Dimensión | Resultado | Fuente |
|---|---|---|
| Costo de la No Calidad (incidente real) | ≈ US$927,500 (99.6% aguas abajo) | `01-diagnostico-defectos.md` §5 |
| Quality Gate (Overall Code, umbrales del Anexo) | **FAIL** — Security Rating D (umbral A), Reliability Rating E (umbral B) | `02-anexo-iso25010.md` §2–3 |
| Deuda técnica genuina vs. aceptada | 2 de 3 hallazgos muestreados son deuda peligrosa real; 1 de 3 es deuda correctamente aceptada | `03-deuda-tecnica.md` |
| Frecuencia de despliegue (DORA) | ~2.0 releases/mes — banda **Alta** | `06-dora-pareto.md` §1.1 |
| Lead time para cambios (DORA) | Mediana 21.4h (mín. 1h en fix de seguridad) — banda **Alta/Elite** | `06-dora-pareto.md` §1.2 |
| Change Failure Rate (proxy, DORA) | 27.3% de releases con fast-follow-up ≤7 días — banda **Media** | `06-dora-pareto.md` §1.3 |
| MTTR de vulnerabilidad (divulgación coordinada) | ≈ 0 (parche público semanas antes del aviso, 19/20 casos) | `06-dora-pareto.md` §1.4 |
| MTTR de incidente activo (compromiso de cadena de suministro) | 2h 54min de exposición real | `01-diagnostico-defectos.md` §5.1 |
| V&V del módulo histórico más vulnerable | 10/10 casos de prueba reales PASS | `05-vv-package.md` §2.3 |
| Gobernanza de seguridad/releases | Madura (SLA de divulgación, runbook de incidentes, OIDC) | `04-gobernanza-ia.md` §1 |
| Gobernanza de IA | Inexistente en el proyecto — a implementar por la entidad | `04-gobernanza-ia.md` §1–2 |

## 5. Dictamen técnico

### **ADOPTAR CON CONDICIONES**

**Justificación:** la evidencia recolectada no sostiene ni un "ADOPTAR" incondicional ni un "NO ADOPTAR". axios exhibe la madurez de ingeniería y de gobernanza de seguridad de un proyecto de infraestructura crítica ampliamente auditado (mediciones DORA en banda Alta, política de divulgación con SLA, adopción de OIDC tras un incidente real, y verificación empírica de que su módulo históricamente más vulnerable pasa hoy 10/10 pruebas de regresión). Pero también exhibe un patrón de riesgo real y medible — no hipotético — que una entidad pública no puede ignorar: 7 de 20 vulnerabilidades reales analizadas comparten una única causa raíz arquitectónica, el Quality Gate parametrizado sobre los umbrales técnicamente justificados del Anexo ISO/IEC 25010 falla hoy en Overall Code, y el componente tiene un historial documentado de un incidente de cadena de suministro con impacto potencial de millones de instalaciones.

**Condiciones de adopción (no negociables):**

1. **Pinning estricto + verificación de proveniencia obligatoria.** La entidad debe fijar la versión exacta de axios en su lockfile y ejecutar `npm audit signatures` como *gate* bloqueante en su propio pipeline de CI, no solo confiar en el del proyecto (mitiga directamente el escenario de CoNQ de `01-diagnostico-defectos.md` §5).
2. **Cierre a satisfacción del Quality Gate del Anexo Técnico** (`02-anexo-iso25010.md` §3) antes de considerar el componente "en producción" — hoy falla en Security Rating y Reliability Rating; se requiere un plan de remediación con fecha, no solo aceptación del riesgo.
3. **Tests de regresión con trazabilidad explícita a CVE** sobre `lib/adapters/http.js` y `lib/helpers/shouldBypassProxy.js` antes de que cualquier agente de IA (Nivel 1 o Nivel 2) intervenga esos archivos en el mantenimiento evolutivo interno (`03-deuda-tecnica.md` Hallazgos 1 y 2, `05-vv-package.md` recomendación del comité).
4. **Implementación previa del marco de gobernanza de IA** del Anexo normativo (`04-gobernanza-ia.md` §2) — roles, matriz de riesgo ISO/IEC 23894, y el protocolo de control humano del agente Nivel 2 — como prerrequisito operativo, no como documentación posterior.
5. **Suscripción activa a GitHub Security Advisories** para `axios/axios` y monitoreo continuo, dado el volumen real de avisos (20 en los últimos ~4 meses al momento de esta auditoría).

**Firma (pendiente):**

| Rol | Nombre | Firma | Fecha |
|---|---|---|---|
| Dirección de Interventoría | Juan Esteban Guzmán Henao | _______________ | _______________ |
| Auditoría Técnica | Arcenio Adames Tobón | _______________ | _______________ |

---

## 6. Pendientes antes de radicar (checklist final)

- [ ] Completar configuración de SonarCloud (`SONAR_TOKEN` + desactivar Automatic Analysis) y re-ejecutar el pipeline (§3).
- [ ] Reemplazar §3 con capturas/URLs finales del pipeline en verde y el veredicto real del Quality Gate.
- [ ] Firmar el checklist de verificación humana de `07-bitacora-ia.md` §3.
- [ ] Revisar y, si corresponde, ajustar el dictamen de §5 con el juicio profesional propio del equipo (este es un borrador de IA, no una conclusión autónoma válida por sí sola).
- [ ] Trasladar este informe a la plantilla oficial del curso si el profesor la entrega antes de la entrega del miércoles 29 de julio (el equipo confirmó no tenerla al momento de escribir este informe).
- [ ] Preparar la defensa oral de 10 minutos (jueves 30 de julio) centrada en: el patrón de 7 CVEs de una misma familia, el Quality Gate en FAIL con causa raíz específica, y las 5 condiciones de adopción — no en generalidades sobre "buena o mala calidad".
