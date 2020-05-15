'use babel';

import { CompositeDisposable } from 'atom';
import JSMidiViewController from './JSMidiViewController';
import JSMidiIconViewController from './JSMidiIconViewController';
import JSMidiLogger from './JSMidiLogger';
import MainView from '../views/MainView';

export default {
  activate () {
    const root = this.getPackageRoot();
    const element = document.createElement('div');

    element.setAttribute('id', 'jsmidi-view');
    element.innerHTML = MainView(root);

    JSMidiLogger.setup(element);

    this.view = new JSMidiViewController({ element });
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      atom.commands.add('atom-workspace', {
        'jsmidi:toggle': () => this.toggle()
      })
    );
  },

  consumeStatusBar (statusBar) {
    this.statusBar = statusBar;
    this.addStatusBarIcon();
  },

  deactivate () {
    const pane = this.getPane();
    const item = this.getItem();

    this.subscriptions.dispose();
    this.icon && this.icon.destroy();
    this.view && this.view.destroy();

    if (pane && item) {
      pane.destroyItem(item);
      this.hide();
    }
  },

  addStatusBarIcon () {
    this.icon = new JSMidiIconViewController({
      onClick: this.toggle.bind(this)
    });

    this.statusBar.addRightTile({
      item: this.icon.element,
      priority: -999
    });
  },

  toggle () {
    this.isOpened() ? this.hide() : this.show();
  },

  show () {
    if (!this.isInDom()) {
      atom.workspace.open(this.view);
    }

    if (!this.view.controller.isConfigured()) {
      this.view.build();
    }

    this.getDock().show();
  },

  hide () {
    this.getDock().hide();
  },

  isOpened () {
    return !!((
      this.view &&
      this.isInDom() &&
      this.getDock().state.visible
    ));
  },

  isInDom () {
    return document.body.contains(this.view.element);
  },

  getDock () {
    return atom.workspace.getRightDock();
  },

  getPane () {
    return this.getDock().getPanes()[0];
  },

  getItem () {
    return this.getPane().items.find((item) => {
      return (item instanceof JSMidiViewController);
    });
  },

  getPackageRoot () {
    return `${atom.packages.packageDirPaths[0]}/jsmidi-atom/`;
  }
};
