# 01 · Constitución del equipo auditor, due diligence y diagnóstico de defectos

`[IA]` Documento elaborado con asistencia de un modelo de lenguaje (Claude) sobre datos reales extraídos de la API pública de GitHub el 2026-07-28. Punto de control humano: Juan Esteban Guzmán Henao y Arcenio Adames Tobón deben verificar cada enlace y cifra antes de radicar, y completar el criterio profesional donde se indique.

## 1. Constitución del equipo auditor

| Rol | Responsable |
|---|---|
| Dirección de Interventoría | Juan Esteban Guzmán Henao |
| Auditoría Técnica | Arcenio Adames Tobón |
| Gestión de Evidencia | Juan Esteban Guzmán Henao (repositorio/fork) y Arcenio Adames Tobón (bitácora de IA) |

**Objeto de auditoría:** [`axios/axios`](https://github.com/axios/axios) (cliente HTTP, JavaScript), fork de trabajo: [`GuzGuz0208/axios`](https://github.com/GuzGuz0208/axios), rama por defecto `v1.x`. Tablero SonarCloud: `GuzGuz0208_axios` (organización `guzguz0208`).

## 2. Validación técnica preliminar (due diligence)

| Criterio | Resultado | Evidencia |
|---|---|---|
| ¿Compila? | Sí | `npm run build` (Rollup) definido en `package.json`; ejecutado por el job `build-and-run-vitest` en `.github/workflows/run-ci.yml` |
| ¿Las pruebas se ejecutan? | Sí | Suite Vitest unitaria + navegador (Playwright), más smoke tests CJS/ESM/Bun/Deno sobre el paquete empacado — 8 jobs en el pipeline real |
| ¿La licencia permite el fork? | Sí | MIT (`LICENSE`, `package.json: "license": "MIT"`) — permite uso, copia, modificación y distribución |
| ¿CI activo y público? | Sí, con salvedad | El workflow real corre solo con `pull_request`; en el fork se agregó un trigger `push` sobre `v1.x` (ver `interventoria/04-gobernanza-ia.md` §2 y el commit `eb0fc83` en el fork) |
| ¿Historial de fallos reales visible? | Sí | Ver §4 — 20 avisos de seguridad públicos (GHSA/CVE), un incidente de cadena de suministro documentado, e issues de defectos con cientos de comentarios |

**Conclusión de due diligence:** axios cumple los cuatro requisitos de elegibilidad de la lista curada. Es, además, un objeto de interventoría particularmente rico: a diferencia de un repositorio "tranquilo", tiene un historial denso de incidentes de seguridad reales y documentados, lo que permite fundamentar el diagnóstico de defectos y el CoNQ en evidencia real en vez de hipotética.

## 3. Taxonomía aplicada

Se usa la cadena estándar de calidad de software (IEEE 1044 / ISO 24765):

- **Error**: la acción o decisión humana (de diseño, codificación o de proceso) que introduce el problema.
- **Defecto (fault)**: la imperfección concreta que queda en el artefacto (código, configuración, proceso) como consecuencia del error.
- **Falla (failure)**: la desviación de comportamiento observable — por un usuario, por un sistema aguas abajo, o por la comunidad — que resulta de activar el defecto.

Para cada ítem se identifica en qué eslabón de la cadena se sitúa principalmente el reporte, y se reconstruye la cadena completa cuando es posible.

## 4. Tabla de clasificación (19 issues reales)

| # | Issue / Advisory | Tipo dominante | Error → Defecto → Falla | Severidad |
|---|---|---|---|---|
| 1 | [#10604 — axios@1.14.1 y 0.30.4 comprometidos](https://github.com/axios/axios/issues/10604) | **Falla** (proceso/cadena de suministro) | Error: compromiso por ingeniería social de la cuenta npm/GitHub del maintainer líder → Defecto: ausencia de publicación inmutable/OIDC en ese momento → Falla: dos versiones maliciosas con troyano de acceso remoto publicadas en el registro público de npm | Crítica |
| 2 | [GHSA-q8qp-cvcw-x6jj / CVE-2026-42264](https://github.com/axios/axios/security/advisories/GHSA-q8qp-cvcw-x6jj) | **Defecto** | Error: 5 lecturas directas de propiedades de config sin guarda `hasOwnProperty` en `lib/adapters/http.js` y `lib/helpers/resolveConfig.js` → Defecto: gadget de contaminación de prototipo → Falla: inyección de credenciales `Authorization` e hijacking de requests | Alta (CVSS 7.4) |
| 3 | [GHSA-654m-c8p4-x5fp / CVE-2026-44489](https://github.com/axios/axios/security/advisories/GHSA-654m-c8p4-x5fp) | **Error** (fix incompleto) | Error: corrección anterior de contaminación de prototipo no cubrió todos los gadgets → Defecto: `Proxy-Authorization` sigue siendo inyectable → Falla: header de autenticación de proxy filtrado | Baja |
| 4 | [GHSA-898c-q2cr-xwhg / CVE-2026-44490](https://github.com/axios/axios/security/advisories/GHSA-898c-q2cr-xwhg) | **Defecto** | Error: mismo patrón de lectura insegura en funciones `merge*` del core → Defecto: gadget de lectura en `mergeConfig` → Falla: DoS e inyección de headers | Media |
| 5 | [GHSA-pjwm-pj3p-43mv / CVE-2026-44492](https://github.com/axios/axios/security/advisories/GHSA-pjwm-pj3p-43mv) | **Falla** | Error: `shouldBypassProxy` no reconoce direcciones IPv4-mapeadas-a-IPv6 → Defecto: lógica de exclusión `NO_PROXY` incompleta (ver deuda técnica en `lib/helpers/shouldBypassProxy.js`, `interventoria/03-deuda-tecnica.md`) → Falla: bypass del proxy corporativo, tráfico interno expuesto | Alta |
| 6 | [GHSA-pmwg-cvhr-8vh7 / CVE-2026-42043](https://github.com/axios/axios/security/advisories/GHSA-pmwg-cvhr-8vh7) | **Error** (fix incompleto, 2ª vez) | Error: segunda corrección incompleta sobre el mismo componente (subred de loopback RFC 1122) → Defecto: `shouldBypassProxy` — patrón recurrente de parches parciales → Falla: bypass de protección `NO_PROXY` | Alta |
| 7 | [GHSA-xx6v-rp6x-q39c / CVE-2026-42042](https://github.com/axios/axios/security/advisories/GHSA-xx6v-rp6x-q39c) | **Defecto** | Error: coerción booleana insegura de `withXSRFToken` — justo la propiedad que `AGENTS.md` del propio proyecto exige mantener explícita → Defecto: gadget de contaminación en la coerción → Falla: fuga cross-origin del token XSRF | Media |
| 8 | [GHSA-gcfj-64vw-6mp9](https://github.com/axios/axios/security/advisories/GHSA-gcfj-64vw-6mp9) | **Defecto** | Error: el clonado de config al copiar interceptores no resetea el campo de proxy → Defecto: proxy heredado persiste tras clonar → Falla: request enrutado por un proxy no intencionado | Alta |
| 9 | [GHSA-3w6x-2g7m-8v23 / CVE-2026-42044](https://github.com/axios/axios/security/advisories/GHSA-3w6x-2g7m-8v23) | **Falla** | Error: `parseReviver` leído sin guarda de propiedad propia → Defecto: gadget en la respuesta JSON → Falla: alteración invisible de la respuesta (integridad), difícil de detectar en producción | Media |
| 10 | [GHSA-w9j2-pvgh-6h63 / CVE-2026-42041](https://github.com/axios/axios/security/advisories/GHSA-w9j2-pvgh-6h63) | **Falla** | Error: estrategia de merge de `validateStatus` no filtra el prototipo → Defecto: gadget de bypass → Falla: bypass de autenticación | Media |
| 11 | [#7417 — Prototype pollution/DoS en mergeConfig (CVE-2026-25639)](https://github.com/axios/axios/issues/7417) | **Error** (sistémico) | Instancia anterior (v0.30.2/0.30.3) de la misma familia de errores de diseño — evidencia de que el patrón inseguro de lectura de config es **recurrente**, no un caso aislado | Media |
| 12 | [#6320 — HTTPS en texto claro hacia el proxy (regresión)](https://github.com/axios/axios/issues/6320) | **Falla** (regresión) | Error: ausencia de prueba de regresión sobre el comportamiento ya corregido antes → Defecto: reintroducción del envío en claro → Falla: datos sensibles expuestos al proxy | Alta (regresión de seguridad) |
| 13 | [#10780 — MaxListenersExceededWarning en keep-alive concurrente](https://github.com/axios/axios/issues/10780) | **Falla** | Error: falta `removeListener`/limpieza en la reutilización de sockets keep-alive → Defecto: acumulación de listeners en `TLSSocket` → Falla: warning de Node, riesgo de fuga de memoria bajo carga | Media |
| 14 | [#10558 — Requests fallidos pueden crashear el proceso Node con EPIPE](https://github.com/axios/axios/issues/10558) | **Falla** | Error: error `EPIPE` de escritura de socket no capturado → Defecto: falta manejo de excepción en la ruta de escritura → Falla: **caída del proceso Node completo** (no solo del request) | Crítica (disponibilidad) |
| 15 | [#6483 — Request con body grande anormalmente lento](https://github.com/axios/axios/issues/6483) | **Falla** (rendimiento) | Error: estrategia de buffering no optimizada para payloads grandes → Defecto: ruta de codificación ineficiente → Falla: degradación perceptible de rendimiento | Media |
| 16 | [#5366 — Network Error en Android, funciona en iOS (React Native)](https://github.com/axios/axios/issues/5366) | **Falla** (compatibilidad) | Error: la clasificación de errores del adaptador no discrimina la causa raíz por plataforma → Defecto: todo error de red converge en el mismo mensaje genérico → Falla: diagnóstico imposible para el usuario final en Android | Media (100 comentarios — alto costo de soporte) |
| 17 | [#7228 — `url.parse()` deprecado en resolución de proxy (Node DEP0169)](https://github.com/axios/axios/issues/7228) | **Defecto** (latente) | Error: dependencia de una API de Node marcada obsoleta en una ruta activa (resolución de proxy) → Defecto: aún no causa falla, pero es deuda que se activará cuando Node retire `url.parse()` | Baja (riesgo futuro) |
| 18 | [#7111 — Internet Explorer 0.30.2 no funciona](https://github.com/axios/axios/issues/7111) | **Falla** (compatibilidad) | Error: decisión de soporte de plataforma no documentada explícitamente en el momento del cambio → Defecto: pérdida de compatibilidad con IE sin aviso → Falla: aplicaciones legadas rotas | Baja (IE es EOL — juicio profesional: aceptable) |
| 19 | [#10636 — Post Mortem: compromiso de cadena de suministro](https://github.com/axios/axios/issues/10636) | Documentación del incidente #1 | Usado como fuente primaria para la memoria de cálculo del CoNQ (§5) | — |

**Distribución observada:** de 19 ítems, 8 se clasifican con dominante **Falla**, 8 como **Defecto**, 3 como **Error** de proceso/recurrencia. La familia de contaminación de prototipo (ítems 2, 3, 4, 7, 9, 10, 11 — siete instancias) es el patrón más repetido: es un error arquitectónico sistémico (falta de guardas de propiedad propia en lecturas de config), no defectos aislados. Esto es evidencia directa a favor de la regla que el propio repositorio adoptó en `AGENTS.md` ("guard with own-property checks") — la regla existe precisamente porque el patrón contrario ya causó siete avisos de seguridad reales.

## 5. Costo de la No Calidad (CoNQ) — incidente base: compromiso de cadena de suministro (#10604 / #10636)

### 5.1 Los hechos documentados

| Dato | Valor | Fuente |
|---|---|---|
| Fecha del incidente | 2026-03-31 | Post mortem oficial (#10636) |
| Ventana de exposición | 00:21 UTC → 03:15 UTC = **2h 54min** | Timeline del post mortem |
| Versiones comprometidas | `axios@1.14.1`, `axios@0.30.4` | Post mortem |
| Payload | Dependencia inyectada `plain-crypto-js@4.2.1`, troyano de acceso remoto (RAT) multiplataforma (macOS/Windows/Linux) | Post mortem, StepSecurity |
| Vector | Ingeniería social contra el maintainer líder (~2 semanas antes) | Post mortem |
| Descargas mensuales de axios (npm, dato real a 2026-07-24) | 461,851,085 / mes ≈ **19.1M/día** | `api.npmjs.org/downloads/point/last-month/axios` |

### 5.2 Metodología de estimación (supuestos explícitos)

No existe manera de saber exactamente cuántas instalaciones ocurrieron dentro de la ventana de 2h54min de marzo de 2026 sin acceso a los logs internos de npm. Por eso esta memoria de cálculo usa una **tasa de instalación proporcional al volumen de descargas actual** como proxy, documentando el supuesto explícitamente (principio de interventoría: todo número no soportado en evidencia debe declarar su supuesto).

- Descargas/hora promedio ≈ 19,126,614 / 24 ≈ **796,942 descargas/hora**.
- Instalaciones potencialmente expuestas ≈ 796,942 × 2.9 h ≈ **~2,311,000 instalaciones** durante la ventana (supuesto: tasa de descarga constante entre madrugada UTC y el promedio diario — en la práctica la madrugada UTC tiene tráfico menor que el promedio, así que este número es un **techo (upper bound)**, no una estimación central).
- De ellas, solo una fracción ejecutó `npm install` fresco (no todas las descargas son instalaciones nuevas — muchas son CI cacheado o mirrors). Se aplica un factor conservador de **10%** como proxy de "instalación fresca real que hubiera arrastrado la versión maliciosa": ≈ **231,000 instalaciones potencialmente afectadas**.

### 5.3 Componentes de costo

| Componente | Cálculo | Costo estimado (USD) |
|---|---|---|
| Contención y rotación del maintainer (THREATMODEL.md §3.7: sesiones, tokens, SSH, GPG, credenciales cloud, wipe de dispositivos) | 4 horas × 1 persona × $80/h (tarifa ingeniero senior en incident response) | $320 |
| Triage y comunicación comunitaria (317 comentarios en #10604, coordinación con StepSecurity/Snyk/Socket/Datadog, redacción del post mortem) | 16 horas × $80/h | $1,280 |
| Remediación de prevención (adopción de OIDC/`id-token: write` en `publish.yml`, hardening de Actions — evidencia: el `publish.yml` actual ya usa `permissions: id-token: write` y `--provenance`) | 24 horas × $80/h (ingeniería, una sola vez) | $1,920 |
| **Costo directo del proyecto axios (subtotal)** | | **$3,520** |
| Costo de remediación aguas abajo (por instalación potencialmente afectada): verificar lockfile, rotar secretos de CI si aplica, reinstalar — estimado en 3 minutos de tiempo de ingeniería/automatización por instalación afectada | 231,000 instalaciones × 3 min × $80/h ÷ 60 | **$924,000** |
| **CoNQ total estimado (techo, supuestos explícitos arriba)** | | **≈ $927,500** |

### 5.4 Lectura para el dictamen

La cifra aguas abajo dominante ($924,000 de ~$927,500, es decir 99.6% del CoNQ) no es un costo que paga axios: **lo pagan los ~2 millones de consumidores del componente**. Esta es exactamente la pregunta que la Secretaría TIC debe responder antes de adoptar: al integrar un componente de esta escala de adopción como núcleo de una plataforma pública, la entidad hereda no solo los defectos del código, sino la **superficie de impacto de cualquier futuro incidente de cadena de suministro** del mismo. Esto se traduce directamente en condiciones de adopción en `interventoria/00-informe-interventoria.md` (pinning de versión + verificación obligatoria de `npm audit signatures` en el pipeline de la entidad, no solo en el de axios).
