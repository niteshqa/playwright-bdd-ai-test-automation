# reCAPTCHA handling

reCAPTCHA exists specifically to stop automation, so a test run that hits a reCAPTCHA challenge
cannot get past it. The framework does not try to beat reCAPTCHA. It **detects** it and fails
clearly, so the failure is classified as **ENV** and not mistaken for a bug or a broken selector.

## What `BasePage` does

| Method                               | Purpose                                                                                            |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `checkForRecaptcha()`                | Throws a descriptive `[BasePage:checkForRecaptcha] …` error if a challenge is active or unresolved |
| `_hasRecaptchaChallenge()`           | Is the image-challenge frame (`recaptcha/api2/bframe`) visible?                                    |
| `_hasRecaptchaWidget()`              | Is a reCAPTCHA iframe or `.g-recaptcha` widget on the page?                                        |
| `isRecaptchaBlockingButton(locator)` | Is a challenge overlaying the control we're about to click?                                        |
| `waitForRecaptchaToken(timeout)`     | Was a token issued, e.g. invisible v2/v3 with test keys?                                           |
| `attemptRecaptchaSolve(frame, box)`  | Clicks "I'm not a robot". This succeeds only with test keys.                                       |

Call `await this.checkForRecaptcha()` in a page object just before a submit that is protected by
reCAPTCHA, such as login, registration or checkout.

## Making environments testable (recommended)

Ask the team that owns the app to do one of the following on **non-production** environments:

1. **Use Google's published test keys.** With these keys, verification always succeeds without user
   interaction. See Google's reCAPTCHA FAQ, "I'd like to run automated tests with reCAPTCHA".
2. **Disable reCAPTCHA** on dev and staging, or bypass it for traffic from your test runner.
3. **Allow-list the CI runner's IP addresses.** This is less reliable, because runner IPs change.

Never try to solve production reCAPTCHA automatically. It violates Google's terms, and production
test runs here are read-only anyway.

## Triage

A failure with `reCAPTCHA` in its message is an **ENV** failure (see
[failure-taxonomy.md](failure-taxonomy.md)). Skip the test with a reason, or park it with a
`@fixme<Reason>` tag, and raise the environment configuration with the app team. Do not "heal" the
test.
