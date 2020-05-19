'use babel';

import { CompositeDisposable } from 'atom';
import JSMidiLogger from './JSMidiLogger';
import JSMidiController from './JSMidiController';

export default class JSMidiViewController {
  constructor ({ element }) {
    this.element = element;
    this.controller = new JSMidiController();
    this.subscriptions = new CompositeDisposable();
    this.settings = { repeat: false };

    this.setDefaults();
    this.setHTMLSelectors();
    this.addSubscriptions();
  }

  async build () {
    await this.controller.setup();
    this.controller.openProjectFiles();
    this.addEventListeners();
    this.updateProjectView();
    this.showActiveView();
  }

  setDefaults () {
    this.getTitle = () => '';
    this.getIconName = () => 'jsmidi-tab';
    this.getURI = () => 'atom://jsmidi' + Math.random();
    this.getDefaultLocation = () => 'right';
    this.getAllowedLocations = () => ['right'];
  }

  addSubscriptions () {
    this.subscriptions.add(
      atom.commands.add('atom-workspace', {
        'jsmidi:play': () => this.startPlayback(),
        'jsmidi:stop': () => this.stopPlayback()
      })
    );
  }

  setHTMLSelectors () {
    this.html = {
      controls: {
        play: this.element.querySelector('#jsmidi-play'),
        stop: this.element.querySelector('#jsmidi-stop'),
        restart: this.element.querySelector('#jsmidi-restart'),
        reload: this.element.querySelector('#jsmidi-reload')
      },
      timing: {
        bpm: this.element.querySelector('#jsmidi-bpm'),
        bars: this.element.querySelector('#jsmidi-bars'),
        beats: this.element.querySelector('#jsmidi-beats'),
        position: this.element.querySelector('#jsmidi-position')
      },
      tracks: {
        list: this.element.querySelector('#jsmidi-tracks')
      },
      settings: {
        restarts: this.element.querySelector('#jsmidi-restarts'),
        repeat: this.element.querySelector('#jsmidi-repeat'),
        output: this.element.querySelector('#output-select')
      }
    };
  }

  addEventListeners () {
    this.addTrackListeners();
    this.addControlListeners();
    this.addOutputListeners();
    this.addPositionListeners();
    this.addSettingsListeners();

    atom.emitter.on('project-build-success', () => {
      this.updateProjectView();
    });
  }

  addControlListeners () {
    const { controls } = this.html;

    controls.play.addEventListener('click', () => this.startPlayback());
    controls.stop.addEventListener('click', () => this.stopPlayback());
    controls.restart.addEventListener('click', () => this.restartPlayback());
    controls.reload.addEventListener('click', () => this.reloadProject());
  }

  addTrackListeners () {
    const jsmidi = this.controller.getJSMidi();
    const trackList = this.html.tracks.list;

    trackList.addEventListener('click', (e) => {
      if (e.target.classList.contains('jsmidi-mute')) {
        const name = e.target.id.split('-')[1];
        const track = jsmidi.tracks[name];

        if (track) {
          track.muted ? track.unmute() : track.mute();
          this.updateTracks();
        }
      }
    });
  }

  addOutputListeners () {
    const { settings } = this.html;

    settings.output.addEventListener('change', (e) => {
      const id = e.target.value;
      const jsmidi = this.controller.getJSMidi();
      const idx = jsmidi.io.outputs.map(o => o.id).indexOf(id);
      const name = jsmidi.io.output ? jsmidi.io.output.name : 'undefined';

      jsmidi.io.setOutput(idx);
      JSMidiLogger.log(`Output set to ${name}`);
    });
  }

  addPositionListeners () {
    const { timing, controls } = this.html;
    const jsmidi = this.controller.getJSMidi();

    jsmidi.loop.events.on('position', (position) => {
      if (jsmidi.loop.form.hasParts()) {
        const part = jsmidi.loop.form.getPart(
          position.split(':')[0]
        );

        if (part) {
          timing.bars.innerHTML = part.bars;
          timing.beats.innerHTML = part.beats;
        }
      }

      timing.position.innerHTML = position;
    });

    jsmidi.loop.events.on('stop', () => {
      controls.play.classList.remove('active');
      timing.position.innerHTML = '1:1:1';
      this.updateForm();
    });
  }

  addSettingsListeners () {
    const { settings } = this.html;

    settings.repeat.addEventListener('change', (e) => {
      e.target.checked ? this.enableRepeat() : this.disableRepeat();
    });
  }

