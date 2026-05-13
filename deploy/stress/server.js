// k6 stress test — server hot path (/v1/query)
//
// Hits vectorless-server directly with the upstream bearer token,
// bypassing the control-plane to measure raw engine retrieval latency.
//
// Run: SERVER_URL=https://... VLS_API_KEY=... DOC_ID=... k6 run server.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const queryLatency = new Trend('query_latency', true);
const queryErrors = new Rate('query_errors');

export const options = {
  // 5-min run: 0 → 10 VUs (warmup), → 50 VUs (peak), → 0 (cool-down).
  stages: [
    { duration: '60s', target: 10 },
    { duration: '180s', target: 50 },
    { duration: '60s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000', 'p(99)<6000'],
    http_req_failed:   ['rate<0.01'],
    query_errors:      ['rate<0.01'],
  },
};

const SERVER_URL = __ENV.SERVER_URL || 'http://localhost:8080';
const API_KEY = __ENV.VLS_API_KEY || '';
const DOC_ID = __ENV.DOC_ID || '';

if (!DOC_ID) {
  throw new Error('Set DOC_ID env var to an existing document ID in your workspace.');
}

const QUERIES = [
  'What is the main argument?',
  'Summarize the methods section.',
  'What are the limitations of this approach?',
  'Compare the results across experiments.',
  'What future work is proposed?',
  'List the key contributions.',
  'How does this relate to prior work?',
  'What datasets were used?',
];

export default function () {
  const query = QUERIES[Math.floor(Math.random() * QUERIES.length)];

  const payload = JSON.stringify({
    doc_id: DOC_ID,
    query,
    strategy: 'chunked-tree',
  });

  const headers = {
    'Content-Type': 'application/json',
  };
  if (API_KEY) {
    headers['Authorization'] = `Bearer ${API_KEY}`;
  }

  const res = http.post(`${SERVER_URL}/v1/query`, payload, { headers, timeout: '120s' });

  queryLatency.add(res.timings.duration);

  const ok = check(res, {
    'status is 200': (r) => r.status === 200,
    'has answer': (r) => {
      try { return JSON.parse(r.body).answer !== undefined; }
      catch { return false; }
    },
  });
  queryErrors.add(!ok);

  // Soft cap to ~1 query/sec/VU so we don't accidentally DoS our LLM
  // budget. Tune up once you know your numbers.
  sleep(1);
}
