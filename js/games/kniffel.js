/* Kniffel (Yahtzee) – rundenbasiert, online oder lokal --------------- */
(function () {
  "use strict";
  var E = Engine.el, P = Engine.players;

  var UPPER = [
    { id: "ones", name: "Einser", face: 1 },
    { id: "twos", name: "Zweier", face: 2 },
    { id: "threes", name: "Dreier", face: 3 },
    { id: "fours", name: "Vierer", face: 4 },
    { id: "fives", name: "Fünfer", face: 5 },
    { id: "sixes", name: "Sechser", face: 6 }
  ];
  var LOWER = [
    { id: "dreierpasch", name: "Dreierpasch" },
    { id: "viererpasch", name: "Viererpasch" },
    { id: "fullhouse", name: "Full House" },
    { id: "kleine", name: "Kleine Straße" },
    { id: "grosse", name: "Große Straße" },
    { id: "kniffel", name: "Kniffel" },
    { id: "chance", name: "Chance" }
  ];
  var ALL = UPPER.concat(LOWER);
  // Pip-Muster pro Würfelwert (Positionen 0..8 im 3x3-Raster)
  var PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function counts(dice) { var c = [0, 0, 0, 0, 0, 0, 0]; dice.forEach(function (d) { if (d >= 1 && d <= 6) c[d]++; }); return c; }
  function sum(dice) { var s = 0; dice.forEach(function (d) { if (d >= 1) s += d; }); return s; }
  function hasRun(dice, run) { for (var i = 0; i < run.length; i++) if (dice.indexOf(run[i]) < 0) return false; return true; }

  function scoreFor(catId, dice) {
    var c = counts(dice), s = sum(dice), max = Math.max(c[1], c[2], c[3], c[4], c[5], c[6]);
    for (var i = 0; i < UPPER.length; i++) if (UPPER[i].id === catId) return c[UPPER[i].face] * UPPER[i].face;
    switch (catId) {
      case "dreierpasch": return max >= 3 ? s : 0;
      case "viererpasch": return max >= 4 ? s : 0;
      case "fullhouse":
        var nz = []; for (var f = 1; f <= 6; f++) if (c[f] > 0) nz.push(c[f]); nz.sort();
        return (nz.length === 2 && nz[0] === 2 && nz[1] === 3) ? 25 : 0;
      case "kleine":
        return (hasRun(dice, [1, 2, 3, 4]) || hasRun(dice, [2, 3, 4, 5]) || hasRun(dice, [3, 4, 5, 6])) ? 30 : 0;
      case "grosse":
        return (hasRun(dice, [1, 2, 3, 4, 5]) || hasRun(dice, [2, 3, 4, 5, 6])) ? 40 : 0;
      case "kniffel": return max >= 5 ? 50 : 0;
      case "chance": return s;
    }
    return 0;
  }

  function blankSheet() { var o = {}; ALL.forEach(function (cat) { o[cat.id] = null; }); return o; }
  function totals(sheet) {
    var up = 0; UPPER.forEach(function (cat) { up += sheet[cat.id] || 0; });
    var bonus = up >= 63 ? 35 : 0;
    var low = 0; LOWER.forEach(function (cat) { low += sheet[cat.id] || 0; });
    return { up: up, bonus: bonus, low: low, total: up + bonus + low };
  }
  function sheetFull(sheet) { for (var i = 0; i < ALL.length; i++) if (sheet[ALL[i].id] == null) return false; return true; }

  GAMES.push({
    id: "kniffel",
    name: "Kniffel",
    emoji: "🎲",
    tagline: "Würfel-Klassiker: 5 Würfel, 13 Felder.",
    help: "Pro Zug bis zu 3-mal würfeln; nach jedem Wurf könnt ihr Würfel zum Behalten antippen. Danach tragt ihr das Ergebnis in ein freies Feld eures Blocks ein – auch eine 0, wenn nichts passt. Oben (Einser–Sechser) gibt's ab 63 Punkten 35 Bonus. Wer am Ende die höchste Gesamtsumme hat, gewinnt.",
    kind: "custom",
    online: true,

    mount: function (host, ctx) {
      var me = ctx.me;
      var useOnline = Store.room.available();
      var state = null, scoredLocal = false, unwatch = null, unpres = null, presence = {};
      function enc(o) { return JSON.stringify(o); }
      function dec(v) { if (typeof v === "string") { try { return JSON.parse(v); } catch (e) { return null; } } return null; }

      Engine.clear(host);
      var wrap = E(".kn-wrap");
      host.appendChild(wrap);

      function create() {
        return {
          turn: Math.random() < 0.5 ? "konsti" : "mia",
          dice: [0, 0, 0, 0, 0], held: [false, false, false, false, false],
          rollsLeft: 3, rolled: false,
          sheets: { konsti: blankSheet(), mia: blankSheet() },
          over: false, scoredBy: null, mid: Engine.uid()
        };
      }
      function start() {
        if (useOnline) Store.room.transaction("kniffel", function (cur) { var c = dec(cur); if (c && c.sheets) return cur; return enc(create()); });
        else { state = create(); scoredLocal = false; render(); }
      }
      function write(s) { if (useOnline) Store.room.set("kniffel", enc(s)); else { state = s; render(); maybeAward(); } }

      if (useOnline) {
        unwatch = Store.room.watch("kniffel", function (val) {
          var data = dec(val);
          if (!data || !data.sheets) { start(); return; }
          state = data; render(); maybeAward();
        });
        unpres = Store.onPresence(function (p) { presence = p || {}; render(); });
        start();
      } else { start(); }

      function allowed() { return state && !state.over && (useOnline ? state.turn === me : true); }
      function partnerOnline() { return !!presence[Engine.other(me)]; }

      function roll() {
        if (!allowed() || state.rollsLeft <= 0) return;
        var s = clone(state);
        for (var i = 0; i < 5; i++) if (!(s.rolled && s.held[i])) s.dice[i] = 1 + Math.floor(Math.random() * 6);
        s.rollsLeft--; s.rolled = true;
        Engine.sfx.move();
        write(s);
      }
      function toggleHold(i) {
        if (!allowed() || !state.rolled || state.rollsLeft <= 0) return;
        var s = clone(state); s.held[i] = !s.held[i]; Engine.sfx.flip(); write(s);
      }
      function score(catId) {
        if (!allowed() || !state.rolled) return;
        if (state.sheets[state.turn][catId] != null) return;
        var s = clone(state);
        s.sheets[s.turn][catId] = scoreFor(catId, s.dice);
        if (sheetFull(s.sheets.konsti) && sheetFull(s.sheets.mia)) { s.over = true; }
        else { s.turn = Engine.other(s.turn); s.dice = [0, 0, 0, 0, 0]; s.held = [false, false, false, false, false]; s.rollsLeft = 3; s.rolled = false; }
        Engine.sfx.place();
        write(s);
      }
      function reset() { scoredLocal = false; if (useOnline) Store.room.set("kniffel", enc(create())); else { state = create(); render(); } }

      function maybeAward() {
        if (!state || !state.over || scoredLocal) return;
        scoredLocal = true;
        var tk = totals(state.sheets.konsti).total, tm = totals(state.sheets.mia).total;
        var w = tk > tm ? "konsti" : tm > tk ? "mia" : null;
        if (w) Store.addResult(w, "kniffel", { token: "kniffel:" + (state.mid || "") });
        setTimeout(function () {
          if (!w) Engine.sfx.tie();
          else if (!useOnline || w === me) { Engine.sfx.win(); Engine.confetti({ colors: [P[w].color, P[w].color2, "#fde047"] }); }
          else Engine.sfx.lose();
        }, 200);
      }

      function die(i) {
        var v = state.dice[i], held = state.held[i];
        var canHold = allowed() && state.rolled && state.rollsLeft > 0;
        var d = E(".kn-die" + (held ? ".held" : "") + (v ? "" : ".blank") + (canHold ? ".tap" : ""), {
          onclick: function () { if (canHold && v) toggleHold(i); }
        });
        if (v) for (var p = 0; p < 9; p++) d.appendChild(E(".kn-pip" + (PIPS[v].indexOf(p) >= 0 ? ".on" : "")));
        return d;
      }

      function cell(pid, cat) {
        var v = state.sheets[pid][cat.id];
        if (v != null) return E(".kn-cell.filled", { style: { "--c": P[pid].color } }, [String(v)]);
        var canPick = !state.over && state.rolled && (useOnline ? (pid === me && state.turn === me) : (pid === state.turn));
        if (canPick) {
          var pv = scoreFor(cat.id, state.dice);
          return E("button.kn-cell.pick" + (pv === 0 ? ".zero" : ""), { style: { "--c": P[pid].color }, onclick: function () { score(cat.id); } }, [String(pv)]);
        }
        return E(".kn-cell.empty", {}, ["·"]);
      }
      function totalRow(label, kv, mv, cls) {
        return E(".kn-row.total" + (cls ? "." + cls : ""), {}, [
          E(".kn-cell.sum", { style: { "--c": P.konsti.color } }, [String(kv)]),
          E(".kn-name", {}, [label]),
          E(".kn-cell.sum", { style: { "--c": P.mia.color } }, [String(mv)])
        ]);
      }

      function render() {
        if (!state) { Engine.clear(wrap).appendChild(E(".muted", { text: "Lade…" })); return; }
        Engine.clear(wrap);

        // Statuszeile
        var st;
        if (state.over) {
          var tk = totals(state.sheets.konsti).total, tm = totals(state.sheets.mia).total;
          var w = tk > tm ? "konsti" : tm > tk ? "mia" : null;
          st = w ? mkPill(P[w].avatar + " " + P[w].name + " gewinnt! 🎉", P[w].color) : mkPill("🤝 Unentschieden!", "#a78bfa");
        } else {
          var tp = P[state.turn];
          if (useOnline) st = state.turn === me ? mkPill("Du bist dran", tp.color, true) : mkPill(tp.name + " ist dran…", tp.color);
          else st = mkPill(tp.avatar + " " + tp.name + " ist dran", tp.color, true);
        }
        var status = E(".game-status", {}, [st]);
        if (useOnline) status.appendChild(E(".presence", {}, [E("span.dot" + (partnerOnline() ? ".on" : "")), partnerOnline() ? (P[Engine.other(me)].name + " online") : (P[Engine.other(me)].name + " offline")]));
        wrap.appendChild(status);

        // Würfel
        if (!state.over) {
          var diceRow = E(".kn-dice");
          for (var i = 0; i < 5; i++) diceRow.appendChild(die(i));
          wrap.appendChild(diceRow);

          var canRoll = allowed() && state.rollsLeft > 0;
          var rollBtn = E("button.btn.btn-primary.kn-roll", { disabled: !canRoll, onclick: roll },
            [state.rolled ? ("🎲 Nochmal (noch " + state.rollsLeft + ")") : "🎲 Würfeln"]);
          wrap.appendChild(E(".kn-controls", {}, [rollBtn]));
          if (allowed() && state.rolled && state.rollsLeft > 0) wrap.appendChild(E(".kn-hint", { text: "Würfel zum Behalten antippen – oder unten ein Feld eintragen." }));
          else if (allowed() && state.rolled) wrap.appendChild(E(".kn-hint", { text: "Letzter Wurf – jetzt ein Feld eintragen." }));
          else if (allowed() && !state.rolled) wrap.appendChild(E(".kn-hint", { text: "Tippe auf Würfeln, um zu starten." }));
        }

        // Block
        var sheet = E(".kn-sheet");
        sheet.appendChild(E(".kn-row.head", {}, [
          E(".kn-cell.hd", { style: { "--c": P.konsti.color } }, [P.konsti.avatar]),
          E(".kn-name.hd", {}, ["Kategorie"]),
          E(".kn-cell.hd", { style: { "--c": P.mia.color } }, [P.mia.avatar])
        ]));
        UPPER.forEach(function (cat) { sheet.appendChild(E(".kn-row", {}, [cell("konsti", cat), E(".kn-name", {}, [cat.name]), cell("mia", cat)])); });
        var ku = totals(state.sheets.konsti), mu = totals(state.sheets.mia);
        sheet.appendChild(totalRow("Bonus (ab 63)", ku.bonus, mu.bonus, "minor"));
        LOWER.forEach(function (cat) { sheet.appendChild(E(".kn-row", {}, [cell("konsti", cat), E(".kn-name", {}, [cat.name]), cell("mia", cat)])); });
        sheet.appendChild(totalRow("Gesamt", ku.total, mu.total, "grand"));
        wrap.appendChild(sheet);

        wrap.appendChild(E(".game-actions", {}, [E("button.btn.btn-soft", { onclick: reset }, ["↺ Neues Spiel"])]));
      }
      function mkPill(t, c, glow) { return E(".turn-pill" + (glow ? ".glow" : ""), { style: { "--c": c } }, [t]); }

      this._cleanup = function () { if (unwatch) unwatch(); if (unpres) unpres(); };
    }
  });
})();
