const { test } = require('@playwright/test');
const path = require('path');
const framework = require('../config/framework.config');

// Shared behaviour for every page object: navigation, overlay/popup dismissal, true/false presence
// checks that wait (instead of sampling), named report steps, and reCAPTCHA awareness. Page classes
// extend this and own their own locators and UI actions.
class BasePage {
  constructor(page) {
    this.page = page;
    this._initPopupHandler();
  }

  _initPopupHandler() {
    this.page.on('popup', async (popup) => {
      // Every page object registers its own handler on the SAME underlying page, so the suppress
      // flag must be global (on the shared Playwright page) — otherwise a sibling page object closes
      // a popup another flow (e.g. a third-party payment login window) is actively driving.
      if (this._suppressPopupClose || (this.page && this.page._suppressPopupClose)) return;
      try {
        await popup.close();
      } catch {
        // popup already closed
      }
    });
  }

  async navigate(url) {
    // Wait only for DOMContentLoaded, not 'load' — heavy ad/analytics scripts can keep 'load' from
    // firing within the navigation timeout. The page is interactive at DOMContentLoaded;
    // handlePopups() settles the rest.
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.handlePopups();
  }

  async screenshot(name) {
    await this.page.screenshot({ path: path.join(framework.screenshotDir, `${name}.png`) });
  }

  async waitFor(selector, timeout = 1000) {
    await this.page.waitForSelector(selector, { timeout });
  }

  // "Does this appear within `timeout`?" — true/false, never throws. Use this for presence checks:
  // locator.isVisible() ignores its timeout option and samples the DOM instantly, so it reports
  // false on a page that is still rendering.
  async isShown(locator, timeout = 12000) {
    return locator
      .waitFor({ state: 'visible', timeout })
      .then(() => true)
      .catch(() => false);
  }

  // A visible copy of `text` (string or RegExp) appears on the page. Visible-only because many
  // apps keep hidden template copies of messages that would otherwise match first.
  async isTextShown(text, timeout = 15000) {
    return this.isShown(this.page.getByText(text).filter({ visible: true }).first(), timeout);
  }

  // The browser reaches a URL matching `pattern` within `timeout` — true/false, never throws.
  async isAtUrl(pattern, timeout = 15000) {
    return this.page
      .waitForURL(pattern, { timeout })
      .then(() => true)
      .catch(() => false);
  }

  currentUrl() {
    return this.page.url();
  }

  // Group several actions under one named step in the report (public methods are already steps —
  // see support/stepLabels.js; this names the phases inside a long one). Plain call outside a test.
  async _step(name, fn) {
    let inTest = false;
    try {
      inTest = !!test.info();
    } catch {
      inTest = false;
    }
    return inTest ? test.step(name, fn) : fn();
  }

  // Clear anything that overlays the page after a navigation: privacy/cookie consent, a generic
  // titled "Close" modal, the app-specific overlays listed in config.dismissers, and a OneTrust
  // banner. Every check is short and no-op when the overlay is absent.
  async handlePopups() {
    try {
      const privacyContainer = this.page.getByLabel(/privacy|cookie/i);
      if (await this.isShown(privacyContainer.first(), 1500)) {
        const acceptBtn = privacyContainer.getByText(/Allow All|Accept All|I Accept/i).first();
        if (await this.isShown(acceptBtn, 1500)) await acceptBtn.click();
      }
    } catch {
      // privacy popup not present
    }

    try {
      const closeBtn = this.page.getByTitle('Close').first();
      if (await this.isShown(closeBtn, 1000)) await closeBtn.click();
    } catch {
      // modal popup not present
    }

    await this.dismissConfiguredOverlays();
    await this.dismissCookieBanner();
  }

