/**
 * SchemeSaathi AI - Multi-Channel Notification Manager
 * Handles:
 * - Channel-specific contact validation (RFC Email regex, 10-digit phone)
 * - Subscription & Unsubscription state in localStorage
 * - Reopening alert dispatch simulation
 */

class NotificationManager {
  static EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  static PHONE_REGEX = /^[6-9]\d{9}$/;
  static STORAGE_KEY = 'schemeSaathi_subscriptions';

  static validateContact(channel, inputVal) {
    const val = (inputVal || '').trim();

    if (channel === 'email') {
      if (!val) {
        return { valid: false, message: "Please enter your email address to receive alerts." };
      }
      if (/^\d+$/.test(val)) {
        return { valid: false, message: "Please enter a valid email address (e.g. name@example.com), not numbers." };
      }
      if (!this.EMAIL_REGEX.test(val)) {
        return { valid: false, message: "Please enter a valid email address with '@' and domain (e.g. user@gmail.com)." };
      }
      return { valid: true, value: val };
    }

    if (channel === 'whatsapp' || channel === 'sms') {
      const clean = val.replace(/\D/g, '').replace(/^91/, '');
      if (!clean) {
        return { valid: false, message: `Please enter your 10-digit mobile number for ${channel.toUpperCase()} alerts.` };
      }
      if (!this.PHONE_REGEX.test(clean)) {
        return { valid: false, message: `Please enter a valid 10-digit Indian mobile number for ${channel.toUpperCase()} alerts.` };
      }
      return { valid: true, value: clean };
    }

    if (channel === 'browser') {
      return { valid: true, value: 'device_browser_push' };
    }

    return { valid: false, message: "Please select a valid notification channel." };
  }

  static getSubscriptions() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  static isSubscribed(schemeName) {
    const subs = this.getSubscriptions();
    return !!subs[schemeName];
  }

  static subscribe(schemeName, channel, contact) {
    const check = this.validateContact(channel, contact);
    if (!check.valid) return check;

    const subs = this.getSubscriptions();
    subs[schemeName] = {
      channel,
      contact: check.value,
      subscribedAt: new Date().toISOString()
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(subs));

    return {
      valid: true,
      message: "You're subscribed! We'll notify you as soon as this scheme is back online."
    };
  }

  static unsubscribe(schemeName) {
    const subs = this.getSubscriptions();
    if (subs[schemeName]) {
      delete subs[schemeName];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(subs));
    }
    return {
      success: true,
      message: "You have unsubscribed from updates for this scheme."
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationManager;
}
