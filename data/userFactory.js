// Fresh, never-before-used registration users for apps with sign-up flows. The timestamp suffix
// guarantees uniqueness, so "create account" scenarios never collide with a recycled address.
// TEST_EMAIL_DOMAIN should be a catch-all or disposable inbox domain your team controls.
const ADJECTIVES = ['happy', 'swift', 'bright', 'clever', 'bold', 'calm', 'eager', 'keen', 'wise'];
const NOUNS = ['eagle', 'tiger', 'wolf', 'hawk', 'lion', 'fox', 'owl', 'falcon', 'raven'];
const FIRST_NAMES = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller'];

const pick = (list) => list[Math.floor(Math.random() * list.length)];

function createNewUser({ domain = process.env.TEST_EMAIL_DOMAIN || 'example.com' } = {}) {
  const prefix = `${pick(ADJECTIVES)}.${pick(NOUNS)}${Math.floor(10 + Math.random() * 90)}`;
  const user = {
    firstName: pick(FIRST_NAMES),
    lastName: pick(LAST_NAMES),
    email: `${prefix}.${Date.now().toString(36)}@${domain}`,
    phone: `555${String(Math.floor(1000000 + Math.random() * 8999999))}`,
  };
  console.log(`  [NewUser] ${user.firstName} ${user.lastName} <${user.email}>`);
  return user;
}

module.exports = { createNewUser };
