/* Reaktionsduell – online (synchronisierte Zeit) oder lokal ---------- */
(function () {
  "use strict";
  var E = Engine.el, P = Engine.players;
  var TARGET = 3;

  GAMES.push({
    id: "reaction",
    name: "Reaktionsduell",
    emoji: "⚡",
    tagline: "Wer reagiert bei Grün schneller?",
    help: "Wenn das Feld GRÜN wird, so schnell wie möglich tippen. Wer zu früh tippt (noch rot), verliert die Runde. Erster auf 3 gewinnt. Online wird fair über die synchronisierte Serverzeit gemessen – Latenz zählt nicht.",
    kind: "custom",
    online: true,

    mount: function (host, ctx) {
      var me = ctx.me;
      var useOnline = Store.room.available();
      Engine.clear(host);
      var wrap = E(".react-wrap");
      host.appendChild(wrap);

      if (useOnline) this._cleanup = mountOnline(); else this._cleanup = mountLocal();

      /* ============ ONLINE ============ */
      function mountOnline() {
        var state = null, unwatch = null, unpres = null, presence = {};
        var goTimer = null, graceTimer = null, slowTimer = null, scoredLocal = false, fxDone = false;
        function nowS() { return Store.now(); }
        function fresh() { return { phase: "idle", goAt: null, round: 1, scores: { konsti: 0, mia: 0 }, taps: { konsti: null, mia: null }, early: { konsti: false, mia: false }, resolved: false, roundWinner: null, scoredBy: null }; }

        unpres = Store.onPresence(function (p) { presence = p || {}; render(); });
        unwatch = Store.room.watch("reaction", function (val) {
          if (!val) { Store.room.transaction("reaction", function (c) { return c || fresh(); }); return; }
          state = val; onState(); render();
        });
        Store.room.transaction("reaction", function (c) { return c || fresh(); });

        function clearTimers() { [goTimer, graceTimer, slowTimer].forEach(function (t) { if (t) clearTimeout(t); }); goTimer = graceTimer = slowTimer = null; }

        function onState() {
          clearTimers();
          if (!state) return;
          if (state.phase === "armed" && !state.resolved) {
            var dt = state.goAt - nowS();
            var t = state.taps || {}, e = state.early || {};
            if (dt > 0) {
              goTimer = setTimeout(function () { render(); Engine.beep(880, 0.1, "square", 0.08); scheduleSlow(); }, Math.min(Math.max(dt, 0), 8000));
            } else {
              scheduleSlow();
            }
            var oneTapped = (t.konsti != null && t.mia == null && !e.mia) || (t.mia != null && t.konsti == null && !e.konsti);
            if (oneTapped) graceTimer = setTimeout(graceResolve, 2500);
            tryResolve();
          }
          maybeAward();
        }
        function scheduleSlow() {
          if (!state || state.phase !== "armed" || state.resolved) return;
          var t = state.taps || {}, e = state.early || {};
          if (t.konsti == null && t.mia == null && !e.konsti && !e.mia) {
            slowTimer = setTimeout(function () {
              Store.room.transaction("reaction", function (cur) {
                if (!cur || cur.phase !== "armed" || cur.resolved) return cur;
                var tt = cur.taps || {}, ee = cur.early || {};
                if (tt.konsti != null || tt.mia != null || ee.konsti || ee.mia) return cur;
                cur.resolved = true; cur.roundWinner = null; cur.phase = "result"; // beide zu langsam
                return cur;
              });
            }, 7000);
          }
        }

        function start() {
          var delay = 1500 + Math.floor(Math.random() * 3000);
          Store.room.update("reaction", { phase: "armed", goAt: nowS() + delay, taps: { konsti: null, mia: null }, early: { konsti: false, mia: false }, resolved: false, roundWinner: null });
        }
        function tap() {
          if (!state || state.phase !== "armed" || state.resolved) return;
          if ((state.taps && state.taps[me] != null) || (state.early && state.early[me])) return;
          var p = {};
          if (nowS() < state.goAt) p["early/" + me] = true; else p["taps/" + me] = nowS();
          Store.room.update("reaction", p);
          Engine.sfx.move();
        }
        function tryResolve() {
          Store.room.transaction("reaction", function (cur) {
            if (!cur || cur.phase !== "armed" || cur.resolved) return cur;
            var e = cur.early || {}, t = cur.taps || {}, winner, done = false;
            if (e.konsti && e.mia) { winner = null; done = true; }
            else if (e.konsti) { winner = "mia"; done = true; }
            else if (e.mia) { winner = "konsti"; done = true; }
            else if (t.konsti != null && t.mia != null) { winner = t.konsti <= t.mia ? "konsti" : "mia"; done = true; }
            if (!done) return cur;
            cur.resolved = true; cur.roundWinner = winner;
            if (winner) cur.scores[winner] = (cur.scores[winner] || 0) + 1;
            cur.phase = (cur.scores.konsti >= TARGET || cur.scores.mia >= TARGET) ? "over" : "result";
            return cur;
          });
        }
        function graceResolve() {
          graceTimer = null;
          Store.room.transaction("reaction", function (cur) {
            if (!cur || cur.phase !== "armed" || cur.resolved) return cur;
            var e = cur.early || {}, t = cur.taps || {};
            if (e.konsti || e.mia) return cur;
            var winner = null;
            if (t.konsti != null && t.mia == null) winner = "konsti";
            else if (t.mia != null && t.konsti == null) winner = "mia";
            else return cur;
            cur.resolved = true; cur.roundWinner = winner; cur.scores[winner] = (cur.scores[winner] || 0) + 1;
            cur.phase = (cur.scores.konsti >= TARGET || cur.scores.mia >= TARGET) ? "over" : "result";
            return cur;
          });
        }
        function nextRound() {
          Store.room.update("reaction", { phase: "idle", goAt: null, taps: { konsti: null, mia: null }, early: { konsti: false, mia: false }, resolved: false, roundWinner: null, round: ((state && state.round) || 1) + 1 });
        }
        function reset() { fxDone = false; scoredLocal = false; Store.room.set("reaction", fresh()); }

        function maybeAward() {
          if (!state || state.phase !== "over") return;
          var w = state.scores.konsti >= TARGET ? "konsti" : "mia";
          if (state.scoredBy) { fx(w); return; }
          if (w === me && !scoredLocal) { scoredLocal = true; Store.room.update("reaction", { scoredBy: w }); Store.addResult(w, "reaction", {}); }
          fx(w);
        }
        function fx(w) { if (fxDone) return; fxDone = true; setTimeout(function () { if (w === me) { Engine.sfx.win(); Engine.confetti({ colors: [P[w].color, P[w].color2, "#fde047"] }); } else Engine.sfx.lose(); }, 150); }
        function partner() { return !!presence[Engine.other(me)]; }
        function myReact() { return (state && state.taps && state.taps[me] != null && state.goAt) ? Math.max(0, Math.round(state.taps[me] - state.goAt)) : null; }

        function render() {
          Engine.clear(wrap);
          if (!state) { wrap.appendChild(E(".muted", { text: "Lade…" })); return; }
          wrap.appendChild(E(".react-scores", {}, [
            E(".react-sc", { style: { "--c": P.konsti.color } }, [P.konsti.avatar + " " + P.konsti.name + ": " + (state.scores.konsti || 0)]),
            E(".react-sc", { style: { "--c": P.mia.color } }, [P.mia.avatar + " " + P.mia.name + ": " + (state.scores.mia || 0)])
          ]));
          wrap.appendChild(E(".presence.center", {}, [E("span.dot" + (partner() ? ".on" : "")), partner() ? (P[Engine.other(me)].name + " ist da") : (P[Engine.other(me)].name + " offline")]));

          var phase = state.phase;
          var green = (phase === "armed" && !state.resolved && nowS() >= state.goAt);
          var waiting = (phase === "armed" && !state.resolved && nowS() < state.goAt);
          var iActed = (state.taps && state.taps[me] != null) || (state.early && state.early[me]);
          var field = E(".react-field.online" + (waiting ? ".waiting" : green ? ".go" : ""));
          var zone = E(".react-zone" + (waiting ? ".waiting" : green ? ".go" : ""), {
            style: { "--c": P[me].color },
            onpointerdown: function (ev) { ev.preventDefault(); if (phase === "armed" && !state.resolved && !iActed) tap(); }
          });
          var center = E(".react-center");

          if (phase === "idle") {
            center.appendChild(E(".react-msg.small", { text: state.round > 1 ? ("Runde " + state.round) : "Bereit?" }));
            center.appendChild(E("button.btn.btn-primary.react-start", { onclick: start }, ["▶ Start"]));
          } else if (phase === "armed" && !state.resolved) {
            if (green) {
              center.appendChild(E(".react-msg.go", { text: "JETZT!" }));
              center.appendChild(E(".react-sub", { text: iActed ? (myReact() != null ? ("Du: " + myReact() + " ms – warte…") : "getippt – warte…") : "TIPP auf das Feld!" }));
            } else {
              center.appendChild(E(".react-msg", { text: "Achtung… warten" }));
              center.appendChild(E(".react-sub", { text: iActed ? "🙈 zu früh getippt!" : "Noch nicht tippen…" }));
            }
          } else if (phase === "result") {
            center.appendChild(resultMsg());
            center.appendChild(E("button.btn.btn-primary", { onclick: nextRound }, ["Nächste Runde →"]));
          } else if (phase === "over") {
            var w = state.scores.konsti >= TARGET ? "konsti" : "mia";
            center.appendChild(E(".react-msg.small", { style: { "--c": P[w].color }, text: P[w].avatar + " " + P[w].name + " gewinnt! 🎉" }));
            center.appendChild(E("button.btn.btn-primary", { onclick: reset }, ["↺ Nochmal"]));
          }
          field.appendChild(zone); field.appendChild(center);
          wrap.appendChild(field);
        }
        function resultMsg() {
          var w = state.roundWinner;
          if (!w) return E(".react-msg.small", { text: "Niemand schnell genug – nochmal!" });
          var kr = (state.taps && state.taps.konsti != null && state.goAt) ? Math.round(state.taps.konsti - state.goAt) : null;
          var mr = (state.taps && state.taps.mia != null && state.goAt) ? Math.round(state.taps.mia - state.goAt) : null;
          var early = state.early && (state.early.konsti || state.early.mia);
          var detail = early ? "Frühstart!" : ((P.konsti.avatar + " " + (kr != null ? kr + "ms" : "–")) + "  ·  " + (P.mia.avatar + " " + (mr != null ? mr + "ms" : "–")));
          var box = E("div");
          box.appendChild(E(".react-msg.small", { style: { "--c": P[w].color }, text: w === me ? "Du warst schneller! ⚡" : (P[w].name + " war schneller!") }));
          box.appendChild(E(".react-sub", { text: detail }));
          return box;
        }

        return function () { clearTimers(); if (unwatch) unwatch(); if (unpres) unpres(); };
      }

      /* ============ LOKAL (ein Gerät, zwei Hälften) ============ */
      function mountLocal() {
        var scores = { konsti: 0, mia: 0 }, phase = "idle", roundMsg = "", roundWinner = null, timer = null, scored = false;
        render();
        function clearTimer() { if (timer) { clearTimeout(timer); timer = null; } }
        function startRound() { if (phase === "waiting") return; phase = "waiting"; roundMsg = ""; roundWinner = null; render(); var d = 1400 + Math.random() * 3200; clearTimer(); timer = setTimeout(function () { phase = "go"; Engine.beep(880, 0.1, "square", 0.08); render(); }, d); }
        function tap(who) {
          if (phase === "go") { roundWinner = who; scores[who]++; roundMsg = P[who].avatar + " " + P[who].name + " war schneller!"; finish(); }
          else if (phase === "waiting") { clearTimer(); var o = Engine.other(who); roundWinner = o; scores[o]++; roundMsg = "Zu früh, " + P[who].name + "! Punkt für " + P[o].name + "."; finish(); }
        }
        function finish() { clearTimer(); if (scores.konsti >= TARGET || scores.mia >= TARGET) { phase = "over"; var w = scores.konsti >= TARGET ? "konsti" : "mia"; if (!scored) { scored = true; Store.addResult(w, "reaction", {}); Engine.sfx.win(); Engine.confetti({ colors: [P[w].color, P[w].color2, "#fde047"] }); } } else { phase = "result"; Engine.sfx.move(); } render(); }
        function reset() { scores = { konsti: 0, mia: 0 }; phase = "idle"; scored = false; roundWinner = null; roundMsg = ""; render(); }
        function render() {
          Engine.clear(wrap);
          wrap.appendChild(E(".react-scores", {}, [
            E(".react-sc", { style: { "--c": P.mia.color } }, [P.mia.avatar + " " + P.mia.name + ": " + scores.mia]),
            E(".react-sc", { style: { "--c": P.konsti.color } }, [P.konsti.avatar + " " + P.konsti.name + ": " + scores.konsti])
          ]));
          var field = E(".react-field." + phase);
          var top = E(".react-half.top" + (roundWinner === "mia" ? ".won" : ""), { style: { "--c": P.mia.color }, onpointerdown: function (e) { e.preventDefault(); if (phase === "go" || phase === "waiting") tap("mia"); } }, [E(".react-half-label", { text: P.mia.avatar + " " + P.mia.name })]);
          var center = E(".react-center");
          if (phase === "idle") center.appendChild(E("button.btn.btn-primary.react-start", { onclick: startRound }, ["▶ Start"]));
          else if (phase === "waiting") center.appendChild(E(".react-msg", { text: "Achtung… warten!" }));
          else if (phase === "go") center.appendChild(E(".react-msg.go", { text: "JETZT!" }));
          else if (phase === "result") { center.appendChild(E(".react-msg.small", { text: roundMsg })); center.appendChild(E("button.btn.btn-primary", { onclick: startRound }, ["Nächste Runde →"])); }
          else if (phase === "over") { var w = scores.konsti >= TARGET ? "konsti" : "mia"; center.appendChild(E(".react-msg.small", { style: { "--c": P[w].color }, text: P[w].avatar + " " + P[w].name + " gewinnt! 🎉" })); center.appendChild(E("button.btn.btn-primary", { onclick: reset }, ["↺ Nochmal"])); }
          var bottom = E(".react-half.bottom" + (roundWinner === "konsti" ? ".won" : ""), { style: { "--c": P.konsti.color }, onpointerdown: function (e) { e.preventDefault(); if (phase === "go" || phase === "waiting") tap("konsti"); } }, [E(".react-half-label", { text: P.konsti.avatar + " " + P.konsti.name })]);
          field.appendChild(top); field.appendChild(center); field.appendChild(bottom);
          wrap.appendChild(field);
        }
        return function () { clearTimer(); };
      }
    }
  });
})();
