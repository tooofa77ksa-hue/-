// The frame of the presentation: fit-to-screen stage, slides, sounds, and Nadeen the guide.
(function () {
  var $ = window.$ = function (s, r) { return (r || document).querySelector(s); };
  window.$$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var stage = $('#stage');

  // ---- fit the 1600×900 stage to any screen ----
  // explicit pixel placement: works the same in Safari, in-app browsers and Chrome
  function fit() {
    var r = $('#wrap').getBoundingClientRect(), W = r.width || innerWidth, H = r.height || innerHeight;
    var k = Math.min(W / 1600, H / 900), x = Math.round((W - 1600 * k) / 2), y = Math.round((H - 900 * k) / 2);
    stage.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + k + ')'; window.SCALE = k;
  }
  addEventListener('resize', fit); addEventListener('orientationchange', function () { setTimeout(fit, 200); setTimeout(fit, 700); });
  if (window.visualViewport) visualViewport.addEventListener('resize', fit);
  addEventListener('load', fit); fit(); [100, 400, 1000, 2000].forEach(function (d) { setTimeout(fit, d); });
  // pointer position in stage pixels, relative to an element
  window.local = function (e, el) {
    var r = el.getBoundingClientRect(), p = e.touches ? e.touches[0] : e;
    var w = el.offsetWidth || el.clientWidth || r.width / (window.SCALE || 1), h = el.offsetHeight || el.clientHeight || r.height / (window.SCALE || 1);
    return [(p.clientX - r.left) / r.width * w, (p.clientY - r.top) / r.height * h];
  };

  // ---- sounds (plain audio elements, so it also works when opened as a file) ----
  var SFX = {}, soundOn = true, musicOn = false, music = new Audio('assets/sfx/music.mp3');
  music.loop = true; music.volume = .35;
  ['pencil', 'charcoal', 'crayon', 'pen', 'pop', 'correct', 'wrong', 'whoosh', 'stamp', 'magic', 'tick', 'flip', 'fanfare', 'wind', 'timewarp', 'scrape', 'drip']
    .forEach(function (n) { var a = new Audio('assets/sfx/' + n + '.mp3'); a.preload = 'auto'; SFX[n] = a; });
  window.sfx = function (n, vol) {
    if (!soundOn || !SFX[n]) return;
    var a = SFX[n].cloneNode(); a.volume = vol == null ? .8 : vol; a.play().catch(function () {});
  };
  // a looping sound that runs while the finger is drawing
  var loopA = null;
  window.loopStart = function (n, vol) { loopStop(); if (!soundOn) return; loopA = SFX[n].cloneNode(); loopA.loop = true; loopA.volume = vol || .5; loopA.play().catch(function () {}); };
  window.loopStop = function () { if (loopA) { loopA.pause(); loopA = null; } };
  $('#bSound').onclick = function () { soundOn = !soundOn; if (!soundOn) stopVoice(); this.classList.toggle('off', !soundOn); this.textContent = soundOn ? '🔊' : '🔇'; if (soundOn) sfx('pop'); };
  $('#bMusic').onclick = function () { musicOn = !musicOn; this.classList.toggle('off', !musicOn); if (musicOn) music.play().catch(function () {}); else music.pause(); };
  $('#bMusic').classList.add('off');
  $('#bFull').onclick = function () { var d = document; if (!d.fullscreenElement) (d.documentElement.requestFullscreen || d.documentElement.webkitRequestFullscreen).call(d.documentElement); else d.exitFullscreen(); };

  // ---- confetti / leaves rain ----
  window.confetti = function (n, chars) {
    var fx = $('#fx'); chars = chars || ['🍃', '🍂', '🍁', '✨', '⭐', '🎨', '✏️'];
    for (var i = 0; i < (n || 40); i++) {
      var d = document.createElement('div'); d.className = 'conf'; d.textContent = chars[i % chars.length];
      var x = Math.random() * 1600, dur = 2.2 + Math.random() * 2, rot = (Math.random() - .5) * 720;
      d.style.left = x + 'px';
      d.animate([{ transform: 'translate(0,0) rotate(0)' }, { transform: 'translate(' + ((Math.random() - .5) * 300) + 'px,1000px) rotate(' + rot + 'deg)' }], { duration: dur * 1000, delay: Math.random() * 600, easing: 'cubic-bezier(.3,.1,.6,1)', fill: 'both' });
      fx.appendChild(d); setTimeout(function (e) { e.remove(); }, (dur + 1) * 1000, d);
    }
  };

  // ---- Nadeen: talks with her drawn mouth shapes while her words appear ----
  var NI = {}, nc = $('#nadeen'), nx = nc.getContext('2d');
  var names = ['idle', 'walk_01', 'walk_02', 'walk_03', 'walk_04', 'wave_raise', 'wave_left', 'wave_right'];
  ['closed', 'small', 'medium', 'wide', 'O', 'OO'].forEach(function (m) { names.push('t_' + m, 't_' + m + '_b'); });
  var loaded = Promise.resolve();   // the character is not shown any more; only her words
  var talkTxt = '', talkI = 0, talkT = 0, mode = 'idle', modeT = 0, bubbleTimer = 0, sayHtml = '';
  function mouthFor(ch) {
    if (!ch || ' ،.!؟:'.indexOf(ch) >= 0) return 'closed';
    if ('اآى'.indexOf(ch) >= 0) return 'wide';
    if ('وُ'.indexOf(ch) >= 0) return 'OO';
    if ('يِ'.indexOf(ch) >= 0) return 'medium';
    if ('مبف'.indexOf(ch) >= 0) return 'closed';
    if ('عحهأإ'.indexOf(ch) >= 0) return 'O';
    return (ch.charCodeAt(0) % 2) ? 'small' : 'medium';
  }
  // recorded voice: mouth shapes from Rhubarb timings of each clip
  var voiceA = null, voiceCues = [], MOUTH = { X: 'closed', A: 'closed', B: 'small', C: 'medium', D: 'wide', E: 'O', F: 'OO', G: 'small', H: 'medium' };
  function cueAt(c, t) { var v = 'X'; for (var i = 0; i < c.length && c[i][0] <= t; i++) v = c[i][1]; return v; }
  window.stopVoice = function () { if (voiceA) { voiceA.pause(); voiceA = null; } };
  var t0 = performance.now(), blinkAt = 2.5;
  function frame(now) {
    var t = (now - t0) / 1000, f;
    var blink = t > blinkAt && t < blinkAt + .14; if (t > blinkAt + .14) blinkAt = t + 2.4 + Math.random() * 2.6;
    if (mode === 'wave') { var v = Math.floor((t - modeT) / .24); f = ['wave_raise', 'wave_left', 'wave_raise', 'wave_right'][v % 4]; if (t - modeT > 2.6) mode = 'idle'; }
    else if (voiceA && !voiceA.paused && !voiceA.ended) {
      var vt = voiceA.currentTime, dur = voiceA.duration || 1, n2 = Math.min(talkTxt.length, Math.ceil(talkTxt.length * Math.min(1, vt / (dur * .92))));
      if (n2 > talkI) { talkI = n2; $('#bubbleT').textContent = talkTxt.slice(0, talkI).join(''); if (talkI >= talkTxt.length) $('#bubbleT').innerHTML = sayHtml; }
      f = 't_' + MOUTH[cueAt(voiceCues, vt)] + (blink ? '_b' : '');
    }
    else if (talkI < talkTxt.length && !voiceA) {
      var n = Math.floor((t - talkT) * 26);
      if (n > talkI) { talkI = Math.min(n, talkTxt.length); $('#bubbleT').textContent = talkTxt.slice(0, talkI).join(''); if (talkI >= talkTxt.length) $('#bubbleT').innerHTML = sayHtml; }
      f = 't_' + mouthFor(talkTxt[talkI]) + (blink ? '_b' : '');
    } else f = 't_closed' + (blink ? '_b' : '');
    
    requestAnimationFrame(frame);
  }
  loaded.then(function () { requestAnimationFrame(frame); });
  window.say = function (html, ms, vid) {
    if (!html) return;
    stopVoice();
    if (vid && soundOn) {
      var a = new Audio('assets/voice/' + vid + '.mp3'); voiceA = a; voiceCues = (window.VOICE_CUES || {})[vid] || [];
      a.play().catch(function () { if (voiceA === a) { voiceA = null; talkT = (performance.now() - t0) / 1000; } });
      a.onended = function () { if (voiceA !== a) return; $('#bubbleT').innerHTML = sayHtml; talkI = talkTxt.length; clearTimeout(bubbleTimer); bubbleTimer = setTimeout(hideBubble, 2600); };
    }
    sayHtml = html; var tmp = document.createElement('div'); tmp.innerHTML = html; talkTxt = Array.from(tmp.textContent);
    talkI = 0; talkT = (performance.now() - t0) / 1000; $('#bubbleT').textContent = ''; $('#bubble').classList.add('on');
    $('#guide').classList.remove('peek');
    clearTimeout(bubbleTimer); bubbleTimer = setTimeout(function () { if (!voiceA || voiceA.paused || voiceA.ended) hideBubble(); }, ms || 3500 + talkTxt.length * 70);
  };
  function hideBubble() { $('#bubble').classList.remove('on'); if (cur && cur.peek) $('#guide').classList.add('peek'); }
  window.wave = function () { mode = 'wave'; modeT = (performance.now() - t0) / 1000; };
  window.guide = function (show) { $('#guide').classList.toggle('hide', !show); };
  $('#guide').onclick = function () { if (cur && cur.say) say(cur.say, 0, cur.voice); else wave(); };

  // ---- slides ----
  var ST = window.STATIONS = [], idx = -1, cur = null, done = {};
  window.station = function (o) { ST.push(o); };
  window.markDone = function (id) { done[id] = true; var m = $('.mleaf[data-id="' + id + '"]'); if (m) m.classList.add('done'); };
  window.go = function (i, back) {
    if (i < 0 || i >= ST.length || i === idx) return;
    if (cur) { cur.el.classList.remove('on'); if (cur.leave) cur.leave(cur.el); }
    loopStop(); stopVoice(); idx = i; cur = ST[i];
    cur.el.classList.toggle('back', !!back); void cur.el.offsetWidth; cur.el.classList.add('on');
    $('#chip').classList.toggle('on', !!cur.num);
    $('#chipN').textContent = cur.num || ''; $('#chipT').textContent = cur.title || '';
    $('#bPrev').classList.toggle('hide', i === 0); $('#bNext').classList.toggle('hide', i === ST.length - 1);
    guide(cur.guide !== false); $('#guide').classList.remove('peek');
    if (cur.enter) cur.enter(cur.el);
    if (cur.say) setTimeout(function () { if (cur === ST[i]) say(cur.say, 0, cur.voice); }, 650);
    if (i > 1) sfx('whoosh', .4);
    if (cur.id && i > 1) markDone(cur.id);
  };
  window.goId = function (id) { for (var i = 0; i < ST.length; i++) if (ST[i].id === id) return go(i, i < idx); };
  $('#bNext').onclick = function () { go(idx + 1); };
  $('#bPrev').onclick = function () { go(idx - 1, true); };
  $('#bHome').onclick = function () { goId('map'); };
  addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowLeft' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); go(idx + 1); }
    if (e.key === 'ArrowRight' || e.key === 'PageUp') { e.preventDefault(); go(idx - 1, true); }
  });
  // build the slide elements, then start
  window.startShow = function () {
    ST.forEach(function (s) {
      var d = document.createElement('div'); d.className = 'slide'; d.id = 's-' + s.id; d.innerHTML = s.html || ''; $('#slides').appendChild(d); s.el = d;
      if (s.init) s.init(d);
    });
    go(0);
  };
})();
