@regression
Feature: Checkout

  Scenario Outline: Purchase <products> end to end on <app>
    Given the user navigates to "<app>" website
    When the user logs in as "<user>"
    And their cart is empty
    And they add "<products>" to the cart
    And they open the cart
    And they proceed to checkout
    And they enter the guest contact details
    Then the order overview is displayed
    And the order totals add up
    When they place the order
    Then the order is confirmed
    And the confirmation message "<message>" is displayed

    @regression017 @timeout:180000
    Examples: single item
      | app       | user     | products | message                   |
      | saucedemo | standard | backpack | Thank you for your order! |

    @regression018 @timeout:180000
    Examples: multiple items
      | app       | user     | products                    | message                   |
      | saucedemo | standard | fleeceJacket, redTShirt     | Thank you for your order! |

  Scenario Outline: Checkout requires <field>
    Given the user navigates to "<app>" website
    When the user logs in as "<user>"
    And their cart is empty
    And they add "<product>" to the cart
    And they open the cart
    And they proceed to checkout
    And they enter the "<contact>" contact details
    Then the checkout error "<message>" is displayed

    @regression019
    Examples: first name
      | app       | user     | product  | field      | contact           | message                 |
      | saucedemo | standard | backpack | first name | missingFirstName  | First Name is required  |

    @regression020
    Examples: last name
      | app       | user     | product  | field     | contact          | message                |
      | saucedemo | standard | backpack | last name | missingLastName  | Last Name is required  |

    @regression021
    Examples: postal code
      | app       | user     | product  | field       | contact            | message                  |
      | saucedemo | standard | backpack | postal code | missingPostalCode  | Postal Code is required  |
