import React from 'react';

const STATUS_MAP = {
  'Unclaimed': { text: 'Unclaimed', className: 'bg-blue-100 text-blue-700' },
  'Active': { text: 'Active', className: 'bg-blue-100 text-blue-700' },
  'Claimed': { text: 'Claimed', className: 'bg-orange-100 text-orange-700' },
  'Found': { text: 'Found', className: 'bg-orange-100 text-orange-700' },
  'Verified': { text: 'Verified', className: 'bg-purple-100 text-purple-700' },
  'Returned': { text: 'Returned', className: 'bg-green-100 text-green-700' },
  'Resolved': { text: 'Resolved', className: 'bg-green-100 text-green-700' },
  'Expired': { text: 'Expired', className: 'bg-gray-100 text-gray-700' },
  'Under Review': { text: 'Under Review', className: 'bg-yellow-100 text-yellow-800' }
};

const StatusBadge = ({ status }) => {
  if (!status) return null;
  const s = STATUS_MAP[status] || { text: status, className: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs ${s.className}`}>{s.text}</span>
  );
};

export default StatusBadge;