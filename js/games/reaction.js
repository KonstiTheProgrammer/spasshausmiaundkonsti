/* Reaktionsduell (nur zusammen an einem Gerät) ------------------------ */
(function () {
  "use strict";
  var E = Engine.el, P = Engine.players;
  var TARGET = 3;

  GAMES.push({
    id: "reaction",
    name: "Reaktionsduell",
    emoji: "⚡",
    tagline: "Wer ist schneller? (an einem Gerät)",
    help: "Haltet das Gerät zwischen euch. Wenn das Feld GRÜN wird, so schnell wie möglich auf DEINE Hälfte tippen. Wer zu früh tippt (noch rot), verliert die Runde. Erster auf 3 gewinnt.",
    kind: "custom",
    online: false, // Latenz wäre unfair -> immer lokal
    localOnly: true,

    mount: function (host, ctx) {
      var scores = { konsti: 0, mia: 0 };
      var phase = "idle"; // idle | waiting | go | result | over
      var roundMsg = "", roundWinner = null, goAt = 0, timer = null, scored = false;

      Engine.clear(host);
      var wrap = E(".react-wrap");
      host.appendChild(wrap);
      render();

      function clearTimer() { if (timer) { clearTimeout(timer); timer = null; } }

      function startRound() {
        if (phase === "waiting") return;
        phase = "waiting"; roundMsg = ""; roundWinner = null;
        render();
        var delay = 1400 + Math.random() * 3200;
        clearTimer();
        timer = setTimeout(function () {
          phase = "go"; goAt = (Date.now ? Date.now() : 0);
          Engine.beep(880, 0.1, "square", 0.08);
          render();
        }, delay);
      }

      function tap(who) {
        if (phase === "go") {
          roundWinner = who;
          scores[who]++;
          roundMsg = P[who].avatar + " " + P[who].name + " war schneller!";
          finishRound();
        } else if (phase === "waiting") {
          clearTimer();
          var other = Engine.other(who);
          roundWinner = other;
          scores[other]++;
          roundMsg = "Zu früh, " + P[who].name + "! Punkt für " + P[other].name + ".";
          finishRound();
        }
      }

      function finishRound() {
        clearTimer();
        if (scores.konsti >= TARGET || scores.mia >= TARGET) {
          phase = "over";
          var w = scores.konsti >= TARGET ? "konsti" : "mia";
          if (!scored) { scored = true; Store.addResult(w, "reaction", {}); Engine.sfx.win(); Engine.confetti({ colors: [P[w].color, P[w].color2, "#fde047"] }); }
        } else {
          phase = "result";
          Engine.sfx.move();
        }
        render();
      }

      function reset() { scores = { konsti: 0, mia: 0 }; phase = "idle"; scored = false; roundWinner = null; roundMsg = ""; render(); }

      function render() {
        Engine.clear(wrap);

        // Score-Leiste
        wrap.appendChild(E(".react-scores", {}, [
          E(".react-sc", { style: { "--c": P.mia.color } }, [P.mia.avatar + " " + P.mia.name + ": " + scores.mia]),
          E(".react-sc", { style: { "--c": P.konsti.color } }, [P.konsti.avatar + " " + P.konsti.name + ": " + scores.konsti])
        ]));

        var field = E(".react-field." + phase);

        // obere Hälfte = Mia (auf dem Kopf, gegenüber sitzend)
        var top = E(".react-half.top" + (roundWinner === "mia" ? ".won" : ""), {
          style: { "--c": P.mia.color },
          onpointerdown: function (e) { e.preventDefault(); if (phase === "go" || phase === "waiting") tap("mia"); }
        }, [E(".react-half-label", { text: P.mia.avatar + " " + P.mia.name })]);

        var center = E(".react-center");
        if (phase === "idle") center.appendChild(E("button.btn.btn-primary.react-start", { onclick: startRound }, ["▶ Start"]));
        else if (phase === "waiting") center.appendChild(E(".react-msg", { text: "Achtung… warten!" }));
        else if (phase === "go") center.appendChild(E(".react-msg.go", { text: "JETZT!" }));
        else if (phase === "result") {
          center.appendChild(E(".react-msg.small", { text: roundMsg }));
          center.appendChild(E("button.btn.btn-primary", { onclick: startRound }, ["Nächste Runde →"]));
        } else if (phase === "over") {
          var w = scores.konsti >= TARGET ? "konsti" : "mia";
          center.appendChild(E(".react-msg.small", { style: { "--c": P[w].color }, text: P[w].avatar + " " + P[w].name + " gewinnt! 🎉" }));
          center.appendChild(E("button.btn.btn-primary", { onclick: reset }, ["↺ Nochmal"]));
        }

        var bottom = E(".react-half.bottom" + (roundWinner === "konsti" ? ".won" : ""), {
          style: { "--c": P.konsti.color },
          onpointerdown: function (e) { e.preventDefault(); if (phase === "go" || phase === "waiting") tap("konsti"); }
        }, [E(".react-half-label", { text: P.konsti.avatar + " " + P.konsti.name })]);

        field.appendChild(top); field.appendChild(center); field.appendChild(bottom);
        wrap.appendChild(field);
      }

      this._cleanup = function () { clearTimer(); };
    }
  });
})();
