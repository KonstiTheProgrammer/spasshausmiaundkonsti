/* =====================================================================
   STORE – Speicherung & Synchronisation
   ---------------------------------------------------------------------
   Kümmert sich um: Identität (Konsti/Mia), Einstellungen, Punkte und
   den optionalen Online-Sync via Firebase. Alles, was sonst die App
   anfassen müsste, läuft über dieses Modul.

   Verhalten:
   - Ohne Firebase-Konfig: alles in localStorage (ein Gerät).
   - Mit Firebase: Punkte & Spielräume werden zwischen den Geräten
     geteilt; localStorage dient als Cache/Fallback.
   ===================================================================== */
(function () {
  "use strict";

  var LS = {
    identity: "km_identity",
    settings: "km_settings",
    scores: "km_scores"
  };

  // ---- kleine Helfer -------------------------------------------------
  function readLS(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }
  function writeLS(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  function emptyPlayer() {
    return { points: 0, wins: 0, losses: 0, draws: 0, games: 0, streak: 0, perGame: {} };
  }
  function defaultScores() {
    return { konsti: emptyPlayer(), mia: emptyPlayer(), updated: 0 };
  }
  // Sorgt dafür, dass ein (evtl. altes/teilweises) Scores-Objekt vollständig ist.
  function normalizeScores(s) {
    var base = defaultScores();
    if (!s || typeof s !== "object") return base;
    ["konsti", "mia"].forEach(function (id) {
      var p = (s[id] && typeof s[id] === "object") ? s[id] : {};
      var np = emptyPlayer();
      np.points = p.points || 0;
      np.wins = p.wins || 0;
      np.losses = p.losses || 0;
      np.draws = p.draws || 0;
      np.games = p.games || 0;
      np.streak = p.streak || 0;
      np.perGame = (p.perGame && typeof p.perGame === "object") ? p.perGame : {};
      base[id] = np;
    });
    base.updated = s.updated || 0;
    return base;
  }

  // ---- Zustand -------------------------------------------------------
  var listeners = [];          // Score-Listener
  var presenceListeners = [];  // Online-Status-Listener
  var scoresCache = normalizeScores(readLS(LS.scores, null));
  var fb = null;               // firebase app/db Referenzen
  var online = false;          // aktiv verbunden?

  // ---------------------------------------------------------------
  // Firebase initialisieren (nur wenn konfiguriert & SDK geladen)
  // ---------------------------------------------------------------
  function initFirebase() {
    if (!window.KM_ONLINE_CONFIGURED) return;
    if (typeof firebase === "undefined" || !firebase.initializeApp) {
      console.warn("[Store] Firebase-SDK nicht geladen – bleibe offline.");
      return;
    }
    try {
      var app = firebase.initializeApp(window.KM_CONFIG.firebase);
      var db = firebase.database();
      var room = sanitize(window.KM_CONFIG.roomCode || "konsti-und-mia");
      fb = { app: app, db: db, room: room, base: "rooms/" + room };
      online = true;

      // Punkte aus der Cloud beobachten
      var scoresRef = db.ref(fb.base + "/scores");
      scoresRef.on("value", function (snap) {
        var cloud = snap.val();
        if (cloud) {
          scoresCache = normalizeScores(cloud);
          writeLS(LS.scores, scoresCache);
          emit();
        } else {
          // Cloud noch leer -> lokalen Stand einmalig hochschieben (Seed)
          scoresRef.set(withTimestamp(scoresCache));
        }
      });

      // Verbindungsstatus / Anwesenheit
      setupPresence(db);
      console.info("[Store] Online verbunden, Raum:", room);
    } catch (e) {
      console.warn("[Store] Firebase-Init fehlgeschlagen:", e);
      fb = null;
      online = false;
    }
  }

  function setupPresence(db) {
    try {
      var id = api.getIdentity() || "gast";
      var meRef = db.ref(fb.base + "/presence/" + id);
      var connectedRef = db.ref(".info/connected");
      connectedRef.on("value", function (snap) {
        if (snap.val() === true) {
          meRef.onDisconnect().set(0);
          meRef.set(Date.now ? Date.now() : 1);
        }
      });
      db.ref(fb.base + "/presence").on("value", function (snap) {
        var val = snap.val() || {};
        emitPresence(val);
      });
    } catch (e) { /* Anwesenheit ist nur "nice to have" */ }
  }

  function sanitize(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9_-]/g, "-").slice(0, 40) || "raum";
  }
  function withTimestamp(obj) {
    obj.updated = Date.now ? Date.now() : (obj.updated || 0) + 1;
    return obj;
  }

  // ---- Punkte-Logik --------------------------------------------------
  function applyResultLocally(scores, winnerId, gameId, opts) {
    opts = opts || {};
    var konsti = scores.konsti, mia = scores.mia;
    konsti.games++; mia.games++;
    if (!konsti.perGame[gameId]) konsti.perGame[gameId] = { wins: 0, losses: 0, draws: 0 };
    if (!mia.perGame[gameId]) mia.perGame[gameId] = { wins: 0, losses: 0, draws: 0 };

    if (opts.draw || !winnerId) {
      konsti.draws++; mia.draws++;
      konsti.streak = 0; mia.streak = 0;
      konsti.perGame[gameId].draws++; mia.perGame[gameId].draws++;
    } else {
      var w = winnerId === "konsti" ? konsti : mia;
      var l = winnerId === "konsti" ? mia : konsti;
      var pts = opts.points || 1;
      w.points += pts; w.wins++; w.streak = (w.streak || 0) + 1;
      l.losses++; l.streak = 0;
      w.perGame[gameId].wins++;
      l.perGame[gameId].losses++;
    }
    return scores;
  }

  // ---- öffentliche API ----------------------------------------------
  var api = {
    isOnline: function () { return online; },
    isConfigured: function () { return !!window.KM_ONLINE_CONFIGURED; },
    roomCode: function () { return window.KM_CONFIG ? window.KM_CONFIG.roomCode : ""; },

    // Identität
    getIdentity: function () { return readLS(LS.identity, null); },
    setIdentity: function (id) {
      writeLS(LS.identity, id);
      // Anwesenheit unter neuer Identität neu setzen
      if (online && fb) { try { setupPresence(fb.db); } catch (e) {} }
    },

    // Einstellungen
    getSettings: function () {
      return Object.assign({ sound: true, theme: "auto" }, readLS(LS.settings, {}) || {});
    },
    setSettings: function (obj) {
      var merged = Object.assign(api.getSettings(), obj || {});
      writeLS(LS.settings, merged);
      return merged;
    },

    // Punkte
    getScores: function () { return scoresCache; },
    onScores: function (cb) { listeners.push(cb); cb(scoresCache); return function () { remove(listeners, cb); }; },
    onPresence: function (cb) { presenceListeners.push(cb); return function () { remove(presenceListeners, cb); }; },

    addResult: function (winnerId, gameId, opts) {
      if (online && fb) {
        // Transaktion -> race-sicher bei zwei Geräten
        var ref = fb.db.ref(fb.base + "/scores");
        ref.transaction(function (current) {
          var s = normalizeScores(current);
          applyResultLocally(s, winnerId, gameId, opts);
          return withTimestamp(s);
        });
        // Listener (on value) aktualisiert scoresCache + UI automatisch.
      } else {
        applyResultLocally(scoresCache, winnerId, gameId, opts);
        withTimestamp(scoresCache);
        writeLS(LS.scores, scoresCache);
        emit();
      }
    },

    resetScores: function () {
      var fresh = defaultScores();
      if (online && fb) {
        fb.db.ref(fb.base + "/scores").set(withTimestamp(fresh));
      } else {
        scoresCache = fresh;
        writeLS(LS.scores, scoresCache);
        emit();
      }
    },

    // ---- Online-Spielräume (pro Spiel ein Zustand) ----
    // Fallen ohne Firebase einfach auf "nichts" zurück; Spiele laufen
    // dann lokal (Hotseat) weiter.
    room: {
      available: function () { return online && !!fb; },
      ref: function (gameId) {
        if (!online || !fb) return null;
        return fb.db.ref(fb.base + "/games/" + sanitize(gameId));
      },
      watch: function (gameId, cb) {
        var r = api.room.ref(gameId);
        if (!r) return function () {};
        var handler = r.on("value", function (snap) { cb(snap.val()); });
        return function () { try { r.off("value", handler); } catch (e) {} };
      },
      set: function (gameId, state) {
        var r = api.room.ref(gameId);
        if (r) r.set(state);
      },
      update: function (gameId, patch) {
        var r = api.room.ref(gameId);
        if (r) r.update(patch);
      },
      clear: function (gameId) {
        var r = api.room.ref(gameId);
        if (r) r.remove();
      },
      transaction: function (gameId, fn) {
        var r = api.room.ref(gameId);
        if (r) r.transaction(fn);
      }
    }
  };

  function emit() { listeners.forEach(function (cb) { try { cb(scoresCache); } catch (e) {} }); }
  function emitPresence(val) { presenceListeners.forEach(function (cb) { try { cb(val); } catch (e) {} }); }
  function remove(arr, cb) { var i = arr.indexOf(cb); if (i >= 0) arr.splice(i, 1); }

  // Auto-Init beim Laden
  initFirebase();

  window.Store = api;
})();