  // OneTrust (and look-alike) cookie banners overlay the lower page and can intercept clicks even
  // with force, so accept them. No-op on apps/pages without a banner.
  async dismissCookieBanner() {
    try {
      const btn = this.page
        .locator(
          '#onetrust-accept-btn-handler, #onetrust-banner-sdk button:has-text("Allow All"), button:has-text("Allow All"), button:has-text("Accept All")'
        )
        .first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click({ force: true }).catch(() => {});
        await btn.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});
        return true;
      }
    } catch {
      // no cookie banner present
    }
    return false;
  }

  // App-specific overlays (newsletter/promo modals, chat widgets) declared in
  // config/framework.config.js `dismissers`. Each is closed via its close control — searched in the
  // main document and in iframes, since many marketing tools render inside an injected iframe — and
  // if that fails its `removeSelector` elements are stripped so nothing is left to swallow clicks.
  async dismissConfiguredOverlays() {
    let dismissed = false;
    for (const d of framework.dismissers || []) {
      try {
        let closed = false;
        for (const frame of this.page.frames()) {
          const close = frame.locator(d.selector).first();
          if (await close.isVisible().catch(() => false)) {
            await close.click({ force: true }).catch(() => {});
            closed = true;
            break;
          }
        }
        if (!closed && d.removeSelector) {
          closed = await this.page.evaluate((sel) => {
            const els = document.querySelectorAll(sel);
            els.forEach((el) => el.remove());
            return els.length > 0;
          }, d.removeSelector);
        }
        dismissed = dismissed || closed;
      } catch {
        // overlay not present
      }
    }
    return dismissed;
  }

  async checkForRecaptcha() {
    try {
      const frames = this.page.locator('iframe[title*="reCAPTCHA"], iframe[src*="recaptcha"]');
      const frameCount = await frames.count();

      const challengeActive = await this._hasRecaptchaChallenge();
      if (challengeActive) {
        throw new Error(
          '[BasePage:checkForRecaptcha] reCAPTCHA challenge overlay is active (image tiles visible). ' +
            'Automated testing cannot proceed past a reCAPTCHA challenge. ' +
            'Configure test reCAPTCHA keys (site key: 6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI) to bypass.'
        );
      }

      if (frameCount === 0) {
        const widgetLoaded = await this._hasRecaptchaWidget();
        if (!widgetLoaded) {
          return;
        }
      }

      const frameLocator = this.page.frameLocator(
        'iframe[title*="reCAPTCHA"], iframe[src*="recaptcha"]'
      );

      for (let i = 0; i < frameCount; i += 1) {
        const currentFrame = frameLocator.nth(i);
        const checkbox = currentFrame.getByRole('checkbox', { name: /I'm not a robot/i });

        try {
          if (await checkbox.isVisible({ timeout: 1000 })) {
            const solved = await this.attemptRecaptchaSolve(currentFrame, checkbox);
            if (solved) {
              console.log('✅ reCAPTCHA successfully resolved');
              return;
            }

            throw new Error(
              '[BasePage:checkForRecaptcha] reCAPTCHA verification detected and clicked, ' +
                'but verification was not successful. Automated testing cannot proceed past reCAPTCHA. ' +
                'This indicates either: 1) Test reCAPTCHA keys are not configured, ' +
                '2) Production reCAPTCHA is blocking the test, or 3) reCAPTCHA requires manual solving.'
            );
          }
        } catch (innerError) {
          if (innerError.message.includes('reCAPTCHA')) {
            throw innerError;
          }
          continue;
        }
      }
    } catch (error) {
      if (error.message.includes('reCAPTCHA')) {
        throw error;
      }
    }
  }

  async _hasRecaptchaChallenge() {
    try {
      const challengeFrame = this.page.locator('iframe[src*="recaptcha/api2/bframe"]');
      const challengeCount = await challengeFrame.count();
      if (challengeCount > 0) {
        for (let i = 0; i < challengeCount; i++) {
          if (
            await challengeFrame
              .nth(i)
              .isVisible({ timeout: 1000 })
              .catch(() => false)
          ) {
            return true;
          }
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  async _hasRecaptchaWidget() {
    try {
      await this.page.waitForSelector(
        'iframe[title*="reCAPTCHA"], iframe[src*="recaptcha"], .g-recaptcha',
        { timeout: 5000 }
      );
      return true;
    } catch {
      return false;
    }
  }

  async isRecaptchaBlockingButton(buttonLocator) {
    try {
      const challengeActive = await this._hasRecaptchaChallenge();
      if (!challengeActive) return false;

      const box = await buttonLocator.boundingBox();
      if (!box) return false;

      return true;
    } catch {
      return false;
    }
  }

  async waitForRecaptchaToken(timeout = 3000) {
    try {
      const token = await this.page.evaluate(() => {
        return new Promise((resolve) => {
          if (typeof grecaptcha === 'undefined') {
            resolve(null);
            return;
          }
          const widgets = document.querySelectorAll('.g-recaptcha');
          if (widgets.length === 0) {
            resolve(null);
            return;
          }
          const widgetId = grecaptcha.getResponse ? grecaptcha.getResponse() : null;
          if (widgetId && widgetId !== '') {
            resolve(widgetId);
          } else {
            let attempts = 0;
            const interval = setInterval(() => {
              attempts++;
              const response = grecaptcha.getResponse();
              if (response && response !== '') {
                clearInterval(interval);
                resolve(response);
              } else if (attempts * 200 >= timeout) {
                clearInterval(interval);
                resolve(null);
              }
            }, 200);
          }
        });
      });
      return token !== null && token !== '';
    } catch {
      return false;
    }
  }

  async attemptRecaptchaSolve(recaptchaFrame, checkbox) {
    try {
      // Check initial state
      const initialChecked = await recaptchaFrame
        .getByRole('checkbox', { name: /I'm not a robot/i })
        .evaluate((node) => node.getAttribute('aria-checked') === 'true');

      if (initialChecked) {
        return true; // Already solved
      }

      // Click the checkbox
      await checkbox.click();
      await this.page.waitForTimeout(2000); // Wait for potential animation/verification

      // Verify it was actually checked
      const isChecked = await recaptchaFrame
        .getByRole('checkbox', { name: /I'm not a robot/i })
        .evaluate((node) => node.getAttribute('aria-checked') === 'true');

      if (isChecked) {
        // Wait a bit more for any server-side verification
        await this.page.waitForTimeout(1000);
        return true;
      }

      // If we get here, reCAPTCHA was not resolved
      return false;
    } catch (error) {
      console.log('reCAPTCHA solve attempt failed:', error.message);
      return false;
    }
  }
}

module.exports = { BasePage };
