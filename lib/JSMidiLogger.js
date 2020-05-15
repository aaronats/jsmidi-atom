'use babel';

class JSMidiLogger {
  constructor () {
    this.html = {};
  }

  setup (element) {
    this.html.clear = element.querySelector('#jsmidi-logs-clear');
    this.html.container = element.querySelector('#jsmidi-logs-container');

    this.setListeners();
  }

  setListeners () {
    this.html.clear.addEventListener('click', () => {
      this.clear();
    });
  }

  log (msg, {
    type = 'info',
    icon = 'info'
  } = {}) {
    this.html.container.innerHTML += `
      <div class="flex jsmidi-log-${type}">
        <div class="jsmidi-log-icon">
          <i class="icon icon-${icon}"></i>
        </div>
        <div class="jsmidi-log">${msg}</div>
      </div>
    `;
  }

  success (msg) {
    this.log(msg, { type: 'success', icon: 'check' });
  }

  warn (msg) {
    this.log(msg, { type: 'warn', icon: 'issue-opened' });
  }

  error (msg) {
    this.log(msg, { type: 'error', icon: 'alert' });
  }

  clear () {
    this.html.container.innerHTML = '';
  }
}

const instance = new JSMidiLogger();
export default Object.freeze(instance);
