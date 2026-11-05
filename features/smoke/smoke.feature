@smoke
Feature: Smoke — the critical path is alive

  Scenario Outline: Login, add to cart and reach checkout on <app>
    Given the user navigates to "<app>" website
    When the user logs in as "<user>"
    And their cart is empty
    And they add "<product>" to the cart
    And they open the cart
    And they proceed to checkout
    And they enter the guest contact details
    Then the order overview is displayed

    @smoke001
    Examples:
      | app       | user     | product  |
      | saucedemo | standard | backpack |
