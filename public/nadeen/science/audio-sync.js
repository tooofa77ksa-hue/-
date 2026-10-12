/* AudioSync — play recorded/licensed sounds in step with a GSAP timeline, using Howler.js.
   Howler only PLAYS files; it does not generate sounds.
   AudioSync({ tl, sprite:{src:[...], map:{name:[startMs,durMs]}}, files:{name:{src:[...], html5, loop, volume}},
               cues:[{at:'label'|seconds, sound:'name'}], rateFollowsSpeed:false })
   Returns the object EduPlayer expects: unlock, pause, resume, stopAll, setRate, mute, seeking, cue, play. */
(function () {
  'use strict';
  function AudioSync(o) {
    var tl = o.tl || null, cues = o.cues || [], rateFollows = !!o.rateFollowsSpeed;
    var log = window.__audioLog = window.__audioLog || [];
    var isSeeking = false, rate = 1, unlocked = false, live = [], held = [];
    var sprite = o.sprite ? new Howl({ src: o.sprite.src, sprite: o.sprite.map, preload: true }) : null;
    var howls = {};
    Object.keys(o.files || {}).forEach(function (k) {
      var f = o.files[k]; howls[k] = new Howl({ src: f.src, html5: !!f.html5, loop: !!f.loop, volume: f.volume == null ? 1 : f.volume, preload: true });
    });

    function track(h, id) {
      var rec = { h: h, id: id }; live.push(rec);
      h.once('end', function () { live = live.filter(function (r) { return r !== rec; }); }, id);
    }
    function play(name) {
      if (isSeeking) return null;
      var h = null, id;
      if (sprite && o.sprite.map[name]) { h = sprite; id = h.play(name); }
      else if (howls[name]) { h = howls[name]; id = h.play(); }
      if (!h) return null;
      if (rateFollows) h.rate(rate, id);
      track(h, id);
      log.push([tl ? Math.round(tl.time() * 100) / 100 : 0, name]);
      return id;
    }
    // cues ride on the timeline: speed changes move them with the motion; seeking doesn't fire them
    if (tl) cues.forEach(function (c) {
      tl.call(function () { if (!isSeeking && !tl.paused()) play(c.sound); }, null, c.at);
    });

    return {
      play: play,
      unlock: function () {
        if (unlocked) return; unlocked = true;
        try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}   // iOS 17+: ignore silent switch
        try { if (Howler.ctx && Howler.ctx.state === 'suspended') Howler.ctx.resume(); } catch (e) {}
      },
      pause: function () {
        held = live.filter(function (r) { return r.h.playing(r.id); });
        held.forEach(function (r) { r.h.pause(r.id); });
      },
      resume: function () { held.forEach(function (r) { r.h.play(r.id); }); held = []; },
      stopAll: function () {
        if (sprite) sprite.stop();
        Object.keys(howls).forEach(function (k) { howls[k].stop(); });
        live = []; held = [];
      },
      setRate: function (r) {
        rate = r;
        if (rateFollows) live.forEach(function (x) { x.h.rate(r, x.id); });
      },
      mute: function (m) { Howler.mute(!!m); },
      seeking: function (b) { isSeeking = !!b; },
      cue: function (label) {              // step mode: play the sound that belongs to this label once
        cues.forEach(function (c) { if (c.at === label) play(c.sound); });
      }
    };
  }
  window.AudioSync = AudioSync;
})();
