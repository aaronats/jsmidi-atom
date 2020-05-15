'use babel';

import fs from 'fs';
import vm from 'vm';
import JSMidiLogger from './JSMidiLogger';

/**
* This is the main controller used to interface with a
* JSMidi Project.
*/
export default class JSMidiController {
  constructor () {
    this.midi = null;
    this.time = null;
    this.root = null;
    this.config = null;
    this.error = null;
    this.project = null;
    this.source = [null, null];
  }

  /**
  * Sets up the project root, configuration and paths.
  * We add the root path and node_modules to the require path
  * so that require works in source that is eval-ed.
  */
  setup () {
    this.root = this.getRoot();
    this.config = this.getConfig();

    if (!this.root || !this.config) {
      return;
    }

    require.main.paths.push(this.root);
    require.main.paths.push(`${this.root}/node_modules`);

    return this.enableWebMidiAPI();
  }

  /**
  * Returns the JSMidi project's root folder from the Atom
  * workspace object. This only works if the project is at
  * the root/top of the Atom workspace tree.
  */
  getRoot () {
    return atom.workspace.project.rootDirectories[0]
      ? atom.workspace.project.rootDirectories[0].path
      : null;
  }

  /**
  * Returns the JSMidi configuration from the config file.
  */
  getConfig () {
    const file = 'jsmidi.config.json';

    if (!this.fileExists(file)) {
      return null;
    }

    const json = this.getSource(file);
    return JSON.parse(json);
  }

  /**
  * Sets up access to the Web Midi API since Atom is just a
  * V8 and Chromium browser. We also get the window's
  * performance time object for scheduling midi events.
  */
  enableWebMidiAPI () {
    JSMidiLogger.log('Loading the Web Midi API...');
    return navigator.requestMIDIAccess().then((midi) => {
      JSMidiLogger.success('Web Midi API enabled.');

      this.midi = midi;
      this.time = window.performance;

      this.buildProject();
      this.reloadOnSave();
    }).catch((err) => {
      JSMidiLogger.error('Failed to load the Web Midi API.');
      console.log(err);
    });
  }

  /**
  * Watches the active text editor's current buffer for onSave events.
  * If the file matches the project or live file we rebuild live
  * or reload the project.
  */
  reloadOnSave () {
    atom.workspace.observeActiveTextEditor((editor) => {
      if (!editor) { return; }

      // This is a to fix what seems to be a bug with
      // the active text observer continuing to add
      // onDidSave observers and firing multiple times.
      if (this.buffer) {
        this.buffer.dispose();
      }

      // Get the current buffer and return the event observer
      // so we can dispose above if already exists.
      const buffer = editor.getBuffer();
      this.buffer = buffer.onDidSave(() => {
        const file = editor.getTitle();
        const [, ext] = file.split('.');

        if (ext === 'js') {
          if (file === this.config.project) {
            const jsmidi = this.getJSMidi();

            if (jsmidi) {
              jsmidi.loop.stop();
              jsmidi.reset();
            }

            JSMidiLogger.clear();
            this.buildProject();
          }

          if (file === this.config.live) {
            JSMidiLogger.clear();
            this.buildLive();
          }
        }
      });
    });
  }

  /**
  * Resets the JSMidiController and builds the project from the
  * project file. We then let our listeners know the project file
  * built sucessfully and move on to the live file.
  */
  buildProject () {
    this.reset(); // start fresh

    const file = this.config.track || 'Project.js';
    const src = this.getSource(file);

    try {
      /* eslint-disable-next-line */
      const Project = new Function(src)();
      this.project = new Project(this.midi, this.time);

      JSMidiLogger.success('Project file loaded successfully.');

      this.buildLive();
    } catch (err) {
      this.handleBuildError(err, src, file);
      console.error(err);
    }
  }

  /**
  * Builds the live file from source and calls the reload function
  * so that changes are reflected on the next beat if live coding.
  */
  buildLive () {
    const file = this.config.live || 'Live.js';
    const src = this.getSource(file);

    try {
      if (this.shouldReloadSource(src)) {
        /* eslint-disable-next-line */
        const Live = new Function(src)();
        Live.reload();

        // Source is clean.
        this.source[1] = src;
        this.error = null;

        atom.emitter.emit('project-build-success');
        JSMidiLogger.success('Live file loaded successfully.');
      } else {
        JSMidiLogger.log('No changes to live file.');
      }
    } catch (err) {
      // Source is dirty.
      this.source[0] = src;
      this.error = err.message;
      this.fallbackToCleanSource();
      this.handleBuildError(err, src, file);
    }
  }

  /**
  * Since line numbers don't generally come with an error in
  * eval-ed code we try to find one from the stack. Otherwise
  * we parse the source with the vm.Script to see if we get a
  * line number from there.
  *
  * You may be asking why not just run the code with vm instead?
  * Well, eval is significantly faster than vm. Adding that overhead
  * is not ideal since it could delay the changes we want to take effect.
  * Also, we do not run the code with vm just parse it to get the error.
  */
  handleBuildError (err, src, file) {
    let line;
    const anonymous = err.stack.match(/<anonymous>(:[0-9])\w+/);

    if (anonymous) {
      line = Number(anonymous[0].split(':')[1]) - 2;
    } else {
      try {
        /* eslint-disable-next-line */
        new vm.Script(src, `${this.root}/${file}`);
      } catch (e) {
        const regex = new RegExp(file + '(:[0-9])\\w+');
        line = e.stack.match(regex)[0].split(':')[1];
      }
    }

    JSMidiLogger.error(`${err.name}: ${err.message} (${file}) at line: ${line}`);
    console.error(err);
  }

  /**
  * Compares the new soruce to the previous. If there is an error we
  * compare against the dirty because it was the previous code evaluated.
  * Otherwise we compare against the clean source.
  */
  shouldReloadSource (src) {
    const [dirty, clean] = this.source;
    if (this.error !== null) {
      return dirty !== src;
    }
    return clean !== src;
  }

  /**
  * If we have clean source from a previous load then we fallback
  * on that so the playback does not stop. If we do not have clean
  * source then we just stop.
  */
  fallbackToCleanSource () {
    const [, clean] = this.source;
    if (clean) {
      /* eslint-disable-next-line */
      const Live = new Function(clean)();
      Live.reload();
    } else {
      const jsmidi = this.getJSMidi();
      jsmidi.loop.stop();
    }
  }

  /**
  * Returns the project.
  */
  getProject () {
    return this.project;
  }

  /**
  * Returns JSMidi if we have a project.
  */
  getJSMidi () {
    return this.project !== null ? this.project.jsmidi : null;
  }

  /**
  * Determines if the current workspace is a JSMidi project
  * by looking for a valid config.
  */
  isConfigured () {
    return (
      this.root !== null &&
      this.config !== null
    );
  }

  openProjectFiles () {
    if (this.root && this.config) {
      atom.workspace.open(`${this.root}/${this.config.project}`, {
        split: 'left', location: 'left'
      });
      atom.workspace.open(`${this.root}/${this.config.live}`, {
        split: 'right', location: 'right'
      });
    }
  }

  /**
  * Resets the controller.
  */
  reset () {
    this.error = null;
    this.project = null;
    this.source = [null, null];
  }

  /**
  * Gets contents of a file.
  */
  getSource (file) {
    return fs.readFileSync(`${this.root}/${file}`, 'utf8');
  }

  /**
  * Checks to see if a file exists.
  */
  fileExists (file) {
    return fs.existsSync(`${this.root}/${file}`);
  }
}
