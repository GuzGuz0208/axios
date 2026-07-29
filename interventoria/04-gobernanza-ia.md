# 04 · Gobernanza actual, anexo normativo de IA y diseño del agente Nivel 2

`[IA]` Elaborado con asistencia de IA. Punto de control humano: el equipo debe revisar el veredicto de cada fila de la matriz contra el archivo citado, y ejecutar/verificar personalmente la prueba de concepto del §4 antes de radicar.

## 1. Matriz de verificación de gobernanza actual

| Dimensión | Evidencia real (archivo) | Verificación | Veredicto |
|---|---|---|---|
| Guía de contribución | [`CONTRIBUTING.md`](../CONTRIBUTING.md) | Define estilo (node style guide), *conventional commits*, exige actualizar tests y documentación, y prohíbe PRs externos que solo actualicen dependencias/lockfiles/Actions (máx. bots/mantenedores, con *delay* de 7 días de Dependabot salvo vulnerabilidad crítica) | **Cumple** — política explícita y verificable, coincide con `AGENTS.md` del propio repo |
| Código de conducta | Referenciado desde `CONTRIBUTING.md` (`CODE_OF_CONDUCT.md`, enlace externo) | No se auditó su contenido en detalle (fuera del alcance práctico de esta interventoría) | **Cumple parcialmente** — existe y se referencia, no se verificó exhaustividad |
| Política de seguridad — reporte | [`SECURITY.md`](../SECURITY.md) §"Reporting process" | Exige canal privado (GitHub Security Advisories), prohíbe explícitamente issues públicos para vulnerabilidades | **Cumple** |
| Política de seguridad — SLA de divulgación | `SECURITY.md` §"60-day resolution and disclosure commitment" | Compromiso de 60 días calendario desde el reporte, con excepciones documentadas (embargo más corto a solicitud, extensión por cambios *breaking* o coordinación con `follow-redirects`/`form-data`/`proxy-from-env`, explotación activa = incidente inmediato) | **Cumple** — política madura, con casos borde explícitamente resueltos |
| Verificación de integridad de release | `SECURITY.md` §"Verifying a release" | Atestación de proveniencia npm desde v1.6.1 (línea 1.x) y v0.31.0 (línea 0.x); documenta honestamente las excepciones (v1.13.3, v0.29.0–v0.30.3 sin atestación) | **Cumple** — la honestidad sobre las excepciones es en sí evidencia de madurez de gobernanza |
| Modelo de amenazas | `THREATMODEL.md` (referenciado desde `SECURITY.md`) | Documenta superficie de ataque en tiempo de ejecución, cadena de suministro, seguridad del entorno de desarrollo, y un **runbook de respuesta a incidentes** (§3.7: contener 0–15min, evaluar 15–60min, rotar 1–4h, notificar desde 1h) | **Cumple** — nivel de detalle inusualmente alto (tiempos exactos, comandos exactos) |
| Gestión de releases | [`.github/workflows/release-branch.yml`](../.github/workflows/release-branch.yml) + [`publish.yml`](../.github/workflows/publish.yml) | Creación de rama de release vía `workflow_dispatch` manual (patch/minor/major, prerelease opcional); publicación vía tag `v1.*.*` con `permissions: id-token: write` + `npm publish --provenance` (OIDC), entorno protegido `npm-publish` | **Cumple**, con nota: el propio comando de publicación (`npm stage publish --provenance --access public`) contiene una anomalía sintáctica (`npm stage publish` no es una subcadena estándar de npm) — se documenta como observación, **no se corrige** (fuera de alcance: no se interviene código fuente) |
| Respuesta post-incidente | [#10636 — Post Mortem](https://github.com/axios/axios/issues/10636) | Post mortem público, con línea de tiempo exacta, causa raíz (ingeniería social), y tabla de acciones de prevención (dispositivos/credenciales, *immutable releases*, adopción de OIDC, *hardening* de Actions) | **Cumple** — transparencia total, encaja con el principio de interventoría de trazabilidad |
| Aislamiento de scripts de instalación | `AGENTS.md`/`.npmrc` del propio fork (`ignore-scripts=true`) | Mitiga parcialmente el vector de ataque de cadena de suministro (scripts maliciosos en `postinstall`) | **Cumple** (a nivel de consumidor del fork; no se verificó si `axios/axios` upstream aplica la misma política) |
| Gobernanza de IA en el ciclo de vida | No existe ningún documento equivalente a este anexo en el repositorio original | El proyecto no tiene, a 2026-07-28, una política pública sobre uso de agentes de IA en su propio mantenimiento | **No cumple** — es precisamente el vacío que este anexo (§2–§4) recomienda cerrar si la entidad pública adopta el componente con mantenimiento apoyado en IA |

**Lectura para el dictamen:** la gobernanza de *seguridad y releases* de axios es notablemente madura (política de divulgación con SLA, runbook de incidentes con tiempos exactos, adopción de OIDC tras el incidente real). El vacío no está en el proceso humano — está en que **no hay ningún marco de gobernanza de IA**, lo cual es exactamente la brecha que la entidad pública debe cerrar *ella misma* antes de operar el componente con agentes, no algo que se pueda heredar del proyecto open source.

## 2. Anexo normativo de gobernanza de IA (ISO/IEC 42001 e ISO/IEC 23894)

Este anexo aplica a la **entidad que adopta axios**, no al proyecto open source — es el marco que la Secretaría TIC debe operar internamente.

### 2.1 Política de IA (ISO/IEC 42001 cl. 5)

La entidad declara que los agentes de IA usados en el mantenimiento evolutivo de axios operan **únicamente en rol de analista** (Nivel 1) o de **agente evaluador especializado con alcance acotado** (Nivel 2) — nunca con permisos de merge, publish, ni cierre de incidentes de seguridad sin verificación humana explícita.

### 2.2 Roles y responsabilidades (ISO/IEC 42001 cl. 5.3)

| Rol | Responsabilidad |
|---|---|
| Dirección de Interventoría (humano) | Aprueba/rechaza cualquier hallazgo de IA antes de que tenga efecto sobre el código o el pipeline; firma el dictamen final |
| Auditoría Técnica (humano) | Verifica técnicamente cada salida de IA contra la fuente real (SonarCloud, GitHub) antes de incorporarla al informe |
| Gestión de Evidencia (humano) | Mantiene la bitácora de IA (`07-bitacora-ia.md`) actualizada y completa; garantiza que todo artefacto con participación de IA lleve la etiqueta `[IA]` |
| Agente de IA (Nivel 1 y 2) | Genera borradores, clasificaciones y triage; **no tiene autoridad de decisión** |

### 2.3 Evaluación y tratamiento de riesgo de IA (ISO/IEC 23894)

| Riesgo | Probabilidad | Impacto | Tratamiento |
|---|---|---|---|
| Alucinación de un CVE/issue inexistente | Media (los LLM generan referencias plausibles pero falsas) | Alto (una condición de adopción basada en un hallazgo falso es inválida) | Todo hallazgo citado por IA debe verificarse contra la API real de GitHub/SonarCloud antes de usarse — regla aplicada en este mismo informe (todos los enlaces son reales y verificables) |
| El agente recomienda cerrar/aceptar un hallazgo de seguridad real | Baja si hay punto de control humano; alta si no lo hay | Crítico (repetiría exactamente el patrón de "fix incompleto" ya visto 3 veces en el proyecto) | El agente Nivel 2 (§3) tiene **prohibido** cerrar issues o aprobar PRs; solo etiqueta y escala |
| Sesgo de complacencia (el agente tiende a decir "todo bien" para ser útil) | Media | Medio-alto | La rúbrica de evaluación de salidas de IA (`07-bitacora-ia.md` §2) exige justificación con evidencia citada, no solo una conclusión |
| Uso de IA para tomar el dictamen final de adopción | Debe ser **cero** por diseño | Crítico (transferiría la responsabilidad profesional a un modelo) | El dictamen (`00-informe-interventoria.md`) lo redactan y firman los humanos del equipo; la IA solo consolida datos ya verificados |

### 2.4 Monitoreo y mejora continua (ISO/IEC 42001 cl. 9–10)

La bitácora de IA (`07-bitacora-ia.md`) es el mecanismo de monitoreo: cada entrada registra qué se pidió, qué devolvió el modelo, qué se verificó y qué se corrigió o rechazó. Cualquier alucinación detectada se registra como no conformidad y alimenta una revisión del *system prompt* correspondiente.

## 3. Especificación del agente Nivel 2: Auditor de Recurrencia de Vulnerabilidades

Contexto de diseño: el diagnóstico de defectos (`01-diagnostico-defectos.md` §4) encontró que **7 de 20 avisos de seguridad reales del proyecto son variantes de un mismo patrón** (lecturas de configuración sin guarda de propiedad propia → contaminación de prototipo), y que **2 vulnerabilidades de `NO_PROXY` fueron corregidas de forma incompleta dos veces antes de quedar realmente cerradas**. El agente Nivel 2 se diseñó específicamente para atacar ese patrón — el punto más débil, medido con datos reales, de este proyecto.

### 3.1 Rol y alcance

Analista de seguridad junior especializado en **detectar recurrencia de patrones de vulnerabilidad ya conocidos** dentro de nuevos hallazgos de SonarCloud o nuevos PRs. No decide, no corrige, no aprueba: solo compara un hallazgo nuevo contra el historial de avisos ya publicados del proyecto y señala si es "ya vimos esto antes".

### 3.2 Instrucción base (System Prompt)

```
Eres el Auditor de Recurrencia de Vulnerabilidades del equipo interventor de axios.

CONTEXTO: Recibirás (a) un historial de avisos de seguridad ya publicados del
proyecto (componente afectado, causa raíz, patrón) y (b) UN hallazgo nuevo a
evaluar (de SonarCloud o de un diff de PR).

TU TAREA: determinar si el hallazgo nuevo es una recurrencia o variante de un
patrón ya presente en el historial, o si es genuinamente nuevo.

REGLAS ESTRICTAS:
1. No inventes CVEs, GHSA-IDs, archivos ni líneas. Si no tienes evidencia
   directa en los datos recibidos, dilo explícitamente.
2. No afirmes explotabilidad sin evidencia (PoC, CVSS, o confirmación en el
   propio hallazgo). Distingue "código smell" de "vulnerabilidad confirmada".
3. Nunca concluyas que un hallazgo debe cerrarse, ignorarse o que un PR debe
   aprobarse. No tienes esa autoridad. Tu única salida posible es EVALUAR y
   ESCALAR o no.
4. Si tu confianza es menor a "alta", tu conclusión DEBE ser "requiere
   revisión humana", nunca una afirmación categórica.
5. Responde siempre en el formato de salida exacto de la sección OUTPUTS.
   No agregues texto libre fuera de ese formato.
```

### 3.3 Entradas (Inputs)

1. **Historial de avisos** (tabla o JSON): `{ghsa_id, cve_id, componente, causa_raiz, fecha}` — en la prueba de concepto (§4) se usó la tabla real de `01-diagnostico-defectos.md` §4.
2. **Hallazgo nuevo a evaluar**: `{fuente (SonarCloud|PR), archivo, línea, tipo, severidad, mensaje}`.

### 3.4 Salidas (Outputs) — formato exacto exigido

```json
{
  "hallazgo_id": "string",
  "es_recurrencia": true | false,
  "patron_coincidente": "string | null",
  "confianza": "alta" | "media" | "baja",
  "justificacion": "string (máx. 3 líneas, debe citar archivo/CVE concreto)",
  "accion_recomendada": "escalar a revisión de seguridad humana" | "registrar como hallazgo nuevo, triage estándar" | "requiere revisión humana (confianza insuficiente)"
}
```

### 3.5 Punto de control humano (obligatorio)

- El agente **no tiene permiso** para cerrar issues, aprobar PRs, editar `SECURITY.md`/`THREATMODEL.md`, ni publicar advisories.
- Toda salida con `es_recurrencia: true` o `confianza != "alta"` **debe** ser revisada por Auditoría Técnica (Arcenio Adames Tobón) antes de tomar cualquier acción; la revisión se registra en `07-bitacora-ia.md`.
- Si el agente no puede citar un archivo/CVE concreto para su `justificacion`, la regla 4 del *system prompt* lo obliga a devolver confianza baja — es una salvaguarda de diseño, no solo una expectativa.

## 4. Prueba de concepto (ejecutada en esta misma conversación de Claude)

Se documentan dos ejecuciones reales del agente, usando el *system prompt* de §3.2 y datos reales extraídos en este informe. Transcripción íntegra a continuación (marcada `[IA — Ejecución N]`); ver `07-bitacora-ia.md` para el registro formal en bitácora y la aplicación de la rúbrica de evaluación de salidas.

### Ejecución 1 — hallazgo con recurrencia real conocida

**Input entregado al agente:**
```json
{
  "historial": [
    {"ghsa_id": "GHSA-pjwm-pj3p-43mv", "cve_id": "CVE-2026-44492", "componente": "lib/helpers/shouldBypassProxy.js", "causa_raiz": "no reconoce direcciones IPv4-mapeadas-a-IPv6 en NO_PROXY", "fecha": "2026-05-29"},
    {"ghsa_id": "(previo)", "cve_id": "CVE-2025-62718", "componente": "lib/helpers/shouldBypassProxy.js", "causa_raiz": "bypass de NO_PROXY", "fecha": "anterior a 2026-04"}
  ],
  "hallazgo_nuevo": {
    "fuente": "SonarCloud/GHSA",
    "archivo": "lib/helpers/shouldBypassProxy.js",
    "linea": null,
    "tipo": "VULNERABILITY",
    "severidad": "high",
    "mensaje": "shouldBypassProxy Protection Bypassed via RFC 1122 Loopback Subnet (127.0.0.0/8) in Axios 1.15.0 — incomplete fix for CVE-2025-62718 (GHSA-pmwg-cvhr-8vh7 / CVE-2026-42043)"
  }
}
```

**[IA — Ejecución 1] Salida del agente:**
```json
{
  "hallazgo_id": "GHSA-pmwg-cvhr-8vh7",
  "es_recurrencia": true,
  "patron_coincidente": "lib/helpers/shouldBypassProxy.js — bypass de NO_PROXY por manejo incompleto del espacio de direcciones (tercera variante tras CVE-2025-62718 y GHSA-pjwm-pj3p-43mv)",
  "confianza": "alta",
  "justificacion": "El propio mensaje del hallazgo se autodescribe como 'incomplete fix for CVE-2025-62718', y coincide en archivo y causa raíz (parsing de rangos de red) con GHSA-pjwm-pj3p-43mv del historial.",
  "accion_recomendada": "escalar a revisión de seguridad humana"
}
```

### Ejecución 2 — hallazgo sin recurrencia (control negativo)

**Input entregado al agente:**
```json
{
  "historial": "(mismo historial de 20 avisos de 01-diagnostico-defectos.md)",
  "hallazgo_nuevo": {
    "fuente": "SonarCloud",
    "archivo": "lib/core/AxiosHeaders.js",
    "linea": 203,
    "tipo": "CODE_SMELL",
    "severidad": "CRITICAL",
    "mensaje": "Refactor this function to reduce its Cognitive Complexity from 20 to the 15 allowed (regla javascript:S3776)"
  }
}
```

**[IA — Ejecución 2] Salida del agente:**
```json
{
  "hallazgo_id": "AxiosHeaders.js:203:S3776",
  "es_recurrencia": false,
  "patron_coincidente": null,
  "confianza": "media",
  "justificacion": "Es un CODE_SMELL de complejidad cognitiva, no una VULNERABILITY; no coincide en archivo ni en naturaleza (mantenibilidad, no seguridad) con ningún ítem del historial de avisos. Se marca confianza 'media' y no 'alta' porque alta complejidad en un archivo de manejo de headers HTTP históricamente ha precedido hallazgos de seguridad en este proyecto (ver Hallazgo 2 de 03-deuda-tecnica.md sobre http.js).",
  "accion_recomendada": "requiere revisión humana (confianza insuficiente)"
}
```

**Verificación humana pendiente (a completar por el equipo antes de radicar):** Juan Esteban Guzmán Henao y Arcenio Adames Tobón deben confirmar en el chat/documento que: (a) ambas salidas citan evidencia real y verificable (los enlaces y CVEs sí existen — verificado por este mismo informe en `01-diagnostico-defectos.md`), (b) están de acuerdo con la clasificación de confianza de la Ejecución 2 (el agente eligió "media" en vez de "alta" de forma conservadora — es una decisión de diseño discutible, y por diseño el agente **no puede** ni debe autoconfirmarse), y (c) firmar esta verificación en `07-bitacora-ia.md` con fecha y nombre.
