/* Memory / Paare ------------------------------------------------------ */
(function () {
  "use strict";
  var E = Engine.el, P = Engine.players;
  var POOL = ["💖", "🌙", "⭐", "🌸", "🍓", "🎈", "🌈", "🍯", "🦋", "🌻", "🎁", "☕", "🍕", "🪐", "🧁", "🐧", "🎸", "🍉"];
  var PAIRS = 8; // 4x4 Raster

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function newState() {
    var chosen = shuffle(POOL.slice()).slice(0, PAIRS);
    var deck = shuffle(chosen.concat(chosen.slice()));
    return {
      deck: deck,
      owner: deck.map(function () { return null; }),
      up: [],
      lock: false,
      turn: Math.random() < 0.5 ? "konsti" : "mia",
      pairs: { konsti: 0, mia: 0 },
      scoredBy: null, mid: Engine.uid()
    };
  }
  function statusOf(s) {
    var done = s.owner.every(function (o) { return !!o; });
    if (!done) return { over: false };
    if (s.pairs.konsti === s.pairs.mia) return { over: true, draw: true, winner: null };
    return { over: true, draw: false, winner: s.pairs.konsti > s.pairs.mia ? "konsti" : "mia" };
  }

  GAMES.push({
    id: "memory",
    name: "Memory",
    emoji: "🧠",
    tagline: "Finde die Paare – wer merkt sich mehr?",
    help: "Deckt zwei Karten auf. Passen sie zusammen, bekommt ihr das Paar und seid nochmal dran. Wer am Ende mehr Paare hat, gewinnt.",
    kind: "custom",
    online: true,

    mount: function (host, ctx) {
      var me = ctx.me;
      var useOnline = Store.room.available();
      var state = null, scored = false, resolving = false, unwatch = null, unpres = null, presence = {};
      // Firebase löscht null/leere Werte -> als JSON-String ablegen (Karten/owner bleiben intakt).
      function enc(o) { return JSON.stringify(o); }
      function dec(v) { if (typeof v === "string") { try { return JSON.parse(v); } catch (e) { return null; } } return null; }

      var statusEl = E(".game-status");
      var scoreRow = E(".memory-scores");
      var boardWrap = E(".game-board-wrap");
      var actions = E(".game-actions", {}, [E("button.btn.btn-soft", { type: "button", onclick: reset }, ["↺ Neues Spiel"])]);
      Engine.clear(host); host.appendChild(statusEl); host.appendChild(scoreRow); host.appendChild(boardWrap); host.appendChild(actions);

      function isActor() { return useOnline ? state && state.turn === me : true; }

      function start() {
        if (useOnline) {
          Store.room.transaction("memory", function (cur) {
            var c = dec(cur);
            if (c && c.deck) return cur;
            return enc(newState());
          });
        } else { state = newState(); scored = false; render(); }
      }
      function write(s) { if (useOnline) Store.room.set("memory", enc(s)); else { state = s; render(); maybeResolve(); maybeAward(); } }

      if (useOnline) {
        unwatch = Store.room.watch("memory", function (val) {
          var data = dec(val);
          if (!data || !data.deck) { start(); return; }
          state = data; render(); maybeResolve(); maybeAward();
        });
        unpres = Store.onPresence(function (p) { presence = p || {}; render(); });
        start();
      } else { start(); }

      function flip(idx) {
        if (!state || state.lock || resolving) return;
        if (!isActor()) return;
        if (state.owner[idx] || state.up.indexOf(idx) >= 0 || state.up.length >= 2) return;
        var s = JSON.parse(JSON.stringify(state));
        s.up.push(idx);
        if (s.up.length === 2) s.lock = true;
        Engine.sfx.flip();
        write(s);
        // Im Online-Modus löst der watch-Handler maybeResolve aus; lokal direkt:
      }

      function maybeResolve() {
        if (!state || !state.lock || resolving) return;
        if (!isActor()) return; // nur der aktive Spieler löst auf (kein Doppel-Write)
        resolving = true;
        setTimeout(function () {
          resolving = false;
          if (!state || !state.lock) return;
          var s = JSON.parse(JSON.stringify(state));
          var a = s.up[0], b = s.up[1];
          if (s.deck[a] === s.deck[b]) {
            s.owner[a] = s.turn; s.owner[b] = s.turn;
            s.pairs[s.turn] = (s.pairs[s.turn] || 0) + 1;
            s.up = []; s.lock = false;
            Engine.sfx.place();
          } else {
            s.up = []; s.lock = false;
            s.turn = Engine.other(s.turn);
          }
          var st = statusOf(s);
          if (st.over) s.scoredBy = me;
          write(s);
        }, 950);
      }

      function maybeAward() {
        if (!state || scored) return;
        var st = statusOf(state);
        if (!st.over) return;
        scored = true;
        // Token -> Punkt wird genau einmal vergeben (egal welcher Client/Reload).
        if (!st.draw && st.winner) Store.addResult(st.winner, "memory", { token: "memory:" + (state.mid || "") });
        finishFx(st);
      }
      function finishFx(st) {
        setTimeout(function () {
          if (st.draw) Engine.sfx.tie();
          else if (st.winner === me || !useOnline) { Engine.sfx.win(); Engine.confetti({ colors: [P[st.winner].color, P[st.winner].color2, "#fde047"] }); }
          else Engine.sfx.lose();
        }, 200);
      }

      function reset() {
        scored = false; resolving = false;
        if (useOnline) Store.room.set("memory", enc(newState()));
        else { state = newState(); render(); }
        Engine.sfx.flip();
      }

      function partnerOnline() { return !!presence[Engine.other(me)]; }

      function render() {
        if (!state) { Engine.clear(boardWrap).appendChild(E(".muted", { text: "Lade…" })); return; }
        var st = statusOf(state);

        Engine.clear(statusEl);
        var turnP = P[state.turn];
        var line;
        if (st.over) line = st.draw ? mkPill("🤝 Unentschieden!", "#a78bfa") : mkPill(P[st.winner].avatar + " " + P[st.winner].name + " gewinnt! 🎉", P[st.winner].color);
        else if (useOnline) line = state.turn === me ? mkPill("Du bist dran", turnP.color, true) : mkPill(turnP.name + " ist dran…", turnP.color);
        else line = mkPill(turnP.avatar + " " + turnP.name + " ist dran", turnP.color, true);
        statusEl.appendChild(line);
        if (useOnline) statusEl.appendChild(E(".presence", {}, [E("span.dot" + (partnerOnline() ? ".on" : "")), partnerOnline() ? (P[Engine.other(me)].name + " online") : (P[Engine.other(me)].name + " offline")]));

        Engine.clear(scoreRow);
        ["konsti", "mia"].forEach(function (id) {
          scoreRow.appendChild(E(".mem-chip" + (state.turn === id && !st.over ? ".active" : ""), { style: { "--c": P[id].color } }, [
            E("span.mem-ava", { text: P[id].avatar }),
            E("b", { text: P[id].name }),
            E("span.mem-cnt", { text: String(state.pairs[id] || 0) })
          ]));
        });

        Engine.clear(boardWrap);
        var locked = useOnline && state.turn !== me && !st.over;
        var grid = E(".memory-board" + (locked ? ".locked" : ""));
        state.deck.forEach(function (sym, idx) {
          var faceUp = state.owner[idx] || state.up.indexOf(idx) >= 0;
          var card = E(".mem-card" + (faceUp ? ".up" : "") + (state.owner[idx] ? ".matched" : ""), {
            style: state.owner[idx] ? { "--c": P[state.owner[idx]].color } : null,
            onclick: function () { if (!st.over) flip(idx); }
          });
          card.appendChild(E(".mem-inner", {}, [
            E(".mem-face.back", {}, ["💞"]),
            E(".mem-face.front", {}, [sym])
          ]));
          grid.appendChild(card);
        });
        boardWrap.appendChild(grid);
      }

      function mkPill(t, c, glow) { return E(".turn-pill" + (glow ? ".glow" : ""), { style: { "--c": c } }, [t]); }

      this._cleanup = function () { if (unwatch) unwatch(); if (unpres) unpres(); };
    }
  });
})();
