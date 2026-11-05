@regression
Feature: Authentication

  Scenario Outline: Successful login as <user> on <app>
    Given the user navigates to "<app>" website
    When the user logs in as "<user>"
    Then they are signed in
    And the product catalog is displayed

    @regression001
    Examples:
      | app       | user     |
      | saucedemo | standard |

  Scenario Outline: Login is rejected for <credentials> credentials on <app>
    Given the user navigates to "<app>" website
    When the user logs in with the "<credentials>" credentials
    Then the login error "<message>" is displayed

    @regression002
    Examples: locked-out account
      | app       | credentials | message                                    |
      | saucedemo | lockedOut   | Sorry, this user has been locked out.      |

    @regression003
    Examples: wrong password
      | app       | credentials   | message                                                   |
      | saucedemo | wrongPassword | Username and password do not match any user in this service |

    @regression004
    Examples: blank username
      | app       | credentials   | message              |
      | saucedemo | blankUsername | Username is required |

  Scenario Outline: A signed-in user can log out on <app>
    Given the user navigates to "<app>" website
    When the user logs in as "<user>"
    And they log out
    Then the login page is displayed

    @regression005
    Examples:
      | app       | user     |
      | saucedemo | standard |
