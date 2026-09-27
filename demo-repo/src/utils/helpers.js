// VULNERABILITY: Various code quality issues
const crypto = require('crypto');

// QA003: Empty catch
function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch (e) {}
}

// QA008: var usage
var globalConfig = {
  debug: true,
  version: '1.0'
};

// QA002: TODO comment
// TODO: Implement proper rate limiting
// FIXME: This function has a memory leak
function processRequests(requests) {
  // QA001: Deep nesting
  for (let i = 0; i < requests.length; i++) {
    if (requests[i]) {
      if (requests[i].type === 'user') {
        if (requests[i].data) {
          if (requests[i].data.valid) {
            // process...
          }
        }
      }
    }
  }
}

// SEC008: Weak crypto
function generateId() {
  return crypto.createHash('md5').update(Date.now().toString()).digest('hex');
}

module.exports = { safeParse, processRequests, generateId, globalConfig };
