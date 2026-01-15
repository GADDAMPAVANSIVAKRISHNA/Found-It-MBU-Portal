// Helpers for canonicalizing and mapping item status values across collections

const Found = {
  UNCLAIMED: 'Unclaimed',
  CLAIMED: 'Claimed',
  VERIFIED: 'Verified',
  RETURNED: 'Returned',
  EXPIRED: 'Expired',
  UNDER_REVIEW: 'Under Review',
};

const Lost = {
  ACTIVE: 'Active',
  FOUND: 'Found',
  RESOLVED: 'Resolved',
  EXPIRED: 'Expired',
  UNDER_REVIEW: 'Under Review',
};

const normalizeFoundStatus = (s) => {
  if (!s) return Found.UNCLAIMED;
  const v = String(s).trim();
  if (/^claimed$/i.test(v)) return Found.CLAIMED;
  if (/^returned$/i.test(v)) return Found.RETURNED;
  if (/^verified$/i.test(v)) return Found.VERIFIED;
  if (/^expired$/i.test(v)) return Found.EXPIRED;
  if (/^frozen$/i.test(v)) return Found.UNDER_REVIEW;
  // treat 'active' or 'unclaimed' as unclaimed
  if (/^active$/i.test(v) || /^unclaimed$/i.test(v)) return Found.UNCLAIMED;
  return v; // unknown values pass-through; migration will correct
};

const normalizeLostStatus = (s) => {
  if (!s) return Lost.ACTIVE;
  const v = String(s).trim();
  if (/^found$|^claimed$/i.test(v)) return Lost.FOUND;
  if (/^returned$/i.test(v)) return Lost.RESOLVED; // map returned -> resolved
  if (/^resolved$/i.test(v)) return Lost.RESOLVED;
  if (/^expired$/i.test(v)) return Lost.EXPIRED;
  if (/^frozen$/i.test(v)) return Lost.UNDER_REVIEW;
  return v; // unknown
};

const isFoundClaimable = (status) => normalizeFoundStatus(status) === Found.UNCLAIMED;

module.exports = {
  Found,
  Lost,
  normalizeFoundStatus,
  normalizeLostStatus,
  isFoundClaimable,
};