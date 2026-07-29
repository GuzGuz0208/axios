# 05 · Paquete de Verificación y Validación (V&V)

`[IA]` Elaborado con asistencia de IA. Los 10 casos de prueba de la §2 se **ejecutaron realmente contra el código real** del fork con Node.js (no son predicciones teóricas) — ver comando y salida completa en §2.3. Punto de control humano: el equipo debe repetir la ejecución (comando en §2.3) y firmar el acta de §1.

## 1. Acta de inspección formal

**Rol asumido:** comité evaluador / cliente — no desarrolladores. El objetivo de esta inspección no es "¿funciona el código?" sino "¿es este módulo seguro para que la Secretaría TIC lo adopte como parte de un núcleo de plataforma pública?".

**Módulo bajo inspección:** [`lib/helpers/shouldBypassProxy.js`](../lib/helpers/shouldBypassProxy.js) (208 líneas).

**Justificación de la selección (trazabilidad al Anexo Técnico):**

1. Densidad de defectos más alta de todo el proyecto después de un archivo de 112 líneas (96.2 hallazgos/KLOC, 2.2× el promedio del proyecto — `06-dora-pareto.md` §3).
2. Es el archivo detrás de **3 CVEs reales** de bypass de `NO_PROXY` (`01-diagnostico-defectos.md` ítems 5 y 6), clasificado como deuda técnica Reckless+Inadvertent en `03-deuda-tecnica.md` Hallazgo 1.
3. Mapea directamente a la característica **Seguridad** (peso 25%, la más alta) del Anexo ISO/IEC 25010 (`02-anexo-iso25010.md`) — un fallo aquí es, por definición, un fallo de la condición de mayor peso del anexo.
4. Es lógica **security-critical de bajo nivel** (parseo de direcciones IP, comparación de hosts) — exactamente el tipo de código donde la inspección formal (vs. solo pruebas automatizadas) agrega más valor, porque los errores de este tipo (confusión de representación de direcciones) tienden a ser invisibles a simple vista.

**Método:** inspección de caja negra (el comité no asume conocimiento de la implementación interna; solo del contrato público: `shouldBypassProxy(location: string): boolean`, condicionado por las variables de entorno `NO_PROXY`/`no_proxy`) + ejecución real de los casos de prueba del §2.

**Hallazgos de la inspección (más allá de los ya documentados en SonarCloud):**

- El contrato de la función no está documentado en un docstring público exportado — un consumidor externo del código no tiene forma de conocer el comportamiento exacto de casos límite (p. ej. qué pasa con puertos, con `*`, con direcciones IPv6) sin leer la implementación completa. Esto es un hallazgo de **Usabilidad/documentación**, no de lógica.
- La lógica actual **sí maneja correctamente** el caso de la CVE-2026-44492 (direcciones IPv4-mapeadas-a-IPv6) — confirmado empíricamente en TC5 (§2.3). Esto es evidencia positiva: el código inspeccionado ya incorpora la corrección de la tercera iteración del parche.
- No se encontró, en la lectura del comité, evidencia de que exista una suite de tests de regresión específica que cubra los 3 CVEs históricos de este archivo con nombres de test que referencien los CVEs — recomendación: el equipo interno debería nombrar explícitamente los tests de regresión de seguridad (p. ej. `test('CVE-2026-44492: IPv4-mapped IPv6 loopback bypass', ...)`) para que la trazabilidad sobreviva a futuros refactors.

**Veredicto del comité:** el módulo es **funcionalmente correcto para los 10 casos de prueba ejecutados**, pero **no autocontenido en términos de evidencia de seguridad** — su corrección depende de que el lector conozca el historial externo de CVEs (GitHub Security Advisories), no de algo verificable solo con el repositorio. Condición de adopción recomendada: exigir tests de regresión con trazabilidad explícita a CVE antes de considerar este módulo "cerrado".

## 2. Casos de prueba de caja negra (particiones de equivalencia + valores límite)

### 2.1 Contrato bajo prueba

`shouldBypassProxy(location: string): boolean` — lee `process.env.NO_PROXY`/`no_proxy`; retorna `true` si la request a `location` debe evitar el proxy configurado.

### 2.2 Diseño (10 casos, 8 particiones + 2 sub-casos de límite)

