'use babel';

const IconView = require('../views/IconView');

export default class JSMidiIconViewController {
  constructor ({ onClick }) {
    const root = this.getPackageRoot();
    const template = document.createElement('template');

    template.innerHTML = IconView(root);
    this.element = template.content.firstChild;

    this.element.addEventListener('click', () => {
      onClick();
    });
  }

  getPackageRoot () {
    return `${atom.packages.packageDirPaths[0]}/jsmidi-atom/`;
  }

  destroy () {
    this.element.remove();
  }
}
