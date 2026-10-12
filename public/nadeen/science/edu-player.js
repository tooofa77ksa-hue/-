/* EduPlayer — controls for one GSAP teaching timeline (+ optional AudioSync).
   Play/pause, restart, speed, mute, reduced motion (step-by-step stills), captions per label.
   Nothing plays before the first tap/click. Arabic labels; works with touch and mouse.
   Usage: EduPlayer({ tl, mount:'#ctl', steps:['a','b'], captions:{a:'…'}, captionEl:'#cap', audio })   */
(function () {
  'use strict';
  function EduPlayer(o) {
    var tl = o.tl, audio = o.audio || null;
    var mount = typeof o.mount === 'string' ? document.querySelector(o.mount) : o.mount;
    var capEl = o.captionEl ? (typeof o.captionEl === 'string' ? document.querySelector(o.captionEl) : o.captionEl) : null;
    var steps = o.steps || Object.keys(tl.labels).sort(function (a, b) { return tl.labels[a] - tl.labels[b]; });
    var captions = o.captions || {};
    var speeds = o.speeds || [0.5, 0.75, 1, 1.5];
    var speedIdx = speeds.indexOf(1) < 0 ? 0 : speeds.indexOf(1);
    var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var reduced = o.reduced != null ? !!o.reduced : !!(mq && mq.matches);
    var muted = false, stepIdx = 0, unlocked = false, lastCap = null;

    function el(tag, cls, html, label) {
      var b = document.createElement(tag); b.className = cls; b.innerHTML = html;
      if (label) { b.setAttribute('aria-label', label); b.title = label; }
      if (tag === 'button') b.type = 'button';
      return b;
    }
    mount.classList.add('edu-player');
    var bPrev = el('button', 'ep-btn ep-prev', '▶', 'الخطوة السابقة');      // RTL: previous points right
    var bPlay = el('button', 'ep-btn ep-play', '▶', 'تشغيل');
    var bNext = el('button', 'ep-btn ep-next', '◀', 'الخطوة التالية');
    var bRestart = el('button', 'ep-btn', '⟲', 'من البداية');
    var bSpeed = el('button', 'ep-btn ep-speed', '', 'السرعة');
    var bMute = el('button', 'ep-btn', '🔊', 'كتم الصوت');
    var bReduce = el('button', 'ep-btn ep-reduce', '', 'تقليل الحركة');
    [bPrev, bPlay, bNext, bRestart, bSpeed, bMute, bReduce].forEach(function (b) { mount.appendChild(b); });
    if (!audio) bMute.hidden = true;

    function firstGesture() {
      if (unlocked) return; unlocked = true;
      if (audio && audio.unlock) audio.unlock();
    }
    function caption(label) {
      if (!capEl || label === lastCap) return; lastCap = label;
      capEl.textContent = captions[label] || '';
    }
    function setPlayIcon() {
      var playing = !reduced && !tl.paused();
      bPlay.textContent = playing ? '⏸' : '▶';
      bPlay.setAttribute('aria-label', playing ? 'إيقاف مؤقت' : (reduced ? 'الخطوة التالية' : 'تشغيل'));
      bPlay.setAttribute('aria-pressed', playing ? 'true' : 'false');
    }
    function setSpeedLabel() { bSpeed.textContent = 'السرعة ' + speeds[speedIdx] + '×'; }
    function setReduceLabel() {
      bReduce.textContent = reduced ? '✨ حركة كاملة' : '🐢 حركة أقل';
      bReduce.setAttribute('aria-pressed', reduced ? 'true' : 'false');
      bPrev.hidden = bNext.hidden = !reduced;
      mount.classList.toggle('ep-reduced', reduced);
    }
    function seek(label) {                          // move without firing sound cues
      if (audio && audio.seeking) audio.seeking(true);
      tl.pause(label);                              // pause(time) suppresses callbacks by default
      if (audio && audio.seeking) audio.seeking(false);
      caption(typeof label === 'string' ? label : (tl.currentLabel() || steps[0]));
    }
    function goStep(i) {
      stepIdx = (i + steps.length) % steps.length;
      var lab = steps[stepIdx];
      seek(lab);
      if (audio && audio.cue) audio.cue(lab);       // still hear the sound that belongs to this step
      setPlayIcon();
    }
    function play() {
      firstGesture();
      if (reduced) { goStep(stepIdx + 1); return; }
      tl.play(); if (audio && audio.resume) audio.resume(); setPlayIcon();
    }
    function pause() { tl.pause(); if (audio && audio.pause) audio.pause(); setPlayIcon(); }
    function restart() {
      firstGesture();
      if (audio && audio.stopAll) audio.stopAll();
      if (reduced) { goStep(0); return; }
      seek(0); tl.play(); setPlayIcon();
    }
    function setSpeed(i) {
      speedIdx = (i + speeds.length) % speeds.length;
      tl.timeScale(speeds[speedIdx]);
      if (audio && audio.setRate) audio.setRate(speeds[speedIdx]);
      setSpeedLabel();
    }
    function setMuted(m) {
      muted = !!m; if (audio && audio.mute) audio.mute(muted);
      bMute.textContent = muted ? '🔇' : '🔊';
      bMute.setAttribute('aria-label', muted ? 'تشغيل الصوت' : 'كتم الصوت');
      bMute.setAttribute('aria-pressed', muted ? 'true' : 'false');
    }
    function setReduced(r) {
      reduced = !!r;
      if (reduced) { pause(); var cur = tl.currentLabel(); var k = steps.indexOf(cur); goStep(k < 0 ? 0 : k); }
      setReduceLabel(); setPlayIcon();
    }

    bPlay.addEventListener('click', function () { (!reduced && !tl.paused()) ? pause() : play(); });
    bPrev.addEventListener('click', function () { firstGesture(); goStep(stepIdx - 1); });
    bNext.addEventListener('click', function () { firstGesture(); goStep(stepIdx + 1); });
    bRestart.addEventListener('click', restart);
    bSpeed.addEventListener('click', function () { setSpeed(speedIdx + 1); });
    bMute.addEventListener('click', function () { firstGesture(); setMuted(!muted); });
    bReduce.addEventListener('click', function () { setReduced(!reduced); });
    tl.eventCallback('onUpdate', function () { var l = tl.currentLabel(); if (l) caption(l); });
    document.addEventListener('visibilitychange', function () { if (document.hidden && !tl.paused()) pause(); });

    setSpeed(speedIdx); setReduceLabel(); setPlayIcon();
    if (reduced) seek(steps[0]); else caption(steps[0]);
    return {
      play: play, pause: pause, restart: restart, setMuted: setMuted, setReduced: setReduced,
      setSpeed: function (s) { var k = speeds.indexOf(s); if (k >= 0) setSpeed(k); },
      step: goStep,
      state: function () { return { reduced: reduced, muted: muted, speed: speeds[speedIdx], step: steps[stepIdx], paused: tl.paused(), time: tl.time() }; }
    };
  }
  window.EduPlayer = EduPlayer;
})();