  startPlayback () {
    const { controls } = this.html;
    const jsmidi = this.controller.getJSMidi();

    controls.play.classList.add('active');
    jsmidi.loop.start(jsmidi.io.now());
  }

  stopPlayback () {
    const jsmidi = this.controller.getJSMidi();

    jsmidi.loop.stop();

    this.settings.repeat
      ? jsmidi.loop.enableRepeat()
      : jsmidi.loop.disableRepeat();
  }

  restartPlayback () {
    this.stopPlayback();
    this.startPlayback();
  }

  reloadProject () {
    JSMidiLogger.clear();
    JSMidiLogger.log('Rebuilding project...');
    this.controller.resetProject();
  }

  updateProjectView () {
    this.updateOutput();
    this.updateTracks();
    this.updateRepeat();
    this.updateTempo();
    this.updateForm();
  }

  updateTracks () {
    const trackList = this.html.tracks.list;
    const jsmidi = this.controller.getJSMidi();

    let rows = '';

    Object.keys(jsmidi.tracks).forEach(key => {
      const track = jsmidi.tracks[key];
      const rests = Object.keys(track.rests).length;
      const muted = track.muted ? 'mute' : 'unmute';
      rows += `
        <tr class="jsmidi-track">
          <td class="jsmidi-track-action">
            <i id="mute-${track.name}" class="jsmidi-mute icon icon-${muted}"></i>
          </td>
          <td>${track.name}</td>
          <td>${track.channel}</td>
          <td>${rests}</td>
        </tr>
      `;
    });

    trackList.innerHTML = '';
    trackList.innerHTML += `
      <table id="jsmidi-tracks-table">
        <thead>
          <th></th>
          <th>Name</th>
          <th>Midi Channel</th>
          <th>Rests Count</th>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  updateOutput () {
    const { settings } = this.html;
    const jsmidi = this.controller.getJSMidi();

    settings.output.innerHTML = '<option value="0">--Select--</option>';
    jsmidi.io.outputs.forEach(op => {
      const selected = jsmidi.io.output.id === op.id ? 'selected' : '';
      settings.output.innerHTML += `
        <option value="${op.id}" ${selected}>
          ${op.manufacturer} - ${op.name}
        </option>
      `;
    });
  }

  updateRepeat () {
    const { settings } = this.html;
    const jsmidi = this.controller.getJSMidi();

    settings.restarts.innerHTML = `Max: ${jsmidi.loop.maxRestarts} restarts`;

    // Repeat from the UI takes precedent.
    if (this.settings.repeat === true) {
      jsmidi.loop.enableRepeat();
    } else {
      if (jsmidi.loop.repeat) {
        this.settings.repeat = true;
        settings.repeat.setAttribute('checked', true);
      } else {
        this.settings.repeat = false;
        settings.repeat.removeAttribute('checked');
      }
    }
  }

  updateForm () {
    const { timing } = this.html;
    const jsmidi = this.controller.getJSMidi();

    if (jsmidi.loop.form.hasParts()) {
      const part = jsmidi.loop.form.getPart(0);

      if (part) {
        timing.bars.innerHTML = part.bars;
        timing.beats.innerHTML = part.beats;
      }
    } else {
      timing.bars.innerHTML = jsmidi.loop.form.bars;
      timing.beats.innerHTML = jsmidi.loop.form.beats;
    }
  }

  updateTempo () {
    const { timing } = this.html;
    const jsmidi = this.controller.getJSMidi();

    timing.bpm.innerHTML = jsmidi.loop.bpm;
  }

  enableRepeat () {
    const jsmidi = this.controller.getJSMidi();

    jsmidi.loop.enableRepeat();
    this.settings.repeat = true;
  }

  disableRepeat () {
    const jsmidi = this.controller.getJSMidi();

    jsmidi.loop.disableRepeat();
    this.settings.repeat = false;
  }

  showActiveView () {
    this.element.querySelector('#jsmidi-active').style.display = 'block';
    this.element.querySelector('#jsmidi-inactive').style.display = 'none';
  }

  showInactiveView () {
    this.element.querySelector('#jsmidi-active').style.display = 'none';
    this.element.querySelector('#jsmidi-inactive').style.display = 'block';
  }

  destroy () {
    this.element.remove();
    this.subscriptions.dispose();
  }
}
