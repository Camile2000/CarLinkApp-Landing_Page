/**
 * Safe replacement for setUpFuseboxReactDevToolsDispatcher.
 * The original file defines __FUSEBOX_REACT_DEVTOOLS_DISPATCHER__ with
 * writable:false, which crashes on HMR reloads ("property is not writable").
 * This version only defines it if it doesn't already exist.
 */

class EventScope {
  constructor() {
    this._listeners = new Set();
  }
  addEventListener(listener) {
    this._listeners.add(listener);
  }
  removeEventListener(listener) {
    this._listeners.delete(listener);
  }
  emit(value) {
    for (const listener of this._listeners) {
      listener(value);
    }
  }
}

class Domain {
  constructor(name) {
    this.name = name;
    this.onMessage = new EventScope();
  }
  sendMessage(message) {
    const binding = global[FuseboxReactDevToolsDispatcher.BINDING_NAME];
    if (binding != null) {
      binding(JSON.stringify({domain: this.name, message}));
    }
  }
}

class FuseboxReactDevToolsDispatcher {
  static BINDING_NAME = '__CHROME_DEVTOOLS_FRONTEND_BINDING__';
  static onDomainInitialization = new EventScope();
  static _domains = new Map();

  static initializeDomain(domainName) {
    const domain = new Domain(domainName);
    this._domains.set(domainName, domain);
    this.onDomainInitialization.emit(domain);
    return domain;
  }

  static sendMessage(domainName, message) {
    const domain = this._domains.get(domainName);
    if (domain == null) return;
    try {
      domain.onMessage.emit(JSON.parse(message));
    } catch (err) {
      console.error('FuseboxDevTools sendMessage error:', err);
    }
  }
}

if (!Object.getOwnPropertyDescriptor(global, '__FUSEBOX_REACT_DEVTOOLS_DISPATCHER__')) {
  Object.defineProperty(global, '__FUSEBOX_REACT_DEVTOOLS_DISPATCHER__', {
    value: FuseboxReactDevToolsDispatcher,
    configurable: false,
    enumerable: false,
    writable: false,
  });
}
