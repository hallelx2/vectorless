#!/usr/bin/env node
// Mint a short-lived JWT for stress testing the control-plane.
//
// Usage:
//   VLC_OAUTH_JWT_SECRET=... ORG_ID=... USER_ID=... node mint-jwt.js
//
// The secret must match the control-plane's VLC_OAUTH_JWT_SECRET so the
// CP accepts the token through the same verification path as a real
// OAuth-issued JWT.
//
// No deps — uses Node's built-in `crypto`. HS256 only.

const crypto = require('crypto');

const secret = process.env.VLC_OAUTH_JWT_SECRET;
const orgId  = process.env.ORG_ID || 'org_stress_test';
const userId = process.env.USER_ID || 'user_stress_test';
const ttlSec = parseInt(process.env.JWT_TTL || '3600', 10);

if (!secret) {
  console.error('✗ VLC_OAUTH_JWT_SECRET not set. Copy the value from');
  console.error('  deploy/cloudrun/.env (OAUTH_JWT_SECRET).');
  process.exit(1);
}

function b64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

const now = Math.floor(Date.now() / 1000);
const header = { alg: 'HS256', typ: 'JWT' };
const payload = {
  sub: userId,
  org_id: orgId,
  scope: 'documents:read query',
  iat: now,
  exp: now + ttlSec,
  iss: process.env.JWT_ISSUER || 'https://api.vectorless.store',
};

const headerB64 = b64url(JSON.stringify(header));
const payloadB64 = b64url(JSON.stringify(payload));
const signingInput = `${headerB64}.${payloadB64}`;

const signature = crypto
  .createHmac('sha256', secret)
  .update(signingInput)
  .digest('base64')
  .replace(/=/g, '')
  .replace(/\+/g, '-')
  .replace(/\//g, '_');

process.stdout.write(`${signingInput}.${signature}`);
