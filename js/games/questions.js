/* Pärchen-Fragen (Verbindung, ohne Punkte) --------------------------- */
(function () {
  "use strict";
  var E = Engine.el, P = Engine.players;

  var DECK = [
    { c: "süß", t: "Was hast du an unserem ersten Treffen zuerst an mir bemerkt?" },
    { c: "süß", t: "Welcher gemeinsame Moment macht dich immer noch zum Lächeln?" },
    { c: "süß", t: "Was ist dein liebstes Foto von uns – und warum?" },
    { c: "süß", t: "Wenn du mich mit drei Worten beschreiben müsstest, welche wären das?" },
    { c: "fern", t: "Was vermisst du gerade am meisten an mir?" },
    { c: "fern", t: "Was ist das Erste, das wir machen, wenn wir uns wiedersehen?" },
    { c: "fern", t: "Welches Lied erinnert dich an mich, wenn wir uns vermissen?" },
    { c: "fern", t: "Was hilft dir an einem Tag, an dem die Distanz schwer ist?" },
    { c: "fern", t: "Welche Kleinigkeit aus meinem Alltag würdest du gern öfter sehen?" },
    { c: "fern", t: "Wohin reisen wir als Erstes gemeinsam?" },
    { c: "tief", t: "Wann hast du dich bei mir zum ersten Mal richtig sicher gefühlt?" },
    { c: "tief", t: "Was wünschst du dir für uns in einem Jahr?" },
    { c: "tief", t: "Wovor hast du manchmal Angst – und wie kann ich helfen?" },
    { c: "tief", t: "Was bedeutet Zuhause für dich?" },
    { c: "tief", t: "Was hast du über die Liebe gelernt, seit es uns gibt?" },
    { c: "lustig", t: "Was ist die peinlichste Sache, die dir vor mir passiert ist?" },
    { c: "lustig", t: "Wenn wir ein Haustier wären, welches wäre ich und welches du?" },
    { c: "lustig", t: "Welches Emoji beschreibt mich am besten?" },
    { c: "lustig", t: "Was würde ich NIEMALS freiwillig essen?" },
    { c: "lustig", t: "Wer von uns beiden würde eine Zombie-Apokalypse länger überleben?" },
    { c: "lustig", t: "Welchen Spitznamen hast du heimlich für mich?" },
    { c: "süß", t: "Welche meiner Angewohnheiten findest du heimlich süß?" },
    { c: "tief", t: "Was möchtest du mir sagen, das du dich sonst nicht traust?" },
    { c: "fern", t: "Wie sieht für dich ein perfekter gemeinsamer Tag aus, wenn wir zusammen sind?" },
    { c: "lustig", t: "Wenn wir zusammen kochen – wer brennt zuerst etwas an?" },
    { c: "süß", t: "Was ist deine liebste Erinnerung an einen Videoanruf mit mir?" },
    { c: "tief", t: "Worauf bist du bei dir selbst gerade stolz?" },
    { c: "fern", t: "Welches Date würdest du gern nachholen, das die Distanz verhindert hat?" },
    { c: "lustig", t: "Welchen Film könnten wir 100x zusammen schauen?" },
    { c: "süß", t: "Welcher kleine Gruß von mir macht deinen Tag besser?" }
  ];

  var CAT_COLOR = { "süß": "#fb7185", "fern": "#38bdf8", "tief": "#a78bfa", "lustig": "#fbbf24" };

  GAMES.push({
    id: "questions",
    name: "Pärchen-Fragen",
    emoji: "💌",
    tagline: "Näher kommen – ganz ohne Punkte.",
    help: "Zieht eine Karte und beantwortet sie abwechselnd. Keine Punkte, kein Gewinner – nur ihr zwei. Online sehen beide dieselbe Frage – perfekt für einen Videoanruf.",
    kind: "custom",
    online: true,
    noScore: true,

    mount: function (host, ctx) {
      var me = ctx.me;
      var useOnline = Store.room.available();
      var state = null, unwatch = null, unpres = null, presence = {};

      Engine.clear(host);
      var wrap = E(".q-wrap");
      host.appendChild(wrap);

      function fresh() { return { idx: -1, answerer: "konsti", filter: "alle" }; }

      if (useOnline) {
        unpres = Store.onPresence(function (p) { presence = p || {}; render(); });
        unwatch = Store.room.watch("questions", function (val) {
          if (!val) { Store.room.transaction("questions", function (c) { return c || fresh(); }); return; }
          state = val; render();
        });
        Store.room.transaction("questions", function (c) { return c || fresh(); });
        this._cleanup = function () { if (unwatch) unwatch(); if (unpres) unpres(); };
      } else {
        state = fresh();
        this._cleanup = function () {};
        render();
      }

      function upd(patch) {
        if (useOnline) Store.room.update("questions", patch);
        else { Object.assign(state, patch); render(); }
      }

      function pool(f) { return f === "alle" ? DECK : DECK.filter(function (q) { return q.c === f; }); }

      function draw() {
        if (!state) return;
        var f = state.filter || "alle";
        var p = pool(f); if (!p.length) return;
        var cur = state.idx >= 0 ? DECK[state.idx] : null;
        var n; do { n = Math.floor(Math.random() * p.length); } while (p.length > 1 && p[n] === cur);
        Engine.sfx.flip();
        upd({ idx: DECK.indexOf(p[n]), answerer: Engine.other(state.answerer || "konsti") });
      }
      function setFilter(f) { upd({ filter: f }); }
      function partnerOnline() { return !!presence[Engine.other(me)]; }

      function render() {
        if (!state) { Engine.clear(wrap).appendChild(E(".muted", { text: "Lade…" })); return; }
        Engine.clear(wrap);

        var cats = ["alle", "süß", "fern", "tief", "lustig"];
        var tabs = E(".q-tabs");
        cats.forEach(function (c) {
          tabs.appendChild(E("button.q-tab" + ((state.filter || "alle") === c ? ".active" : ""), {
            style: { "--c": CAT_COLOR[c] || "#94a3b8" },
            onclick: function () { setFilter(c); }
          }, [c]));
        });
        wrap.appendChild(tabs);

        if (useOnline) {
          wrap.appendChild(E(".presence.center", {}, [E("span.dot" + (partnerOnline() ? ".on" : "")), partnerOnline() ? (P[Engine.other(me)].name + " ist da") : (P[Engine.other(me)].name + " offline")]));
        }

        var card = E(".q-card");
        if (state.idx < 0) {
          card.appendChild(E(".q-emoji", { text: "💌" }));
          card.appendChild(E(".q-text", { text: "Bereit? Zieht eure erste Frage." }));
        } else {
          var q = DECK[state.idx];
          card.style.setProperty("--c", CAT_COLOR[q.c] || "#94a3b8");
          card.appendChild(E(".q-cat", { text: q.c.toUpperCase() }));
          card.appendChild(E(".q-text", { text: q.t }));
          card.appendChild(E(".q-answerer", { style: { "--c": P[state.answerer].color } }, [P[state.answerer].avatar + " " + P[state.answerer].name + " antwortet"]));
        }
        wrap.appendChild(card);

        wrap.appendChild(E(".game-actions", {}, [
          E("button.btn.btn-primary", { onclick: draw }, [state.idx < 0 ? "💌 Erste Frage ziehen" : "Nächste Frage →"])
        ]));
      }
    }
  });
})();
