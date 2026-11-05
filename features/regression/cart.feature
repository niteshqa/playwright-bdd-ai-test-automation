@regression
Feature: Shopping cart

  Scenario Outline: Add <products> to the cart
    Given the user navigates to "<app>" website
    When the user logs in as "<user>"
    And their cart is empty
    And they add "<products>" to the cart
    Then the cart badge shows <count>
    When they open the cart
    Then the cart contains "<products>"

    @regression013
    Examples: one item
      | app       | user     | products | count |
      | saucedemo | standard | backpack | 1     |

    @regression014
    Examples: several items
      | app       | user     | products                         | count |
      | saucedemo | standard | backpack, bikeLight, onesie      | 3     |

  Scenario Outline: Add <product> from the product details page
    Given the user navigates to "<app>" website
    When the user logs in as "<user>"
    And their cart is empty
    And they open the "<product>" product
    And they add the product to the cart from its details page
    Then the cart badge shows 1

    @regression015
    Examples:
      | app       | user     | product   |
      | saucedemo | standard | bikeLight |

  Scenario Outline: Remove <product> from the cart
    Given the user navigates to "<app>" website
    When the user logs in as "<user>"
    And their cart is empty
    And they add "<product>" to the cart
    And they open the cart
    And they remove "<product>" from the cart
    Then the cart is empty
    And the cart badge shows 0

    @regression016
    Examples:
      | app       | user     | product      |
      | saucedemo | standard | boltTShirt   |