| # | Partición / límite cubierto | `location` | `NO_PROXY` | Resultado esperado |
|---|---|---|---|---|
| TC1 | EC — host sin coincidencia (control negativo) | `https://api.example.com/` | `internal.corp` | `false` |
| TC2 | EC — coincidencia exacta de host | `http://internal.corp/` | `internal.corp` | `true` |
| TC3 | EC — coincidencia por sufijo de dominio (entrada con `.`) | `http://svc.internal.corp/` | `.internal.corp` | `true` |
| TC3b | **Valor límite** — casi-coincidencia de sufijo sin el separador `.` (guarda contra falso positivo tipo "evilinternal.corp") | `http://notinternal.corp/` | `.internal.corp` | `false` |
| TC4 | EC — equivalencia de loopback entre representaciones (`127.0.0.1` vs. `localhost`) | `http://127.0.0.1/` | `localhost` | `true` |
| TC5 | **Valor límite de seguridad** — dirección IPv4-mapeada-a-IPv6 de loopback (caso exacto de `CVE-2026-44492`) | `http://[::ffff:127.0.0.1]/` | `127.0.0.1` | `true` |
| TC6 | **Valor límite** — puerto explícito en la entrada `NO_PROXY` que NO coincide con el puerto real de la request | `https://internal.corp:8443/` | `internal.corp:443` | `false` |
| TC7 | EC — entrada inválida (URL no parseable) → comportamiento *fail-safe* | `not a valid url` | `internal.corp` | `false` |
| TC8a | **Valor límite** — comodín universal | `https://anything.test/` | `*` | `true` |
| TC8b | **Valor límite** — `NO_PROXY` vacío/no definido (límite opuesto a TC8a) | `https://anything.test/` | *(sin definir)* | `false` |

### 2.3 Ejecución real (no simulada) — Node.js contra el archivo del fork

Comando ejecutado (reproducible por el equipo):

```bash
node vv_test_shouldbypassproxy.mjs
```

Script: importa `lib/helpers/shouldBypassProxy.js` directamente, fija `process.env.NO_PROXY` por caso, y compara la salida real contra la esperada.

**Salida real obtenida (2026-07-28):**

```
TC1  | expected=false | actual=false | PASS
TC2  | expected=true  | actual=true  | PASS
TC3  | expected=true  | actual=true  | PASS
TC3b | expected=false | actual=false | PASS
TC4  | expected=true  | actual=true  | PASS
TC5  | expected=true  | actual=true  | PASS
TC6  | expected=false | actual=false | PASS
TC7  | expected=false | actual=false | PASS
TC8a | expected=true  | actual=true  | PASS
TC8b | expected=false | actual=false | PASS
```

**Resultado: 10/10 PASS.** La función se comporta según el contrato especificado en los 10 casos, incluyendo el caso de seguridad más crítico (TC5, la variante exacta del CVE-2026-44492). Esto es evidencia real y reproducible de que la corrección de esa vulnerabilidad está efectivamente presente en el código auditado — no una suposición basada en el número de versión.

## 3. Aplicación de la rúbrica de evaluación de salidas de IA a este paquete V&V

(Rúbrica completa en `07-bitacora-ia.md` §1 — Tabla 4.4 del curso no disponible, se usa sustituto declarado.)

| Criterio | Evaluación |
|---|---|
| Exactitud factual | **Alta** — los 10 resultados no son una afirmación de la IA sin verificar: se ejecutaron realmente contra el archivo fuente y la salida de Node se transcribió sin editar |
| Completitud | **Completa** — cubre los 3 tipos de partición exigidos (match/no-match, formato de entrada válido/inválido, límites de puerto y de representación de dirección) |
| Trazabilidad | **Sí** — cada caso referencia el CVE o el mecanismo de `NO_PROXY` que ejercita |
| Honestidad de incertidumbre | **Sí** — el hallazgo de "falta de docstring público" y la recomendación de nombrar tests con CVE son señaladas explícitamente como juicio del comité, no como hechos medibles |
| Accionabilidad | **Alta** — el script de prueba (`vv_test_shouldbypassproxy.mjs`) es reutilizable tal cual por el equipo para regresión futura |

**Verificación humana pendiente:** Arcenio Adames Tobón (Auditoría Técnica) debe re-ejecutar el comando del §2.3 en su propia máquina antes de radicar, y firmar que obtuvo el mismo resultado 10/10 PASS.
