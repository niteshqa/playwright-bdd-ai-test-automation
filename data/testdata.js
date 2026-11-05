// Single source of test data. Feature files reference entries by KEY (Gherkin Examples cells are
// plain strings); data/resolver.js maps those keys back to these objects. Secrets come from env,
// never from this file.
//
// The users below are the publicly documented demo accounts of www.saucedemo.com (the bundled
// reference app). Replace this file's contents with your own app's data.
const DEMO_PASSWORD = process.env.SAUCE_PASSWORD || 'secret_sauce'; // published on the demo login page

module.exports = {
  users: {
    standard: { username: 'standard_user', password: DEMO_PASSWORD },
    lockedOut: { username: 'locked_out_user', password: DEMO_PASSWORD },
    problem: { username: 'problem_user', password: DEMO_PASSWORD },
    performance: { username: 'performance_glitch_user', password: DEMO_PASSWORD },
    visual: { username: 'visual_user', password: DEMO_PASSWORD },
    // Negative-path fixtures
    unknown: { username: 'no_such_user', password: 'wrong_password' },
    wrongPassword: { username: 'standard_user', password: 'wrong_password' },
    blankUsername: { username: '', password: DEMO_PASSWORD },
  },

  products: {
    backpack: { name: 'Sauce Labs Backpack', price: 29.99 },
    bikeLight: { name: 'Sauce Labs Bike Light', price: 9.99 },
    boltTShirt: { name: 'Sauce Labs Bolt T-Shirt', price: 15.99 },
    fleeceJacket: { name: 'Sauce Labs Fleece Jacket', price: 49.99 },
    onesie: { name: 'Sauce Labs Onesie', price: 7.99 },
    redTShirt: { name: 'Test.allTheThings() T-Shirt (Red)', price: 15.99 },
  },

  // Checkout contact details. Blank fields drive validation scenarios.
  contacts: {
    guest: { firstName: 'Alex', lastName: 'Tester', postalCode: '94105' },
    missingFirstName: { firstName: '', lastName: 'Tester', postalCode: '94105' },
    missingLastName: { firstName: 'Alex', lastName: '', postalCode: '94105' },
    missingPostalCode: { firstName: 'Alex', lastName: 'Tester', postalCode: '' },
  },
};
