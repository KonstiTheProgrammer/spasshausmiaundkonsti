/* Quizduell – persönliche Themen ------------------------------------- */
(function () {
  "use strict";
  var E = Engine.el, P = Engine.players;
  var QPM = 6; // Fragen pro Match

  // q: Frage, a: Antworten, c: Index der richtigen Antwort
  var CATS = [
    {
      id: "got", name: "Game of Thrones", emoji: "🐉", q: [
        { q: "Wie lautet das Motto von Haus Stark?", a: ["Der Winter naht", "Hört mich brüllen", "Wir säen nicht", "Unbeugsam, ungebeugt, unzerbrochen"], c: 0 },
        { q: "Welches Tier ziert das Wappen von Haus Lannister?", a: ["Löwe", "Wolf", "Drache", "Hirsch"], c: 0 },
        { q: "Wie heißt Daenerys' größter, schwarz-roter Drache?", a: ["Drogon", "Rhaegal", "Viserion", "Balerion"], c: 0 },
        { q: "Wer wird als „Der Königsmörder“ bezeichnet?", a: ["Jaime Lannister", "Tyrion Lannister", "Sandor Clegane", "Petyr Baelish"], c: 0 },
        { q: "Welche Truppe bewacht die Mauer im Norden?", a: ["Die Nachtwache", "Die Königsgarde", "Die Unbefleckten", "Die Zweitgeborenen"], c: 0 },
        { q: "Wie lautet Jon Snows wahrer Targaryen-Name?", a: ["Aegon Targaryen", "Rhaegar Targaryen", "Jaehaerys Targaryen", "Viserys Targaryen"], c: 0 },
        { q: "In welcher Stadt steht der Eiserne Thron?", a: ["Königsmund", "Altsass", "Lennishort", "Maidengraben"], c: 0 },
        { q: "Wie heißen die Untoten, angeführt vom Nachtkönig?", a: ["Die Weißen Wanderer", "Die Eisernen Männer", "Die Wildlinge", "Die Söhne der Harpyie"], c: 0 },
        { q: "Welchen Beinamen trägt Tyrion Lannister?", a: ["Der Halbmann", "Der Bluthund", "Die Spinne", "Der Zwiebelritter"], c: 0 },
        { q: "Wer sitzt am Ende der Serie auf dem Thron der Sechs Königslande?", a: ["Bran Stark", "Jon Snow", "Sansa Stark", "Tyrion Lannister"], c: 0 }
      ]
    },
    {
      id: "wien", name: "Wien", emoji: "🎡", q: [
        { q: "Wien ist die Hauptstadt von welchem Land?", a: ["Österreich", "Deutschland", "Schweiz", "Ungarn"], c: 0 },
        { q: "Welcher Fluss fließt durch Wien?", a: ["Donau", "Rhein", "Inn", "Mosel"], c: 0 },
        { q: "In welchem Wiener Vergnügungspark steht das berühmte Riesenrad?", a: ["Prater", "Schönbrunn", "Belvedere", "Tivoli"], c: 0 },
        { q: "Welche berühmte Schokoladentorte stammt aus Wien?", a: ["Sachertorte", "Schwarzwälder Kirschtorte", "Donauwelle", "Linzer Torte"], c: 0 },
        { q: "Wie heißt der gotische Dom im Zentrum Wiens?", a: ["Stephansdom", "Kölner Dom", "Petersdom", "Veitsdom"], c: 0 },
        { q: "Welches Schloss war die Sommerresidenz der Habsburger?", a: ["Schloss Schönbrunn", "Neuschwanstein", "Sanssouci", "Schloss Nymphenburg"], c: 0 },
        { q: "Welches panierte Fleischgericht ist ein Wiener Klassiker?", a: ["Wiener Schnitzel", "Cordon Bleu", "Schweinshaxe", "Gulasch"], c: 0 },
        { q: "Welcher berühmte Begründer der Psychoanalyse lebte in Wien?", a: ["Sigmund Freud", "Carl Gustav Jung", "Albert Einstein", "Iwan Pawlow"], c: 0 },
        { q: "Welcher Komponist gilt als „Walzerkönig“ und ist eng mit Wien verbunden?", a: ["Johann Strauss", "Ludwig van Beethoven", "Richard Wagner", "Johann Sebastian Bach"], c: 0 },
        { q: "Was war die Hofburg in Wien?", a: ["Kaiserliche Residenz", "Ein Bahnhof", "Ein Fußballstadion", "Ein Weingut"], c: 0 }
      ]
    },
    {
      id: "forchheim", name: "Forchheim", emoji: "🍺", q: [
        { q: "In welchem Bundesland liegt Forchheim?", a: ["Bayern", "Baden-Württemberg", "Thüringen", "Hessen"], c: 0 },
        { q: "Forchheim gilt als „Tor zur …“?", a: ["Fränkischen Schweiz", "Sächsischen Schweiz", "Holsteinischen Schweiz", "Bayerischen Wald"], c: 0 },
        { q: "Wie heißt das große Volksfest in Forchheim im Kellerwald?", a: ["Annafest", "Bergkirchweih", "Sandkerwa", "Oktoberfest"], c: 0 },
        { q: "In welchem Regierungsbezirk liegt Forchheim?", a: ["Oberfranken", "Mittelfranken", "Unterfranken", "Oberbayern"], c: 0 },
        { q: "Was beherbergt die Kaiserpfalz in Forchheim heute?", a: ["Ein Museum", "Ein Schwimmbad", "Einen Bahnhof", "Ein Kino"], c: 0 },
        { q: "Welcher Fluss fließt durch Forchheim?", a: ["Regnitz", "Donau", "Main", "Isar"], c: 0 },
        { q: "Forchheim ist berühmt für seine vielen Bierkeller im …?", a: ["Kellerwald", "Stadtpark", "Hafengebiet", "Schlossgarten"], c: 0 },
        { q: "Wie viele Einwohner hat Forchheim ungefähr?", a: ["ca. 33.000", "ca. 5.000", "ca. 120.000", "ca. 500.000"], c: 0 },
        { q: "Für welches Obst ist die Region rund um Forchheim besonders bekannt?", a: ["Kirschen", "Orangen", "Oliven", "Ananas"], c: 0 }
      ]
    },
    {
      id: "bamberg", name: "Bamberg", emoji: "⛪", q: [
        { q: "Wozu gehört Bambergs Altstadt seit 1993?", a: ["UNESCO-Weltkulturerbe", "Guinness-Buch der Rekorde", "Den Sieben Weltwundern", "Einer Bundesgartenschau"], c: 0 },
        { q: "Auf wie vielen Hügeln wurde Bamberg erbaut (wie Rom)?", a: ["Sieben", "Drei", "Zwölf", "Zwei"], c: 0 },
        { q: "Welche besondere Biersorte ist eine Bamberger Spezialität?", a: ["Rauchbier", "Weizenbier", "Kölsch", "Pils"], c: 0 },
        { q: "Wie heißt das Rathaus, das mitten in der Regnitz steht?", a: ["Altes Rathaus", "Wasserschloss", "Brückenpalais", "Inselhaus"], c: 0 },
        { q: "Welche berühmte Reiterstatue steht im Bamberger Dom?", a: ["Der Bamberger Reiter", "Der Goldene Reiter", "Das Sachsenross", "Der Eiserne Reiter"], c: 0 },
        { q: "Wie wird das alte Fischerviertel an der Regnitz genannt?", a: ["Klein-Venedig", "Klein-Holland", "Klein-Paris", "Klein-Rom"], c: 0 },
        { q: "Wegen seiner sieben Hügel wird Bamberg auch genannt:", a: ["Fränkisches Rom", "Bayerisches Venedig", "Deutsches Athen", "Klein-Wien"], c: 0 },
        { q: "Wie heißt die Universität in Bamberg?", a: ["Otto-Friedrich-Universität", "Friedrich-Alexander-Universität", "Julius-Maximilians-Universität", "Ludwig-Maximilians-Universität"], c: 0 },
        { q: "Welcher Fluss prägt das Stadtbild von Bamberg?", a: ["Regnitz", "Donau", "Isar", "Neckar"], c: 0 },
        { q: "Im Bamberger Dom liegt das einzige Papstgrab nördlich der Alpen. Welcher Papst?", a: ["Clemens II.", "Benedikt XVI.", "Gregor VII.", "Pius XII."], c: 0 }
      ]
    },
    {
      id: "nuernberg", name: "Nürnberg", emoji: "🏰", q: [
        { q: "Welche kleine Wurst-Spezialität ist nach Nürnberg benannt?", a: ["Nürnberger Rostbratwürste", "Thüringer Bratwurst", "Wiener Würstchen", "Currywurst"], c: 0 },
        { q: "Wie heißt der berühmte Weihnachtsmarkt in Nürnberg?", a: ["Christkindlesmarkt", "Striezelmarkt", "Dommarkt", "Adventszauber"], c: 0 },
        { q: "Welches süße Gebäck ist eine Nürnberger Weihnachtsspezialität?", a: ["Lebkuchen", "Christstollen", "Aachener Printen", "Spekulatius"], c: 0 },
        { q: "Welcher Renaissance-Maler wurde in Nürnberg geboren?", a: ["Albrecht Dürer", "Lucas Cranach", "Caspar David Friedrich", "Tilman Riemenschneider"], c: 0 },
        { q: "Wie heißt die große Burg über der Nürnberger Altstadt?", a: ["Kaiserburg", "Festung Marienberg", "Veste Coburg", "Plassenburg"], c: 0 },
        { q: "Welcher Fluss fließt durch Nürnberg?", a: ["Pegnitz", "Regnitz", "Main", "Donau"], c: 0 },
        { q: "Welche berühmten Prozesse fanden nach 1945 in Nürnberg statt?", a: ["Die Nürnberger Prozesse", "Die Potsdamer Konferenz", "Der Wiener Kongress", "Die Frankfurter Versammlung"], c: 0 },
        { q: "Wie lautet der Spitzname des 1. FC Nürnberg?", a: ["Der Club", "Die Roten", "Die Bayern", "Die Löwen"], c: 0 },
        { q: "Welches Nürnberger Museum ist das größte zur deutschen Kulturgeschichte?", a: ["Germanisches Nationalmuseum", "Deutsches Museum", "Pergamonmuseum", "Städel Museum"], c: 0 },
        { q: "Welcher Nürnberger gilt als Erfinder der Taschenuhr?", a: ["Peter Henlein", "Albrecht Dürer", "Johannes Gutenberg", "Martin Behaim"], c: 0 }
      ]
    },
    {
      id: "grundschule", name: "Grundschullehramt", emoji: "🍎", q: [
        { q: "Wie viele Jahrgangsstufen umfasst die Grundschule in Bayern?", a: ["4", "5", "6", "3"], c: 0 },
        { q: "Wie heißt die erste große Staatsprüfung am Ende des Lehramtsstudiums?", a: ["Erstes Staatsexamen", "Bachelorarbeit", "Habilitation", "Diplomprüfung"], c: 0 },
        { q: "Wie nennt man die praktische Ausbildung nach dem Studium?", a: ["Referendariat", "Praktikum", "Volontariat", "Probezeit"], c: 0 },
        { q: "Wofür steht die Abkürzung „KMK“?", a: ["Kultusministerkonferenz", "Kinder-Mal-Kurs", "Klassen-Management-Konzept", "Kommunale Mittelschulkonferenz"], c: 0 },
        { q: "Was bedeutet „DaZ“ im schulischen Kontext?", a: ["Deutsch als Zweitsprache", "Didaktik allgemeiner Zwecke", "Diagnose am Zeugnis", "Deutsch am Ziel"], c: 0 },
        { q: "Wie heißt der aktuelle Lehrplan für bayerische Schulen?", a: ["LehrplanPLUS", "Bildungsplan 2000", "Kerncurriculum", "Rahmenplan"], c: 0 },
        { q: "Welches Fach gehört neben Mathematik zu den Kernfächern der Grundschule?", a: ["Deutsch", "Latein", "Physik", "Wirtschaft"], c: 0 },
        { q: "Wie nennt man die Wissenschaft vom Lehren und Lernen eines Faches?", a: ["Didaktik", "Pädiatrie", "Logistik", "Genetik"], c: 0 },
        { q: "In welchem Fach lernen Grundschulkinder in Bayern über Natur, Technik und Gesellschaft?", a: ["Heimat- und Sachunterricht", "Sozialkunde", "Erdkunde", "Gemeinschaftskunde"], c: 0 },
        { q: "Wie heißt das Konzept, Kinder mit unterschiedlichem Niveau individuell zu fördern?", a: ["Differenzierung", "Frontalunterricht", "Selektion", "Standardisierung"], c: 0 }
      ]
    },
    {
      id: "informatik", name: "Informatik", emoji: "💻", q: [
        { q: "Welches Zahlensystem nutzen Computer grundlegend?", a: ["Binärsystem (Basis 2)", "Dezimalsystem (Basis 10)", "Römische Zahlen", "Hexadezimal (Basis 16)"], c: 0 },
        { q: "Aus wie vielen Bit besteht ein Byte?", a: ["8", "4", "16", "1024"], c: 0 },
        { q: "Wer entwarf die „Turingmaschine“ und gilt als Pionier der Informatik?", a: ["Alan Turing", "Bill Gates", "Steve Jobs", "Mark Zuckerberg"], c: 0 },
        { q: "Wer gilt als die erste Programmiererin der Geschichte?", a: ["Ada Lovelace", "Grace Hopper", "Marie Curie", "Margaret Hamilton"], c: 0 },
        { q: "Wofür steht „HTML“?", a: ["HyperText Markup Language", "High Tech Modern Language", "Hyperlink Text Mode Layout", "Home Tool Markup Language"], c: 0 },
        { q: "Was bedeutet die Abkürzung „CPU“?", a: ["Central Processing Unit", "Computer Power Unit", "Central Program Utility", "Core Processor Underlay"], c: 0 },
        { q: "Welche Datenstruktur arbeitet nach dem Prinzip „LIFO“?", a: ["Stack (Stapel)", "Queue (Warteschlange)", "Array", "Baum"], c: 0 },
        { q: "Wie viele Werte kann ein einzelnes Bit annehmen?", a: ["2", "8", "10", "1"], c: 0 },
        { q: "Wie nennt man umgangssprachlich einen Fehler in einem Programm?", a: ["Bug", "Byte", "Boot", "Bit"], c: 0 },
        { q: "Was ergibt 2 hoch 10 (2¹⁰)?", a: ["1024", "1000", "512", "2048"], c: 0 },
        { q: "Welches Suchverfahren hat in einer sortierten Liste die Laufzeit O(log n)?", a: ["Binäre Suche", "Lineare Suche", "Bubble Sort", "Breitensuche"], c: 0 }
      ]
    }
  ];

  function byId(id) { for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i]; return null; }
  function catName(id) { var c = byId(id); return c ? c.name : ""; }
  function catEmoji(id) { var c = byId(id); return c ? c.emoji : "❓"; }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  function buildMatch(catId) {
    var pool = [];
    if (catId === "mix") CATS.forEach(function (c) { c.q.forEach(function (q) { pool.push({ q: q.q, a: q.a, c: q.c, cat: c.id }); }); });
    else { var c = byId(catId); if (c) c.q.forEach(function (q) { pool.push({ q: q.q, a: q.a, c: q.c, cat: c.id }); }); }
    shuffle(pool);
    var picked = pool.slice(0, Math.min(QPM, pool.length));
    // Antwortoptionen mischen, richtigen Index nachführen
    return picked.map(function (item) {
      var opts = item.a.map(function (t, i) { return { t: t, ok: i === item.c }; });
      shuffle(opts);
      var ci = 0; for (var i = 0; i < opts.length; i++) if (opts[i].ok) ci = i;
      return { q: item.q, cat: item.cat, a: opts.map(function (o) { return o.t; }), c: ci };
    });
  }

  GAMES.push({
    id: "quizduell",
    name: "Quizduell",
    emoji: "❓",
    tagline: "Euer Quiz: GoT, eure Städte & Studium.",
    help: "Wählt ein Thema. Beide beantworten dieselben 6 Fragen (verdeckt). Wer mehr richtig hat, gewinnt den Punkt. Themen: Game of Thrones, Wien, Forchheim, Bamberg, Nürnberg, Grundschullehramt und Informatik.",
    kind: "custom",
    online: true,

    mount: function (host, ctx) {
      var me = ctx.me;
      var useOnline = Store.room.available();
      var scoredLocal = false, fxDone = false, unwatch = null, unpres = null, presence = {};

      Engine.clear(host);
      var area = E(".quiz-area");
      host.appendChild(area);

      /* ================= ONLINE ================= */
      if (useOnline) {
        var state = null;
        unpres = Store.onPresence(function (p) { presence = p || {}; renderOnline(); });
        unwatch = Store.room.watch("quizduell", function (val) {
          state = val;
          if (state) {
            if (!state.picks) state.picks = { konsti: null, mia: null };
            if (!state.scores) state.scores = { konsti: 0, mia: 0 };
          }
          tryResolve(); maybeAward(); renderOnline();
        });
        this._cleanup = function () { if (unwatch) unwatch(); if (unpres) unpres(); };

        function startCat(catId) {
          Store.room.transaction("quizduell", function (cur) {
            if (cur && cur.questions) return cur;
            return { questions: buildMatch(catId), idx: 0, picks: { konsti: null, mia: null }, scores: { konsti: 0, mia: 0 }, reveal: false, scoredBy: null, mid: Engine.uid() };
          });
        }
        function pick(i) {
          if (!state || state.reveal || state.idx >= state.questions.length) return;
          if (state.picks[me] != null) return;
          Engine.sfx.move();
          var patch = {}; patch["picks/" + me] = i; Store.room.update("quizduell", patch);
        }
        function tryResolve() {
          if (!state || !state.questions) return;
          Store.room.transaction("quizduell", function (cur) {
            if (!cur || cur.reveal) return cur;
            if (!cur.picks || cur.picks.konsti == null || cur.picks.mia == null) return cur;
            var q = cur.questions[cur.idx];
            if (cur.picks.konsti === q.c) cur.scores.konsti = (cur.scores.konsti || 0) + 1;
            if (cur.picks.mia === q.c) cur.scores.mia = (cur.scores.mia || 0) + 1;
            cur.reveal = true;
            return cur;
          });
        }
        function next() {
          Store.room.transaction("quizduell", function (cur) {
            if (!cur || !cur.reveal) return cur;
            cur.reveal = false; cur.idx = (cur.idx || 0) + 1; cur.picks = { konsti: null, mia: null };
            return cur;
          });
        }
        function done() { return state && state.questions && state.idx >= state.questions.length; }
        function maybeAward() {
          if (!done()) return;
          var w = winner(state.scores);
          if (state.scoredBy || w === "tie") { fx(w); return; }
          if (w === me && !scoredLocal) { scoredLocal = true; Store.room.update("quizduell", { scoredBy: w }); Store.addResult(w, "quizduell", { token: "quizduell:" + (state.mid || "") }); }
          fx(w);
        }
        function fx(w) {
          if (fxDone) return; fxDone = true;
          setTimeout(function () {
            if (w === "tie") Engine.sfx.tie();
            else if (w === me) { Engine.sfx.win(); Engine.confetti({ colors: [P[w].color, P[w].color2, "#fde047"] }); }
            else Engine.sfx.lose();
          }, 150);
        }
        function reset() { fxDone = false; scoredLocal = false; Store.room.clear("quizduell"); }

        function renderOnline() {
          Engine.clear(area);
          var partner = !!presence[Engine.other(me)];
          if (!state || !state.questions) {
            area.appendChild(catScreen(startCat));
            area.appendChild(E(".presence.center", {}, [E("span.dot" + (partner ? ".on" : "")), partner ? (P[Engine.other(me)].name + " ist da") : ("Warte auf " + P[Engine.other(me)].name + "…")]));
            return;
          }
          if (done()) { area.appendChild(finalView(state.scores, reset)); return; }
          var q = state.questions[state.idx];
          area.appendChild(quizHeader(state.idx, state.questions.length, state.scores, q.cat));
          if (state.reveal) {
            area.appendChild(questionView(q, "reveal", state.picks));
            area.appendChild(E(".game-actions", {}, [E("button.btn.btn-primary", { onclick: next }, [state.idx + 1 >= state.questions.length ? "Ergebnis →" : "Weiter →"])]));
          } else {
            var mine = state.picks[me], theirs = state.picks[Engine.other(me)];
            area.appendChild(questionView(q, mine != null ? "waiting" : "pick", state.picks, pick, me));
            area.appendChild(E(".quiz-wait", {}, [
              E("span.rps-status" + (mine != null ? ".ok" : ""), { text: P[me].name + (mine != null ? " ✓" : " …") }),
              E("span.rps-status" + (theirs != null ? ".ok" : ""), { text: P[Engine.other(me)].name + (theirs != null ? " ✓" : " …") })
            ]));
          }
        }
        return;
      }

      /* ================= LOKAL (Hotseat) ================= */
      var L = { phase: "cat", questions: [], idx: 0, picks: { konsti: null, mia: null }, scores: { konsti: 0, mia: 0 }, sub: "p1" };
      this._cleanup = function () {};
      renderLocal();

      function renderLocal() {
        Engine.clear(area);
        if (L.phase === "cat") { area.appendChild(catScreen(function (catId) { L.questions = buildMatch(catId); L.idx = 0; L.scores = { konsti: 0, mia: 0 }; L.picks = { konsti: null, mia: null }; L.sub = "p1"; L.phase = "play"; scoredLocal = false; renderLocal(); })); return; }
        if (L.idx >= L.questions.length) { area.appendChild(finalLocal()); return; }

        var q = L.questions[L.idx];
        area.appendChild(quizHeader(L.idx, L.questions.length, L.scores, q.cat));

        if (L.sub === "p1" || L.sub === "p2") {
          var who = L.sub === "p1" ? "konsti" : "mia";
          var other = Engine.other(who);
          area.appendChild(E(".quiz-turn", { style: { "--c": P[who].color } }, [P[who].avatar + " " + P[who].name + " ist dran"]));
          area.appendChild(E(".rps-secret", { text: P[other].name + " bitte kurz wegschauen 🙈" }));
          area.appendChild(questionView(q, "pick", L.picks, function (i) {
            L.picks[who] = i; Engine.sfx.move();
            if (L.sub === "p1") { L.sub = "p2"; }
            else {
              if (L.picks.konsti === q.c) L.scores.konsti++;
              if (L.picks.mia === q.c) L.scores.mia++;
              L.sub = "reveal";
            }
            renderLocal();
          }, who));
        } else { // reveal
          area.appendChild(questionView(q, "reveal", L.picks));
          area.appendChild(E(".game-actions", {}, [E("button.btn.btn-primary", {
            onclick: function () { L.idx++; L.picks = { konsti: null, mia: null }; L.sub = "p1"; renderLocal(); }
          }, [L.idx + 1 >= L.questions.length ? "Ergebnis →" : "Weiter →"])]));
        }
      }

      function finalLocal() {
        var w = winner(L.scores);
        if (!scoredLocal) {
          scoredLocal = true;
          if (w !== "tie") { Store.addResult(w, "quizduell", {}); Engine.sfx.win(); Engine.confetti({ colors: [P[w].color, P[w].color2, "#fde047"] }); }
          else Engine.sfx.tie();
        }
        return finalView(L.scores, function () { L.phase = "cat"; renderLocal(); });
      }

      /* ================= gemeinsame UI ================= */
      function winner(s) { if ((s.konsti || 0) === (s.mia || 0)) return "tie"; return (s.konsti || 0) > (s.mia || 0) ? "konsti" : "mia"; }

      function catScreen(onPick) {
        var wrap = E("div");
        wrap.appendChild(E(".quiz-cat-title", { text: "Wähle ein Thema" }));
        var grid = E(".quiz-cats");
        CATS.forEach(function (c) {
          grid.appendChild(E("button.quiz-cat", { onclick: function () { onPick(c.id); } }, [E(".qc-emoji", { text: c.emoji }), E(".qc-name", { text: c.name })]));
        });
        grid.appendChild(E("button.quiz-cat.mix", { onclick: function () { onPick("mix"); } }, [E(".qc-emoji", { text: "🎲" }), E(".qc-name", { text: "Gemischt" })]));
        wrap.appendChild(grid);
        return wrap;
      }

      function quizHeader(idx, total, scores, cat) {
        return E(".quiz-head", {}, [
          E(".quiz-cat-chip", {}, [catEmoji(cat) + " " + catName(cat)]),
          E(".quiz-progress", {}, [
            E("span", { style: { color: P.konsti.color }, text: P.konsti.avatar + " " + (scores.konsti || 0) }),
            E("span.qp-mid", { text: "Frage " + (idx + 1) + "/" + total }),
            E("span", { style: { color: P.mia.color }, text: (scores.mia || 0) + " " + P.mia.avatar })
          ])
        ]);
      }

      // mode: 'pick' | 'waiting' | 'reveal'
      function questionView(q, mode, picks, onPick, picker) {
        var box = E(".quiz-question");
        box.appendChild(E(".quiz-q-text", { text: q.q }));
        var opts = E(".quiz-options");
        q.a.forEach(function (text, i) {
          var cls = ".quiz-opt";
          var badges = [];
          if (mode === "reveal") {
            if (i === q.c) cls += ".correct";
            var kp = picks && picks.konsti === i, mp = picks && picks.mia === i;
            if ((kp || mp) && i !== q.c) cls += ".wrong";
            if (kp) badges.push(E("span.quiz-who", { style: { "--c": P.konsti.color }, text: P.konsti.avatar }));
            if (mp) badges.push(E("span.quiz-who", { style: { "--c": P.mia.color }, text: P.mia.avatar }));
          } else if (mode === "waiting" && picker && picks && picks[picker] === i) {
            cls += ".picked";
          }
          var disabled = mode !== "pick";
          var btn = E("button" + cls, {
            type: "button", disabled: disabled,
            onclick: function () { if (mode === "pick" && onPick) onPick(i); }
          }, [E("span.quiz-opt-letter", { text: String.fromCharCode(65 + i) }), E("span.quiz-opt-text", { text: text }), badges.length ? E(".quiz-badges", {}, badges) : null]);
          opts.appendChild(btn);
        });
        box.appendChild(opts);
        return box;
      }

      function finalView(scores, onAgain) {
        var w = winner(scores);
        var wrap = E(".quiz-final");
        if (w === "tie") {
          wrap.appendChild(E(".quiz-final-emoji", { text: "🤝" }));
          wrap.appendChild(E(".quiz-final-text", { text: "Unentschieden!" }));
        } else {
          wrap.appendChild(E(".quiz-final-emoji", { text: P[w].avatar }));
          wrap.appendChild(E(".quiz-final-text", { style: { "--c": P[w].color }, text: P[w].name + " gewinnt! 🎉" }));
        }
        wrap.appendChild(E(".quiz-final-score", {}, [
          E("span", { style: { color: P.konsti.color }, text: P.konsti.name + ": " + (scores.konsti || 0) }),
          E("span", { text: " · " }),
          E("span", { style: { color: P.mia.color }, text: P.mia.name + ": " + (scores.mia || 0) })
        ]));
        wrap.appendChild(E(".game-actions", {}, [E("button.btn.btn-primary", { onclick: onAgain }, ["↺ Neues Thema"])]));
        return wrap;
      }
    }
  });
})();
