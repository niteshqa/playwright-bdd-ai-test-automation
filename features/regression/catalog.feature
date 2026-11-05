@regression
Feature: Product catalog

  Scenario Outline: The catalog lists every product with a name and price on <app>
    Given the user navigates to "<app>" website
    When the user logs in as "<user>"
    Then the catalog lists <count> products
    And every product shows a name and a price

    @regression006
    Examples:
      | app       | user     | count |
      | saucedemo | standard | 6     |

  Scenario Outline: Sort the catalog by <option>
    Given the user navigates to "<app>" website
    When the user logs in as "<user>"
    And they sort the catalog by "<option>"
    Then the products are sorted by "<field>" "<order>"

    @regression007
    Examples: Name (A to Z)
      | app       | user     | option        | field | order     |
      | saucedemo | standard | Name (A to Z) | name  | ascending |

    @regression008
    Examples: Name (Z to A)
      | app       | user     | option        | field | order      |
      | saucedemo | standard | Name (Z to A) | name  | descending |

    @regression009
    Examples: Price (low to high)
      | app       | user     | option              | field | order     |
      | saucedemo | standard | Price (low to high) | price | ascending |

    @regression010
    Examples: Price (high to low)
      | app       | user     | option              | field | order      |
      | saucedemo | standard | Price (high to low) | price | descending |

  Scenario Outline: Product details for <product>
    Given the user navigates to "<app>" website
    When the user logs in as "<user>"
    And they open the "<product>" product
    Then the product details show its name, description and price

    @regression011
    Examples:
      | app       | user     | product      |
      | saucedemo | standard | fleeceJacket |

  # A parked scenario: the custom @fixme<Reason> tag records WHY in the report (support/hooks.js).
  Scenario Outline: Product images are unique for <user>
    Given the user navigates to "<app>" website
    When the user logs in as "<user>"
    Then every product shows a name and a price

    @regression012 @fixmeDemo
    Examples:
      | app       | user    |
      | saucedemo | problem |
