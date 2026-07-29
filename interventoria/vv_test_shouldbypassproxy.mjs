import shouldBypassProxy from '../lib/helpers/shouldBypassProxy.js';

const cases = [
  { id: 'TC1', location: 'https://api.example.com/', noProxy: 'internal.corp', expected: false },
  { id: 'TC2', location: 'http://internal.corp/', noProxy: 'internal.corp', expected: true },
  { id: 'TC3', location: 'http://svc.internal.corp/', noProxy: '.internal.corp', expected: true },
  { id: 'TC3b', location: 'http://notinternal.corp/', noProxy: '.internal.corp', expected: false },
  { id: 'TC4', location: 'http://127.0.0.1/', noProxy: 'localhost', expected: true },
  { id: 'TC5', location: 'http://[::ffff:127.0.0.1]/', noProxy: '127.0.0.1', expected: true },
  { id: 'TC6', location: 'https://internal.corp:8443/', noProxy: 'internal.corp:443', expected: false },
  { id: 'TC7', location: 'not a valid url', noProxy: 'internal.corp', expected: false },
  { id: 'TC8a', location: 'https://anything.test/', noProxy: '*', expected: true },
  { id: 'TC8b', location: 'https://anything.test/', noProxy: '', expected: false },
];

for (const c of cases) {
  if (c.noProxy === '') {
    delete process.env.NO_PROXY;
    delete process.env.no_proxy;
  } else {
    process.env.NO_PROXY = c.noProxy;
  }
  let actual;
  try {
    actual = shouldBypassProxy(c.location);
  } catch (e) {
    actual = `THROW: ${e.message}`;
  }
  const pass = actual === c.expected;
  console.log(`${c.id} | location=${c.location} | NO_PROXY=${JSON.stringify(c.noProxy)} | expected=${c.expected} | actual=${actual} | ${pass ? 'PASS' : 'FAIL'}`);
}
