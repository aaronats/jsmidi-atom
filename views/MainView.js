module.exports = (root) => {
  return `
    <div id="jsmidi-inactive">
      <img src="${root}/assets/jsmidi-icon.svg" height="24" alt="jsmidi-icon">
      <div>
        This workspace is not a JSMidi project. Please open a JSMidi project or create
        a new project with the jsmidi-cli. For more information please visit the
        JSMidi project <a href="https://github.com/aaronats/jsmidi">homepage</a>.
      </div>
    </div>

    <div id="jsmidi-active">
      <div id="jsmidi-main">
        <div class="jsmidi-section">
          <div class="jsmidi-section-content">
            <div id="jsmidi-playback" title="Play" class="flex flex-justify">
              <button id="jsmidi-play" class="btn flex-col">
                <i class="icon icon-triangle-right"></i>
              </button>
              <button id="jsmidi-stop" title="Stop" class="btn flex-col">
                <i class="icon icon-primitive-square"></i>
              </button>
              <button id="jsmidi-restart" title="Restart" class="btn flex-col">
                <i class="icon icon-triangle-left"></i>
              </button>
              <button id="jsmidi-reload" title="Reload Project" class="btn flex-col">
                <i class="icon icon-sync"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="jsmidi-section">
          <div class="jsmidi-section-header">
            <i class="icon icon-clock"></i> Timing
          </div>
          <div class="jsmidi-section-content">
            <div id="jsmidi-timing" class="flex">
              <div class="jsmidi-timing-wrap align-left">
                <div id="jsmidi-position" class="jsmidi-timing-val">0:0:0</div>
                <div class="jsmidi-timing-label">POSITION</div>
              </div>
              <div class="jsmidi-timing-wrap align-center">
                <div class="jsmidi-timing-val">
                  <span id="jsmidi-bars">-</span>/<span id="jsmidi-beats">-</span>
                </div>
                <div class="jsmidi-timing-label">BARS/BEATS</div>
              </div>
              <div class="jsmidi-timing-wrap align-right">
                <div id="jsmidi-bpm" class="jsmidi-timing-val">120</div>
                <div class="jsmidi-timing-label">BPM</div>
              </div>
            </div>
          </div>
        </div>

        <div class="jsmidi-section">
          <div class="jsmidi-section-header">
            <i class="icon icon-list-ordered"></i> Tracks
          </div>
          <div id="jsmidi-tracks" class="jsmidi-section-content">
            <div class="jsmidi-section-notice">
              No tracks have been added to JSMidi.
            </div>
          </div>
        </div>

        <div class="jsmidi-section">
          <div class="jsmidi-section-header">
            <i class="icon icon-gear"></i> Settings
          </div>
          <div class="jsmidi-section-content">
            <div class="flex flex-justify jsmidi-input-wrap">
              <div class="jsmidi-label">Midi Output</div>
              <select id="output-select" class="jsmidi-select flex-col">
                <option>Select Output</option>
              </select>
            </div>
            <div class="flex flex-justify jsmidi-input-wrap">
              <div class="jsmidi-label">Repeat Loop</div>
              <div class="flex-col">
                <input id="jsmidi-repeat" type="checkbox" class="input-checkbox">
                <span id="jsmidi-restarts">Max Restarts: 40</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="jsmidi-logs">
        <div class="jsmidi-section">
          <div class="jsmidi-section-header">
            <i class="icon icon-terminal"></i> Logs
            <div id="jsmidi-logs-clear" class="jsmidi-header-btn" title="Clear Logs">
              <i class="icon icon-circle-slash"></i>
            </div>
          </div>
          <div class="jsmidi-section-content">
            <div id="jsmidi-logs-container"></div>
          </div>
        </div>
      </div>
    </div>

    <style type="text/css">
      .icon-jsmidi-tab::before {
        content: url('${root}/assets/jsmidi-tab-icon.svg');
      }
    </style>
  `.trim();
};
