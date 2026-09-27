// VULN: Code quality issues for testing

// QA: var usage
var globalCounter = 0;

// QA: Empty catch block
function riskyOperation(data) {
  try {
    return JSON.parse(data);
  } catch (err) {}
}

// QA: Deep nesting (demonstrates complexity issue)
function processRequest(req) {
  if (req) {
    if (req.body) {
      if (req.body.user) {
        if (req.body.user.roles) {
          if (req.body.user.roles.length > 0) {
            if (req.body.user.roles.includes('admin')) {
              if (req.body.user.active) {
                return true;
              }
            }
          }
        }
      }
    }
  }
  return false;
}

// QA: TODO comment
// TODO: add input validation before processing
function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}

// QA: console.log in production code
function fetchUser(id) {
  console.log('Fetching user:', id);
  // FIXME: implement real database lookup
  return { id, name: 'test' };
}

module.exports = { riskyOperation, processRequest, calculateTotal, fetchUser };
