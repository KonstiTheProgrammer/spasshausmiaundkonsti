/* Schere - Stein - Papier --------------------------------------------- */
(function () {
  "use strict";
  var E = Engine.el, P = Engine.players;
  var CH = [
    { k: "stein", e: "✊", label: "Stein" },
    { k: "papier", e: "✋", label: "Papier" },
    { k: "schere", e: "✌️", label: "Schere" }
  ];
  var BEATS = { stein: "schere", schere: "papier", papier: "stein" };
  var TARGET = 3; // wer zuerst 3 Runden hat
  function emoji(k) { for (var i = 0; i < CH.length; i++) if (CH[i].k === k) return CH[i].e; return "❔"; }
  function roundWinner(kPick, mPick) {
    if (!kPick || !mPick || kPick === mPick) return null;
    return BEATS[kPick] === mPick ? "konsti" : "mia";
  }
  function isOver(scores) { return scores.konsti >= TARGET || scores.mia >= TARGET; }

  GAMES.push({
    id: "rps",
    name: "Schere Stein Papier",
    emoji: "✌️",
    tagline: "Best of 5 – gleichzeitig wählen!",
    help: "Beide wählen gleichzeitig Stein, Papier oder Schere. Stein schlägt Schere, Schere schlägt Papier, Papier schlägt Stein. Wer zuerst 3 Runden gewinnt, holt den Punkt.",
    kind: "custom",
    online: true,

    mount: function (host, ctx) {
      var me = ctx.me;
      var useOnline = Store.room.available();
      var scoredLocal = false, unwatch = null, unpres = null, presence = {};

      Engine.clear(host);
      var area = E(".rps-area");
      host.appendChild(area);

      // ---------- ONLINE ----------
      if (useOnline) {
        var state = null;
        unpres = Store.onPresence(function (p) { presence = p || {}; renderOnline(); });
        unwatch = Store.room.watch("rps", function (val) {
          if (!val) { Store.room.transaction("rps", function (c) { return c || fresh(); }); return; }
          state = val;
          if (!state.picks) state.picks = { konsti: null, mia: null };
          if (!state.scores) state.scores = { konsti: 0, mia: 0 };
          tryResolve(); maybeAward(); renderOnline();
        });
        Store.room.transaction("rps", function (c) { return c || fresh(); });
        this._cleanup = function () { if (unwatch) unwatch(); if (unpres) unpres(); };

        function fresh() { return { round: 1, scores: { konsti: 0, mia: 0 }, picks: { konsti: null, mia: null }, reveal: false, last: null, scoredBy: null }; }
        function pick(k) {
          if (!state || state.reveal || isOver(state.scores)) return;
          if (state.picks[me]) return;
          Engine.sfx.move();
          var patch = {}; patch["picks/" + me] = k;
          Store.room.update("rps", patch);
        }
        function tryResolve() {
          Store.room.transaction("rps", function (cur) {
            if (!cur || cur.reveal) return cur;
            if (!cur.picks || !cur.picks.konsti || !cur.picks.mia) return cur;
            var w = roundWinner(cur.picks.konsti, cur.picks.mia);
            cur.reveal = true;
            cur.last = { konsti: cur.picks.konsti, mia: cur.picks.mia, winner: w };
            if (w) cur.scores[w] = (cur.scores[w] || 0) + 1;
            return cur;
          });
        }
        function next() {
          Store.room.transaction("rps", function (cur) {
            if (!cur || !cur.reveal) return cur;
            cur.reveal = false; cur.picks = { konsti: null, mia: null }; cur.round = (cur.round || 1) + 1;
            return cur;
          });
        }
        function maybeAward() {
          if (!state || !isOver(state.scores)) { return; }
          var winner = state.scores.konsti >= TARGET ? "konsti" : "mia";
          if (state.scoredBy) { fxOnce(winner); return; }
          if (winner === me && !scoredLocal) {
            scoredLocal = true;
            Store.room.update("rps", { scoredBy: winner });
            Store.addResult(winner, "rps", {});
          }
          fxOnce(winner);
        }
        var fxDone = false;
        function fxOnce(winner) {
          if (fxDone) return; fxDone = true;
          setTimeout(function () {
            if (winner === me) { Engine.sfx.win(); Engine.confetti({ colors: [P[winner].color, P[winner].color2, "#fde047"] }); }
            else Engine.sfx.lose();
          }, 150);
        }
        function reset() { fxDone = false; scoredLocal = false; Store.room.set("rps", fresh()); }

        function renderOnline() {
          Engine.clear(area);
          if (!state) { area.appendChild(E(".muted", { text: "Lade…" })); return; }
          area.appendChild(seriesHeader(state.scores, state.round));
          var partner = !!presence[Engine.other(me)];
          area.appendChild(E(".presence.center", {}, [E("span.dot" + (partner ? ".on" : "")), partner ? (P[Engine.other(me)].name + " ist da") : (P[Engine.other(me)].name + " ist offline")]));

          if (isOver(state.scores)) {
            var w = state.scores.konsti >= TARGET ? "konsti" : "mia";
            area.appendChild(bigResult(w === me ? "Du gewinnst die Runde! 🎉" : (P[w].name + " gewinnt die Runde!"), w));
            area.appendChild(E(".game-actions", {}, [E("button.btn.btn-primary", { onclick: reset }, ["↺ Nochmal"])]));
            return;
          }

          if (state.reveal && state.last) {
            area.appendChild(revealView(state.last));
            area.appendChild(E(".game-actions", {}, [E("button.btn.btn-primary", { onclick: next }, ["Weiter →"])]));
            return;
          }

          // Auswahlphase
          var iPicked = !!state.picks[me];
          var theyPicked = !!state.picks[Engine.other(me)];
          area.appendChild(E(".rps-prompt", { text: iPicked ? (theyPicked ? "Beide bereit…" : "Warte auf " + P[Engine.other(me)].name + "…") : "Wähle deine Waffe!" }));
          area.appendChild(choiceRow(function (k) { pick(k); }, iPicked ? state.picks[me] : null, iPicked));
          area.appendChild(E(".rps-hint", {}, [
            E("span.rps-status" + (iPicked ? ".ok" : ""), { text: P[me].name + (iPicked ? " ✓" : " …") }),
            E("span.rps-status" + (theyPicked ? ".ok" : ""), { text: P[Engine.other(me)].name + (theyPicked ? " ✓" : " …") })
          ]));
        }
        return;
      }

      // ---------- LOKAL (Hotseat, verdeckt) ----------
      var L = { round: 1, scores: { konsti: 0, mia: 0 }, picks: { konsti: null, mia: null }, phase: "pick", who: "konsti", last: null };
      this._cleanup = function () {};
      renderLocal();

      function renderLocal() {
        Engine.clear(area);
        area.appendChild(seriesHeader(L.scores, L.round));

        if (isOver(L.scores)) {
          var w = L.scores.konsti >= TARGET ? "konsti" : "mia";
          if (!scoredLocal) { scoredLocal = true; Store.addResult(w, "rps", {}); Engine.sfx.win(); Engine.confetti({ colors: [P[w].color, P[w].color2, "#fde047"] }); }
          area.appendChild(bigResult(P[w].avatar + " " + P[w].name + " gewinnt die Runde! 🎉", w));
          area.appendChild(E(".game-actions", {}, [E("button.btn.btn-primary", { onclick: function () { L = { round: 1, scores: { konsti: 0, mia: 0 }, picks: { konsti: null, mia: null }, phase: "pick", who: "konsti", last: null }; scoredLocal = false; renderLocal(); } }, ["↺ Nochmal"])]));
          return;
        }

        if (L.phase === "pick") {
          var cur = L.who;
          area.appendChild(E(".rps-prompt.big", { style: { "--c": P[cur].color } }, [P[cur].avatar + " " + P[cur].name + " ist dran"]));
          area.appendChild(E(".rps-secret", { text: (cur === "konsti" ? P.mia.name : P.konsti.name) + " bitte kurz wegschauen 🙈" }));
          area.appendChild(choiceRow(function (k) {
            L.picks[cur] = k; Engine.sfx.move();
            if (cur === "konsti") { L.who = "mia"; }
            else { L.phase = "reveal"; L.last = { konsti: L.picks.konsti, mia: L.picks.mia, winner: roundWinner(L.picks.konsti, L.picks.mia) }; var w = L.last.winner; if (w) L.scores[w]++; }
            renderLocal();
          }, null, false));
          return;
        }

        if (L.phase === "reveal") {
          area.appendChild(revealView(L.last));
          area.appendChild(E(".game-actions", {}, [E("button.btn.btn-primary", {
            onclick: function () { L.phase = "pick"; L.who = "konsti"; L.picks = { konsti: null, mia: null }; L.last = null; renderLocal(); }
          }, ["Weiter →"])]));
        }
      }

      // ---------- gemeinsame UI-Bausteine ----------
      function seriesHeader(scores, round) {
        return E(".rps-series", {}, [
          E(".rps-score", { style: { "--c": P.konsti.color } }, [E("span.ava", { text: P.konsti.avatar }), E("b", { text: P.konsti.name }), E("span.num", { text: String(scores.konsti) })]),
          E(".rps-vs", { text: "Best of 5" }),
          E(".rps-score", { style: { "--c": P.mia.color } }, [E("span.num", { text: String(scores.mia) }), E("b", { text: P.mia.name }), E("span.ava", { text: P.mia.avatar })])
        ]);
      }
      function choiceRow(onPick, picked, disabled) {
        var row = E(".rps-choices");
        CH.forEach(function (c) {
          row.appendChild(E("button.rps-btn" + (picked === c.k ? ".chosen" : ""), {
            type: "button", disabled: disabled || false, onclick: function () { if (!disabled) onPick(c.k); }
          }, [E(".rps-emoji", { text: c.e }), E("span", { text: c.label })]));
        });
        return row;
      }
      function revealView(last) {
        var w = last.winner;
        var box = E(".rps-reveal");
        box.appendChild(E(".rps-side", { style: { "--c": P.konsti.color } }, [E(".rps-big" + (w === "konsti" ? ".win" : ""), { text: emoji(last.konsti) }), E("span", { text: P.konsti.name })]));
        box.appendChild(E(".rps-mid", { text: w ? "▶" : "=" }));
        box.appendChild(E(".rps-side", { style: { "--c": P.mia.color } }, [E(".rps-big" + (w === "mia" ? ".win" : ""), { text: emoji(last.mia) }), E("span", { text: P.mia.name })]));
        var cap = w ? (P[w].avatar + " " + P[w].name + " holt die Runde!") : "Unentschieden – nochmal!";
        var wrap = E("div");
        wrap.appendChild(box);
        wrap.appendChild(E(".rps-roundres", { style: { "--c": w ? P[w].color : "#a78bfa" }, text: cap }));
        return wrap;
      }
      function bigResult(text, w) {
        return E(".rps-final", { style: { "--c": P[w].color } }, [E(".rps-final-ava", { text: P[w].avatar }), E("div", { text: text })]);
      }
    }
  });
})();
