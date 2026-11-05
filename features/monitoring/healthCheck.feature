@healthCheck
# ─────────────────────────────────────────────────────────────────────────────
# Daily health check (READ-ONLY): one scenario per @HC### check in config/health-matrix.json.
# After the run, `npm run health:matrix` turns the results into reports/health-matrix.xlsx.
# Never places an order — checkout stops at the overview; "they place the order" is guarded anyway.
# Targets production by default (HEALTH_CHECK_ENV=staging to dry-run).
# ─────────────────────────────────────────────────────────────────────────────
Feature: Daily health check (read-only)

  Background:
    Given the health check runs against production

  Scenario Outline: HC The catalog lists products with name and price on <app>
    Given the user navigates to "<app>" website
    When the user logs in as "<user>"
    Then every product shows a name and a price

    @HC003
    Examples:
      | app       | user     |
      | saucedemo | standard |

  Scenario Outline: HC Catalog sorting works on <app>
    Given the user navigates to "<app>" website
    When the user logs in as "<user>"
    And they sort the catalog by "Price (low to high)"
    Then the products are sorted by "price" "ascending"

    @HC004
    Examples:
      | app       | user     |
      | saucedemo | standard |

  Scenario Outline: HC The product detail page opens from the catalog on <app>
    Given the user navigates to "<app>" website
    When the user logs in as "<user>"
    And they open the "<product>" product
    Then the product details show its name, description and price

    @HC005
    Examples:
      | app       | user     | product  |
      | saucedemo | standard | backpack |

  Scenario Outline: HC Add to cart updates the cart badge on <app>
    Given the user navigates to "<app>" website
    When the user logs in as "<user>"
    And their cart is empty
    And they add "<product>" to the cart
    Then the cart badge shows 1

    @HC006
    Examples:
      | app       | user     | product   |
      | saucedemo | standard | bikeLight |

  Scenario Outline: HC Checkout reaches the order overview on <app>
    Given the user navigates to "<app>" website
    When the user logs in as "<user>"
    And their cart is empty
    And they add "<product>" to the cart
    And they open the cart
    And they proceed to checkout
    And they enter the guest contact details
    Then the order overview is displayed

    @HC007
    Examples:
      | app       | user     | product  |
      | saucedemo | standard | backpack |
