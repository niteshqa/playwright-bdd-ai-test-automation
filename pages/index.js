const { BasePage } = require('./BasePage');
const { Header } = require('./components/Header');
const { LoginPage } = require('./LoginPage');
const { InventoryPage } = require('./InventoryPage');
const { ProductPage } = require('./ProductPage');
const { CartPage } = require('./CartPage');
const { CheckoutPage } = require('./CheckoutPage');
const { OrderConfirmationPage } = require('./OrderConfirmationPage');

// Every page object a step can reach, keyed by the name steps use (`pages.<key>`). The `pages`
// fixture (support/fixtures.js) builds one instance of each per test — adding a page is one file
// plus one line here (`npm run new:page -- <Name>` does both).
const pageRegistry = {
  header: Header,
  login: LoginPage,
  inventory: InventoryPage,
  product: ProductPage,
  cart: CartPage,
  checkout: CheckoutPage,
  orderConfirmation: OrderConfirmationPage,
};

module.exports = {
  pageRegistry,
  BasePage,
  Header,
  LoginPage,
  InventoryPage,
  ProductPage,
  CartPage,
  CheckoutPage,
  OrderConfirmationPage,
};
