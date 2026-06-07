/* =====================================================================
   ENGINE – gemeinsame Basis für alle Spiele
   ---------------------------------------------------------------------
   - Spieler-Stammdaten (Konsti/Mia: Name, Farbe, Avatar)
   - Mini DOM-Helfer  el(...)
   - Konfetti & kleine Sounds
   - turnGame(def): macht aus einer reinen Spiel-Definition ein fertiges
     Spiel-Objekt, das sowohl LOKAL (Hotseat, ein Gerät) als auch ONLINE
     (über Firebase, zwei Geräte) funktioniert – inklusive Punktevergabe.
   ===================================================================== */
(function () {
  "use strict";

  var Engine = {};

  // ---- Spieler-Stammdaten -------------------------------------------
  Engine.players = {
    konsti: { id: "konsti", name: "Konsti", avatar: "🐰", color: "#38bdf8", color2: "#6366f1" },
    mia:    { id: "mia",    name: "Mia",    avatar: "🐭", color: "#fb7185", color2: "#f472b6" }
  };
  Engine.other = function (id) { return id === "konsti" ? "mia" : "konsti"; };
  // Eindeutige Match-ID (für idempotente Punktevergabe – kein Doppelpunkt bei Reload)
  Engine.uid = function () { return (Date.now ? Date.now() : 0).toString(36) + "-" + Math.floor(Math.random() * 1e9).toString(36); };

  // ---- DOM-Helfer ----------------------------------------------------
  // el("div.klasse#id", {attr:..}, [kinder | text])
  Engine.el = function (sel, attrs, children) {
    var parts = String(sel).split(/(?=[.#])/);
    var tag = parts[0] && parts[0][0] !== "." && parts[0][0] !== "#" ? parts[0] : "div";
    var node = document.createElement(tag);
    parts.forEach(function (p) {
      if (p[0] === ".") node.classList.add(p.slice(1));
      else if (p[0] === "#") node.id = p.slice(1);
    });
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (k === "text") node.textContent = v;
        else if (k === "html") node.innerHTML = v;
        else if (k === "style" && v && typeof v === "object") {
          // WICHTIG: CSS-Variablen (--x) brauchen setProperty, normale Props gehen direkt.
          Object.keys(v).forEach(function (prop) {
            if (v[prop] == null) return;
            if (prop.indexOf("--") === 0) node.style.setProperty(prop, v[prop]);
            else node.style[prop] = v[prop];
          });
        }
        else if (k.slice(0, 2) === "on" && typeof v === "function") node.addEventListener(k.slice(2), v);
        else if (v === true) node.setAttribute(k, "");
        else if (v !== false && v != null) node.setAttribute(k, v);
      });
    }
    appendChildren(node, children);
    return node;
  };
  function appendChildren(node, children) {
    if (children == null) return;
    if (!Array.isArray(children)) children = [children];
    children.forEach(function (c) {
      if (c == null || c === false) return;
      if (typeof c === "string" || typeof c === "number") node.appendChild(document.createTextNode(String(c)));
      else node.appendChild(c);
    });
  }
  Engine.clear = function (node) { while (node.firstChild) node.removeChild(node.firstChild); return node; };

  // ---- Sound (sehr dezent, abschaltbar) -----------------------------
  var actx = null;
  function ac() {
    if (actx) return actx;
    try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; }
    return actx;
  }
  function soundOn() { try { return Store.getSettings().sound; } catch (e) { return true; } }
  Engine.beep = function (freq, dur, type, vol) {
    if (!soundOn()) return;
    var ctx = ac(); if (!ctx) return;
    try {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || "sine"; o.frequency.value = freq || 440;
      g.gain.value = vol == null ? 0.06 : vol;
      o.connect(g); g.connect(ctx.destination);
      var t = ctx.currentTime;
      o.start(t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.12));
      o.stop(t + (dur || 0.12) + 0.02);
    } catch (e) {}
  };
  Engine.sfx = {
    move: function () { Engine.beep(330, 0.08, "triangle"); },
    place: function () { Engine.beep(440, 0.07, "sine"); },
    flip: function () { Engine.beep(520, 0.06, "sine", 0.05); },
    win: function () { [523, 659, 784, 1047].forEach(function (f, i) { setTimeout(function () { Engine.beep(f, 0.16, "triangle", 0.07); }, i * 110); }); },
    lose: function () { [392, 330, 262].forEach(function (f, i) { setTimeout(function () { Engine.beep(f, 0.18, "sine", 0.06); }, i * 130); }); },
    tie: function () { [440, 440].forEach(function (f, i) { setTimeout(function () { Engine.beep(f, 0.12, "sine", 0.05); }, i * 150); }); }
  };

  // ---- Konfetti / Herzchen-Regen ------------------------------------
  Engine.confetti = function (opts) {
    opts = opts || {};
    var colors = opts.colors || ["#38bdf8", "#6366f1", "#fb7185", "#f472b6", "#fde047", "#34d399"];
    var hearts = opts.hearts !== false;
    var cv = Engine.el("canvas.km-confetti");
    document.body.appendChild(cv);
    var ctx = cv.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    function size() { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; }
    size();
    var N = opts.count || 140, parts = [];
    for (var i = 0; i < N; i++) {
      parts.push({
        x: Math.random() * cv.width,
        y: -Math.random() * cv.height * 0.4,
        r: (6 + Math.random() * 8) * dpr,
        vx: (Math.random() - 0.5) * 3 * dpr,
        vy: (2 + Math.random() * 3) * dpr,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.2,
        c: colors[(Math.random() * colors.length) | 0],
        heart: hearts && Math.random() < 0.45
      });
    }
    var start = performance.now(), dur = opts.duration || 2200;
    function frame(now) {
      var t = now - start;
      ctx.clearRect(0, 0, cv.width, cv.height);
      parts.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.03 * dpr; p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
        if (p.heart) drawHeart(ctx, p.r); else ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
        ctx.restore();
      });
      if (t < dur) requestAnimationFrame(frame);
      else if (cv.parentNode) cv.parentNode.removeChild(cv);
    }
    requestAnimationFrame(frame);
    window.addEventListener("resize", size, { once: true });
  };
  function drawHeart(ctx, s) {
    s = s * 0.6; ctx.beginPath();
    ctx.moveTo(0, s * 0.3);
    ctx.bezierCurveTo(0, 0, -s, 0, -s, s * 0.6);
    ctx.bezierCurveTo(-s, s * 1.1, 0, s * 1.3, 0, s * 1.6);
    ctx.bezierCurveTo(0, s * 1.3, s, s * 1.1, s, s * 0.6);
    ctx.bezierCurveTo(s, 0, 0, 0, 0, s * 0.3);
    ctx.closePath(); ctx.fill();
  }

  Engine.toast = function (msg, ms) {
    var t = Engine.el(".km-toast", { text: msg });
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("show"); });
    setTimeout(function () { t.classList.remove("show"); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 300); }, ms || 1800);
  };

  /* =====================================================================
     turnGame(def) -> fertiges Spiel-Objekt
     def = {
       id, name, emoji, tagline, help, online (bool),
       create()                -> initialState  (muss state.turn enthalten)
       applyMove(state, move, by) -> newState   (rein/pur, by = 'konsti'|'mia')
       status(state)           -> { over, winner:'konsti'|'mia'|null, draw }
       renderBoard(host, view) -> zeichnet das Brett
     }
     view (an renderBoard übergeben):
       { state, me, youAre, isMyTurn, online, names, players,
         move(m), reset(), lastMove }
     ===================================================================== */
  Engine.turnGame = function (def) {
    var game = {
      id: def.id, name: def.name, emoji: def.emoji,
      tagline: def.tagline, help: def.help,
      kind: "turn",
      online: def.online !== false
    };

    game.mount = function (host, ctx) {
      var me = ctx.me;                  // 'konsti' | 'mia'
      var useOnline = game.online && Store.room.available();
      var state = null;
      var scored = false;
      var lastMove = null;
      var unwatch = null;
      var unpresence = null;
      var presence = {};

      // Firebase löscht null/leere Werte -> Spielstand als JSON-String ablegen
      // (so übersteht ein leeres Brett – lauter null – den Sync unverändert).
      function enc(o) { return JSON.stringify(o); }
      function dec(v) { if (typeof v === "string") { try { return JSON.parse(v); } catch (e) { return null; } } return null; }

      // Layout: Statuszeile + Brett + Aktionen
      var statusEl = Engine.el(".game-status");
      var boardWrap = Engine.el(".game-board-wrap");
      var actions = Engine.el(".game-actions");
      var resetBtn = Engine.el("button.btn.btn-soft", { type: "button", onclick: doReset }, ["↺ Neues Spiel"]);
      actions.appendChild(resetBtn);
      Engine.clear(host);
      host.appendChild(statusEl);
      host.appendChild(boardWrap);
      host.appendChild(actions);

      function startState() {
        if (useOnline) {
          // Nur EIN Client legt den Startzustand an (transaction = race-sicher).
          Store.room.transaction(game.id, function (cur) {
            var c = dec(cur);
            if (c && c.state) return cur;
            return enc({ state: def.create(), scoredBy: null, ts: serverTs() });
          });
        } else {
          state = def.create();
          scored = false;
          render();
        }
      }

      if (useOnline) {
        unwatch = Store.room.watch(game.id, function (val) {
          var data = dec(val);
          if (!data || !data.state) { startState(); return; }
          state = data.state;
          scored = !!data.scoredBy;       // schon gewertet?
          render();
        });
        unpresence = Store.onPresence(function (p) { presence = p || {}; render(); });
        startState();
      } else {
        startState();
      }

      function serverTs() { return Date.now ? Date.now() : 0; }

      function isMyTurn() {
        if (!state) return false;
        if (!useOnline) return true;            // Hotseat: das Gerät spielt für beide
        return state.turn === me;
      }
      function partnerOnline() {
        var o = Engine.other(me);
        return !!presence[o];
      }

      function move(m) {
        if (!state) return;
        var by = useOnline ? me : state.turn;   // online: immer ich; lokal: wer dran ist
        if (useOnline && state.turn !== me) return;          // nicht mein Zug
        var st = def.status(state);
        if (st.over) return;
        var next;
        try { next = def.applyMove(state, m, by); } catch (e) { return; }
        if (!next || next === state) return;
        lastMove = m;
        var after = def.status(next);

        if (useOnline) {
          var payload = { state: next, ts: serverTs(), scoredBy: null };
          if (after.over) payload.scoredBy = me;     // der, der den letzten Zug macht, wertet
          Store.room.set(game.id, enc(payload));
          if (after.over) award(after);              // nur dieser Client wertet
        } else {
          state = next;
          render();
          if (after.over) award(after);
        }
        Engine.sfx.move();
      }

      function award(st) {
        if (scored) return;
        scored = true;
        setTimeout(function () {
          if (st.draw) {
            Engine.sfx.tie();
          } else if (st.winner) {
            Store.addResult(st.winner, game.id, {});
            if (!useOnline || st.winner === me) {
              Engine.sfx.win();
              Engine.confetti({ colors: [Engine.players[st.winner].color, Engine.players[st.winner].color2, "#fde047"] });
            } else {
              Engine.sfx.lose();
            }
          }
          render();
        }, 250);
      }

      function doReset() {
        scored = false; lastMove = null;
        if (useOnline) {
          Store.room.set(game.id, enc({ state: def.create(), scoredBy: null, ts: serverTs() }));
        } else {
          state = def.create(); render();
        }
        Engine.sfx.flip();
      }

      function render() {
        if (!state) {
          Engine.clear(boardWrap).appendChild(Engine.el(".muted", { text: "Lade Spiel…" }));
          return;
        }
        var st = def.status(state);

        // Statuszeile
        Engine.clear(statusEl);
        var turnP = Engine.players[state.turn];
        var line;
        if (st.over) {
          if (st.draw) line = pill("🤝 Unentschieden!", "#a78bfa");
          else line = pill(playerTag(st.winner) + " gewinnt! 🎉", Engine.players[st.winner].color);
        } else if (useOnline) {
          if (state.turn === me) line = pill("Du bist dran", turnP.color, true);
          else line = pill(turnP.name + " ist dran…", turnP.color);
        } else {
          line = pill(turnP.avatar + " " + turnP.name + " ist dran", turnP.color, true);
        }
        statusEl.appendChild(line);
        if (useOnline) {
          statusEl.appendChild(Engine.el(".presence", {
            title: partnerOnline() ? "Partner online" : "Partner offline"
          }, [ Engine.el("span.dot" + (partnerOnline() ? ".on" : "")), partnerOnline() ? (Engine.players[Engine.other(me)].name + " ist online") : (Engine.players[Engine.other(me)].name + " offline – Zug wird gespeichert") ]));
        }

        // Brett
        Engine.clear(boardWrap);
        var view = {
          state: state, me: me, youAre: me,
          isMyTurn: isMyTurn(), over: st.over, online: useOnline,
          names: { konsti: Engine.players.konsti.name, mia: Engine.players.mia.name },
          players: Engine.players, lastMove: lastMove,
          move: move, reset: doReset, status: st
        };
        def.renderBoard(boardWrap, view);
        boardWrap.classList.toggle("locked", useOnline && !isMyTurn() && !st.over);
      }

      function pill(text, color, glow) {
        return Engine.el(".turn-pill" + (glow ? ".glow" : ""), { style: { "--c": color } }, [text]);
      }
      function playerTag(id) { var p = Engine.players[id]; return p.avatar + " " + p.name; }

      // Aufräumen, wenn das Spiel verlassen wird
      game._cleanup = function () {
        if (unwatch) unwatch();
        if (unpresence) unpresence();
      };
    };

    return game;
  };

  window.Engine = Engine;
  window.GAMES = window.GAMES || [];
})();
