const assert = require('assert');
const { formatDate } = require('../utils');

// Basic tests for formatDate
(function(){
  // Valid ISO
  const iso = '2023-01-25T12:00:00Z';
  const out = formatDate(iso);
  assert.strictEqual(out, '25 Jan 2023');

  // Invalid input returns the input
  const bad = 'not-a-date';
  const out2 = formatDate(bad);
  assert.strictEqual(out2, bad);

  // Empty returns empty
  const out3 = formatDate('');
  assert.strictEqual(out3, '');

  console.log('formatDate tests passed');
})();
