// k6 stress test — control-plane proxy path (real OAuth + reverse-proxy)
//
// Sends queries through the control-plane's /v1/query proxy with a
// bearer JWT, exercising:
//   - JWT validation
//   - quota / rate-limit middleware
//   - reverse-proxy to upstream server
//   - response streaming
//
// Run: CP_URL=https://api.vectorless.store JWT=... DOC_ID=... k6 run control-plane.js
//
// Mint a JWT with deploy/stress/mint-jwt.js (uses VLC_OAUTH_JWT_SECRET).

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const e2eLatency = new Trend('e2e_latency', true);
const e2eErrors = new Rate('e2e_errors');

export const options = {
  stages: [
    { duration: '60s', target: 10 },
    { duration: '240s', target: 30 },
    { duration: '60s', target: 0 },
  ],
  thresholds: {
    // CP adds auth + proxy hops, so we allow more headroom than the
    // direct server test.
    http_req_duration: ['p(95)<4000', 'p(99)<8000'],
    http_req_failed:   ['rate<0.02'],
    e2e_errors:        ['rate<0.02'],
  },
};

const CP_URL = __ENV.CP_URL || 'http://localhost:9090';
const JWT = __ENV.JWT || '';
const DOC_ID = __ENV.DOC_ID || '';

if (!JWT || !DOC_ID) {
  throw new Error('Set JWT and DOC_ID env vars before running.');
}

const QUERIES = [
  'What is the main argument?',
  'Summarize the methods section.',
  'What are the limitations of this approach?',
  'Compare the results across experiments.',
];

export default function () {
  const query = QUERIES[Math.floor(Math.random() * QUERIES.length)];

  const res = http.post(
    `${CP_URL}/v1/query`,
    JSON.stringify({ doc_id: DOC_ID, query }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${JWT}`,
      },
      timeout: '120s',
    }
  );

  e2eLatency.add(res.timings.duration);

  const ok = check(res, {
    'status is 200': (r) => r.status === 200,
    'auth not rejected': (r) => r.status !== 401 && r.status !== 403,
  });
  e2eErrors.add(!ok);

  sleep(1);
}
