@heartbeat
# ─────────────────────────────────────────────────────────────────────────────
# Availability heartbeat (READ-ONLY), run unattended every ~2 hours. Small and fast on purpose —
# the deep journeys live in healthCheck.feature. CI emails only on failure, plus one "RECOVERED"
# mail on the first green run after a red one. Checks keep their @HC### tag so the health matrix
# shows them as HB (covered by the heartbeat).
# ─────────────────────────────────────────────────────────────────────────────
Feature: Heartbeat (availability, read-only)

  Background:
    Given the health check runs against production

  Scenario Outline: Heartbeat The login page renders on <app>
    Given the user navigates to "<app>" website
    Then the login page is displayed

    @heartbeat001 @HC001 @timeout:60000
    Examples:
      | app       |
      | saucedemo |

  Scenario Outline: Heartbeat A registered user can log in on <app>
    Given the user navigates to "<app>" website
    When the user logs in as "<user>"
    Then they are signed in
    And the app logo is displayed

    @heartbeat002 @HC002 @timeout:60000
    Examples:
      | app       | user     |
      | saucedemo | standard |
