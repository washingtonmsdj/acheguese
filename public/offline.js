(() => {
  const DEFAULT_CONTACTS = {
    portaria: '(27) 3333-4444',
    sindico: '(27) 9999-8888',
  };

  function textValue(value, fallback = '') {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  function renderStatus(isOnline) {
    const statusElement = document.getElementById('status');
    if (!statusElement) return;

    statusElement.className = isOnline ? 'status online' : 'status';
    statusElement.replaceChildren();

    const dot = document.createElement('span');
    dot.className = 'pulse-dot';
    dot.setAttribute('aria-hidden', 'true');
    statusElement.append(dot, document.createTextNode(isOnline ? ' Conexao restaurada!' : ' Voce esta offline'));
  }

  function goHomeSoon() {
    window.setTimeout(() => {
      window.location.assign('/');
    }, 1000);
  }

  function updateConnectionStatus() {
    renderStatus(navigator.onLine);
    if (navigator.onLine) {
      goHomeSoon();
    }
  }

  function renderAlerts(alerts) {
    const alertsContainer = document.getElementById('alerts-container');
    const alertsList = document.getElementById('alerts-list');
    if (!alertsContainer || !alertsList || !Array.isArray(alerts) || alerts.length === 0) {
      return;
    }

    alertsContainer.hidden = false;
    alertsList.replaceChildren();

    alerts.forEach((alert) => {
      const item = document.createElement('div');
      item.className = 'info-item';

      const title = document.createElement('span');
      title.className = 'info-label';
      title.textContent = textValue(alert?.title, 'Aviso');

      const date = document.createElement('span');
      date.className = 'info-value';
      date.textContent = textValue(alert?.date, 'Sem data');

      item.append(title, date);
      alertsList.append(item);
    });
  }

  async function loadCriticalData() {
    setText('portaria-phone', DEFAULT_CONTACTS.portaria);
    setText('sindico-phone', DEFAULT_CONTACTS.sindico);

    if (!('caches' in window)) {
      return;
    }

    try {
      const cache = await caches.open('localconnect-critical-v1');
      const contactsResponse = await cache.match('/offline-data/emergency-contacts');

      if (contactsResponse) {
        const contacts = await contactsResponse.json();
        setText('portaria-phone', textValue(contacts?.portaria, DEFAULT_CONTACTS.portaria));
        setText('sindico-phone', textValue(contacts?.sindico, DEFAULT_CONTACTS.sindico));
      }

      const alertsResponse = await cache.match('/offline-data/important-alerts');
      if (alertsResponse) {
        renderAlerts(await alertsResponse.json());
      }
    } catch (error) {
      console.error('Erro ao carregar dados criticos:', error);
    }
  }

  function tryReconnect() {
    if (navigator.onLine) {
      window.location.assign('/');
      return;
    }

    window.alert('Ainda sem conexao. Tente novamente em alguns instantes.');
  }

  window.addEventListener('online', updateConnectionStatus);
  window.addEventListener('offline', updateConnectionStatus);
  window.setInterval(updateConnectionStatus, 5000);

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('reconnect-button')?.addEventListener('click', tryReconnect);
    updateConnectionStatus();
    void loadCriticalData();
  });
})();
