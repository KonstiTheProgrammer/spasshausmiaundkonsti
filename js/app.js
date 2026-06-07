/* =====================================================================
   APP – Identität, Navigation, Punktetafel, Einstellungen
   ===================================================================== */
(function () {
  "use strict";
  var E = Engine.el, P = Engine.players;
  var root, currentGame = null, unScores = null;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    root = document.getElementById("app");
    if (!Store.getIdentity()) showIdentity();
    else showApp();
  }

  /* ---------- Identitätsauswahl ---------- */
  function showIdentity() {
    Engine.clear(root);
    var screen = E(".identity-screen");
    screen.appendChild(E(".identity-logo", { text: "🏠💕" }));
    screen.appendChild(E("h1.identity-title", { text: "Konsti & Mia" }));
    screen.appendChild(E(".identity-sub", { text: "Unser Spaßhaus – wer bist du?" }));
    var cards = E(".identity-cards");
    ["konsti", "mia"].forEach(function (id) {
      var p = P[id];
      cards.appendChild(E("button.identity-card", {
        style: { "--c": p.color, "--c2": p.color2 }, onclick: function () { choose(id); }
      }, [
        E(".identity-ava", { text: p.avatar }),
        E(".identity-name", { text: p.name })
      ]));
    });
    screen.appendChild(cards);
    screen.appendChild(E(".identity-hint", { text: "Keine Sorge – du kannst später jederzeit wechseln." }));
    root.appendChild(screen);
    requestAnimationFrame(function () { screen.classList.add("in"); });
  }
  function choose(id) {
    Store.setIdentity(id);
    showApp();
  }

  /* ---------- App-Grundgerüst ---------- */
  function showApp() {
    Engine.clear(root);
    root.appendChild(buildTopbar());
    var main = E("main.main#main");
    root.appendChild(main);
    showHome();
    if (unScores) unScores();
    unScores = Store.onScores(function () { refreshScoreUI(); });
  }

  function me() { return Store.getIdentity(); }

  function buildTopbar() {
    var bar = E("header.topbar");
    var brand = E(".brand", { onclick: showHome }, [E("span.brand-emoji", { text: "🏠" }), E("span.brand-text", { html: "Konsti&nbsp;&amp;&nbsp;Mia" })]);

    var mini = E(".mini-score#miniScore");

    var meId = me();
    var meChip = E("button.me-chip#meChip", { style: { "--c": P[meId].color }, onclick: openSettings, title: "Einstellungen" }, [
      E("span.me-ava", { text: P[meId].avatar }),
      E("span.me-name", { text: P[meId].name }),
      E("span.gear", { text: "⚙️" })
    ]);

    bar.appendChild(brand);
    bar.appendChild(mini);
    bar.appendChild(meChip);
    return bar;
  }

  /* ---------- Home ---------- */
  function showHome() {
    cleanupGame();
    var main = document.getElementById("main");
    Engine.clear(main);

    // Hero / Punktetafel
    var hero = E("section.hero");
    hero.appendChild(scoreboard());
    main.appendChild(hero);

    // Spiele
    var sec = E("section.section");
    sec.appendChild(E("h2.section-title", { html: "🎮 Spiele <span class='muted2'>· zu zweit</span>" }));
    var grid = E(".games-grid");
    (window.GAMES || []).forEach(function (g) {
      grid.appendChild(gameCard(g));
    });
    sec.appendChild(grid);
    main.appendChild(sec);

    main.appendChild(footer());
    refreshScoreUI();
  }

  function gameCard(g) {
    return E("button.game-card", { onclick: function () { showGame(g); } }, [
      E(".g-emoji", { text: g.emoji }),
      E(".g-info", {}, [
        E(".g-name", { text: g.name }),
        E(".g-tag", { text: g.tagline || "" })
      ]),
      E(".g-arrow", { text: "→" })
    ]);
  }

  function scoreboard() {
    var s = Store.getScores();
    var k = s.konsti, m = s.mia;
    var board = E(".scoreboard#scoreboard");

    board.appendChild(E(".sb-title", { html: "Punktestand 🏆" }));

    var vs = E(".sb-vs");
    vs.appendChild(sidePanel("konsti", k.points));
    vs.appendChild(E(".sb-mid", {}, [E(".sb-colon", { text: ":" })]));
    vs.appendChild(sidePanel("mia", m.points));
    board.appendChild(vs);

    // Balkenanzeige
    var total = k.points + m.points;
    var kPct = total ? Math.round((k.points / total) * 100) : 50;
    var bar = E(".sb-bar");
    bar.appendChild(E(".sb-bar-k", { style: { width: kPct + "%", background: "linear-gradient(90deg," + P.konsti.color + "," + P.konsti.color2 + ")" } }));
    bar.appendChild(E(".sb-bar-m", { style: { width: (100 - kPct) + "%", background: "linear-gradient(90deg," + P.mia.color2 + "," + P.mia.color + ")" } }));
    board.appendChild(bar);

    board.appendChild(leaderLine(k, m));

    // Mini-Statistik
    var stats = E(".sb-stats");
    stats.appendChild(statBox("🎲 Spiele gesamt", String(Math.max(k.games, m.games))));
    stats.appendChild(statBox("🔥 " + P.konsti.name + " Serie", String(k.streak || 0)));
    stats.appendChild(statBox("🔥 " + P.mia.name + " Serie", String(m.streak || 0)));
    board.appendChild(stats);

    // Pro-Spiel-Aufschlüsselung (einklappbar)
    board.appendChild(perGame(s));

    return board;
  }

  function sidePanel(id, pts) {
    var p = P[id];
    return E(".sb-side", { style: { "--c": p.color, "--c2": p.color2 } }, [
      E(".sb-ava", { text: p.avatar }),
      E(".sb-name", { text: p.name }),
      E(".sb-pts", { text: String(pts) }),
      E(".sb-pts-l", { text: pts === 1 ? "Punkt" : "Punkte" })
    ]);
  }

  function leaderLine(k, m) {
    var txt, cls = "";
    if (k.points === m.points) txt = k.points === 0 ? "Noch alles offen – legt los! 💕" : "Kopf an Kopf! 🤝";
    else { var lead = k.points > m.points ? "konsti" : "mia"; txt = P[lead].avatar + " " + P[lead].name + " führt!"; cls = lead; }
    return E(".sb-leader" + (cls ? "." + cls : ""), { style: cls ? { "--c": P[cls].color } : null, text: txt });
  }

  function statBox(label, val) {
    return E(".stat-box", {}, [E(".stat-val", { text: val }), E(".stat-label", { text: label })]);
  }

  function perGame(s) {
    var wrap = E("details.pergame");
    wrap.appendChild(E("summary", { html: "📊 Pro Spiel ansehen" }));
    var list = E(".pg-list");
    (window.GAMES || []).forEach(function (g) {
      if (g.noScore) return;
      var kg = (s.konsti.perGame[g.id] || {}).wins || 0;
      var mg = (s.mia.perGame[g.id] || {}).wins || 0;
      var tot = kg + mg;
      var kPct = tot ? (kg / tot) * 100 : 50;
      list.appendChild(E(".pg-row", {}, [
        E(".pg-name", {}, [g.emoji + " " + g.name]),
        E(".pg-bar", {}, [
          E(".pg-bar-k", { style: { width: kPct + "%", background: P.konsti.color } }),
          E(".pg-bar-m", { style: { width: (100 - kPct) + "%", background: P.mia.color } })
        ]),
        E(".pg-nums", {}, [E("span", { style: { color: P.konsti.color }, text: String(kg) }), " · ", E("span", { style: { color: P.mia.color }, text: String(mg) })])
      ]));
    });
    wrap.appendChild(list);
    return wrap;
  }

  function refreshScoreUI() {
    // Mini-Score in der Topbar
    var mini = document.getElementById("miniScore");
    if (mini) {
      var s = Store.getScores();
      Engine.clear(mini);
      mini.appendChild(E("span.ms-k", { style: { color: P.konsti.color }, text: P.konsti.avatar + " " + s.konsti.points }));
      mini.appendChild(E("span.ms-vs", { text: ":" }));
      mini.appendChild(E("span.ms-m", { style: { color: P.mia.color }, text: s.mia.points + " " + P.mia.avatar }));
    }
    // Großes Scoreboard neu zeichnen, falls auf Home
    var sb = document.getElementById("scoreboard");
    if (sb && sb.parentNode) {
      var fresh = scoreboard();
      sb.parentNode.replaceChild(fresh, sb);
    }
  }

  /* ---------- Spiel-Ansicht ---------- */
  function showGame(g) {
    cleanupGame();
    currentGame = g;
    var main = document.getElementById("main");
    Engine.clear(main);

    var head = E(".game-head");
    head.appendChild(E("button.back-btn", { onclick: showHome, title: "Zurück" }, ["←"]));
    head.appendChild(E(".game-head-title", {}, [E("span.gh-emoji", { text: g.emoji }), E("span", { text: g.name })]));
    head.appendChild(E("button.help-btn", { onclick: function () { showHelp(g); }, title: "Wie geht das?" }, ["?"]));
    main.appendChild(head);

    var hostEl = E(".game-host#gameHost");
    main.appendChild(hostEl);

    try {
      g.mount(hostEl, { me: me(), onExit: showHome, gameId: g.id });
    } catch (err) {
      console.error(err);
      hostEl.appendChild(E(".muted", { text: "Ups, das Spiel konnte nicht geladen werden." }));
    }
    window.scrollTo(0, 0);
  }

  function cleanupGame() {
    if (currentGame && typeof currentGame._cleanup === "function") {
      try { currentGame._cleanup(); } catch (e) {}
    }
    currentGame = null;
  }

  function showHelp(g) {
    modal(g.emoji + " " + g.name, [
      E("p.modal-text", { text: g.help || g.tagline || "" }),
      E(".modal-actions", {}, [E("button.btn.btn-primary", { onclick: closeModal }, ["Verstanden!"])])
    ]);
  }

  /* ---------- Einstellungen ---------- */
  function openSettings() {
    var meId = me();
    var online = Store.isOnline(), configured = Store.isConfigured();
    var statusTxt = online ? ("🌍 Online verbunden · Raum: " + Store.roomCode())
      : (configured ? "⏳ Verbinde mit dem Online-Raum…" : "📍 Lokal (zusammen an einem Gerät)");

    var body = [];

    // Identität wechseln
    body.push(E(".set-label", { text: "Wer bist du?" }));
    var idRow = E(".set-identity");
    ["konsti", "mia"].forEach(function (id) {
      idRow.appendChild(E("button.set-id" + (id === meId ? ".active" : ""), {
        style: { "--c": P[id].color }, onclick: function () { Store.setIdentity(id); closeModal(); showApp(); }
      }, [P[id].avatar + " " + P[id].name]));
    });
    body.push(idRow);

    // Sound
    var snd = Store.getSettings().sound;
    body.push(E(".set-row", {}, [
      E("span", { text: "🔊 Soundeffekte" }),
      toggle(snd, function (v) { Store.setSettings({ sound: v }); })
    ]));

    // Online-Status
    body.push(E(".set-label", { text: "Verbindung" }));
    body.push(E(".set-status" + (online ? ".on" : ""), { text: statusTxt }));
    if (!configured) {
      body.push(E(".set-help", { html: "Damit ihr <b>über die Distanz</b> spielt und denselben Punktestand teilt, richtet ein kostenloses Firebase-Projekt ein (~5 Min). Anleitung: <code>README.md</code> → dann Werte in <code>js/config.js</code> eintragen." }));
    }

    // Punkte zurücksetzen
    body.push(E(".set-label", { text: "Punkte" }));
    body.push(E("button.btn.btn-danger", {
      onclick: function () {
        confirmModal("Wirklich alle Punkte auf 0 setzen?", function () { Store.resetScores(); closeModal(); Engine.toast("Punkte zurückgesetzt"); });
      }
    }, ["🗑️ Punktestand zurücksetzen"]));

    body.push(E(".modal-actions", {}, [E("button.btn.btn-soft", { onclick: closeModal }, ["Schließen"])]));

    modal("⚙️ Einstellungen", body);
  }

  function toggle(on, onChange) {
    var t = E(".toggle" + (on ? ".on" : ""), {
      onclick: function () { on = !on; t.classList.toggle("on", on); onChange(on); }
    }, [E(".toggle-knob")]);
    return t;
  }

  /* ---------- Modal-Helfer ---------- */
  function modal(title, bodyChildren) {
    closeModal();
    var overlay = E(".modal-overlay#modal", { onclick: function (e) { if (e.target === overlay) closeModal(); } });
    var box = E(".modal");
    box.appendChild(E(".modal-title", { text: title }));
    var b = E(".modal-body"); appendAll(b, bodyChildren); box.appendChild(b);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    requestAnimationFrame(function () { overlay.classList.add("in"); });
  }
  function confirmModal(text, onYes) {
    modal("Bist du sicher?", [
      E("p.modal-text", { text: text }),
      E(".modal-actions", {}, [
        E("button.btn.btn-soft", { onclick: closeModal }, ["Abbrechen"]),
        E("button.btn.btn-danger", { onclick: onYes }, ["Ja, machen"])
      ])
    ]);
  }
  function closeModal() { var m = document.getElementById("modal"); if (m && m.parentNode) m.parentNode.removeChild(m); }
  function appendAll(node, children) { (children || []).forEach(function (c) { if (c) node.appendChild(c); }); }

  function footer() {
    return E("footer.foot", {}, [
      E("div", { html: "Mit 💕 gebaut für " + P.konsti.name + " & " + P.mia.name }),
      E(".foot-sub", { text: "Egal wie weit weg – hier spielen wir zusammen." })
    ]);
  }

  window.KM_APP = { showHome: showHome, showIdentity: showIdentity };
})();
