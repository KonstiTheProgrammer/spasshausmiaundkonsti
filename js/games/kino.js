/* Kino – zusammen Videos schauen, Play/Pause/Spulen synchron --------- */
(function () {
  "use strict";
  var E = Engine.el, P = Engine.players;

  // YouTube IFrame-API einmalig laden
  var ytReady = null;
  function loadYT() {
    if (window.YT && window.YT.Player) return Promise.resolve();
    if (ytReady) return ytReady;
    ytReady = new Promise(function (res) {
      var prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () { if (prev) { try { prev(); } catch (e) {} } res(); };
      if (!document.getElementById("yt-api-script")) {
        var s = document.createElement("script");
        s.id = "yt-api-script"; s.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(s);
      }
      var n = 0, t = setInterval(function () { if ((window.YT && window.YT.Player) || ++n > 60) { clearInterval(t); res(); } }, 200);
    });
    return ytReady;
  }

  function parseSource(raw) {
    var url = (raw || "").trim();
    if (!url) return null;
    var yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (yt) return { kind: "yt", src: yt[1] };
    if (/^[A-Za-z0-9_-]{11}$/.test(url)) return { kind: "yt", src: url };
    if (/^https?:\/\/.+\.(mp4|webm|ogg|m4v|mov)(\?.*)?$/i.test(url)) return { kind: "file", src: url };
    return null;
  }

  GAMES.push({
    id: "kino",
    name: "Kino",
    emoji: "🎬",
    tagline: "Zusammen schauen – Play & Pause synchron.",
    help: "Fügt einen YouTube-Link oder einen direkten Video-Link (.mp4) ein und drückt „Laden\". Bei euch beiden läuft dann dasselbe Video, und was eine:r startet, pausiert oder vorspult, passiert beim/bei der anderen automatisch – perfekt für Filmabende über die Distanz. (Geschützte Streaming-Seiten lassen sich technisch leider nicht fernsteuern/synchronisieren.)",
    kind: "custom",
    online: true,
    noScore: true,

    mount: function (host, ctx) {
      var me = ctx.me;
      var useOnline = Store.room.available();
      Engine.clear(host);
      var wrap = E(".kino");
      host.appendChild(wrap);

      if (!useOnline) {
        wrap.appendChild(E(".kino-note", { html: "🎬 Das Kino braucht die <b>Online-Verbindung</b>, um Play/Pause zwischen euch zu synchronisieren. (Siehe ⚙️ / README – Firebase.)" }));
        this._cleanup = function () {};
        return;
      }

      var state = null, player = null, curKind = null, curSrc = null;
      var applying = false, ready = false, unwatch = null, unpres = null, presence = {}, driftTimer = null;

      // --- UI ---
      var input = E("input.kino-input", { type: "text", placeholder: "YouTube-Link oder .mp4-Link einfügen…" });
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") doLoad(); });
      var loadBtn = E("button.btn.btn-primary.kino-load", { onclick: doLoad }, ["▶ Laden"]);
      wrap.appendChild(E(".kino-bar", {}, [input, loadBtn]));

      var stage = E(".kino-stage");
      wrap.appendChild(stage);

      var statusEl = E(".kino-status");
      wrap.appendChild(statusEl);

      wrap.appendChild(E(".game-actions", {}, [E("button.btn.btn-soft", { onclick: clearVideo }, ["✖ Video entfernen"])]));

      unwatch = Store.room.watch("kino", function (v) { state = v || null; onState(); });
      unpres = Store.onPresence(function (p) { presence = p || {}; updateStatus(); });
      driftTimer = setInterval(driftCheck, 2500);

      this._cleanup = function () {
        if (unwatch) unwatch();
        if (unpres) unpres();
        if (driftTimer) clearInterval(driftTimer);
        teardownPlayer();
      };

      function doLoad() { var p = parseSource(input.value); if (p) { setVideo(p); input.value = ""; } else { Engine.toast("Bitte einen YouTube-Link oder direkten .mp4-Link einfügen"); } }
      function partner() { return !!presence[Engine.other(me)]; }
      function setVideo(p) { Store.room.set("kino", { kind: p.kind, src: p.src, playing: false, time: 0, ts: Store.now(), by: me }); }
      function clearVideo() { Store.room.set("kino", { kind: null, src: null, playing: false, time: 0, ts: Store.now(), by: me }); }

      function onState() {
        if (!state || !state.kind) { teardownPlayer(); showPlaceholder(); updateStatus(); return; }
        if (state.kind !== curKind || state.src !== curSrc) loadPlayer(state.kind, state.src);
        else if (ready) applyRemote(state);
        updateStatus();
      }

      function showPlaceholder() {
        Engine.clear(stage);
        stage.appendChild(E(".kino-placeholder", { html: "🎬🍿<br><span>Fügt oben einen Link ein, um zusammen zu schauen.</span>" }));
      }
      function teardownPlayer() {
        ready = false;
        if (player) { try { if (curKind === "yt" && player.destroy) player.destroy(); } catch (e) {} }
        player = null; curKind = null; curSrc = null;
        Engine.clear(stage);
      }
      function loadPlayer(kind, src) {
        teardownPlayer();
        curKind = kind; curSrc = src;
        if (kind === "yt") {
          var box = E(".kino-yt"), mountEl = E("div");
          box.appendChild(mountEl); stage.appendChild(box);
          loadYT().then(function () {
            if (curKind !== "yt" || curSrc !== src) return;
            player = new YT.Player(mountEl, {
              videoId: src, width: "100%", height: "100%",
              playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
              events: {
                onReady: function () { ready = true; if (state) applyRemote(state); },
                onStateChange: function (e) { if (applying) return; if (e.data === 1) broadcast(true); else if (e.data === 2) broadcast(false); }
              }
            });
          });
        } else {
          var vid = E("video.kino-video", { src: src, controls: true, playsinline: true, preload: "metadata" });
          vid.addEventListener("play", function () { if (!applying) broadcast(true); });
          vid.addEventListener("pause", function () { if (!applying) broadcast(false); });
          vid.addEventListener("seeked", function () { if (!applying) broadcast(!vid.paused); });
          player = vid; stage.appendChild(vid); ready = true;
          if (state) applyRemote(state);
        }
      }

      function curTime() { try { return curKind === "yt" ? player.getCurrentTime() : player.currentTime; } catch (e) { return 0; } }
      function expectedTime(s) { return s.playing ? (s.time + Math.max(0, (Store.now() - s.ts) / 1000)) : s.time; }
      function broadcast(playing) {
        if (!curKind) return;
        Store.room.set("kino", { kind: curKind, src: curSrc, playing: playing, time: curTime(), ts: Store.now(), by: me });
      }
      function applyRemote(s) {
        if (!ready || !player || s.by === me) return; // eigenes Echo ignorieren
        applying = true;
        var want = expectedTime(s);
        try {
          if (curKind === "yt") {
            if (Math.abs(player.getCurrentTime() - want) > 1.5) player.seekTo(want, true);
            var ps = player.getPlayerState();
            if (s.playing && ps !== 1) player.playVideo();
            else if (!s.playing && ps === 1) player.pauseVideo();
          } else {
            if (Math.abs(player.currentTime - want) > 1.5) player.currentTime = want;
            if (s.playing && player.paused) { var pr = player.play(); if (pr && pr.catch) pr.catch(function () {}); }
            else if (!s.playing && !player.paused) player.pause();
          }
        } catch (e) {}
        setTimeout(function () { applying = false; }, 800);
      }
      function driftCheck() {
        if (!ready || !player || !state || !state.kind || !state.playing) return;
        var want = expectedTime(state), cur = curTime();
        if (Math.abs(cur - want) > 1.6) {
          applying = true;
          try { if (curKind === "yt") player.seekTo(want, true); else player.currentTime = want; } catch (e) {}
          setTimeout(function () { applying = false; }, 600);
        }
      }
      function updateStatus() {
        Engine.clear(statusEl);
        statusEl.appendChild(E(".presence.center", {}, [
          E("span.dot" + (partner() ? ".on" : "")),
          partner() ? (P[Engine.other(me)].name + " ist im Kino 🍿") : (P[Engine.other(me)].name + " ist noch nicht da")
        ]));
        if (state && state.kind) statusEl.appendChild(E(".kino-sync", { text: "🔄 Play, Pause & Spulen sind synchron" }));
      }

      showPlaceholder();
      updateStatus();
    }
  });
})();
