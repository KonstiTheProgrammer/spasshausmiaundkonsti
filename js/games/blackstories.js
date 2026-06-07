/* Black Stories – einer rät, einer liest vor ------------------------- */
(function () {
  "use strict";
  var E = Engine.el, P = Engine.players;

  // Eigene Rätsel im klassischen "Black Stories"-Stil (Frage + Auflösung).
  var STORIES = [
    { t: "Romeo & Julia", r: "Romeo und Julia liegen tot am Boden. Um sie herum: Wasser und Glasscherben. Im Raum war eine Katze. Was ist passiert?", s: "Romeo und Julia sind Goldfische. Die Katze stieß ihr Glas vom Regal – es zerbrach, das Wasser lief aus und die beiden Fische verendeten." },
    { t: "Das ungeöffnete Päckchen", r: "Ein Mann liegt tot auf einem weiten Feld. Neben ihm ein ungeöffnetes Päckchen. Hätte er es geöffnet, würde er noch leben. Was war darin?", s: "Ein Fallschirm. Der Mann sprang aus einem Flugzeug, doch sein Fallschirm öffnete sich nicht." },
    { t: "Das Streichholz", r: "Mitten in der Wüste liegt ein toter Mann, in der Hand ein abgebranntes Streichholz. Weit und breit nichts. Wie kam er ums Leben?", s: "Er war mit anderen in einem abstürzenden Heißluftballon. Sie zogen Streichhölzer, um zu entscheiden, wer abspringt, um Gewicht zu sparen. Er zog das kürzeste und sprang." },
    { t: "Die zwei Knöpfe", r: "Ein Mann wohnt im 10. Stock. Morgens fährt er mit dem Aufzug ganz nach unten. Abends fährt er nur bis zum 7. Stock und nimmt den Rest die Treppe – außer es regnet oder jemand fährt mit. Warum?", s: "Er ist sehr klein und erreicht im Aufzug nur den Knopf für den 7. Stock. Bei Regen hat er einen Schirm dabei, mit dem er den Knopf für den 10. erreicht; fährt jemand mit, drückt diese Person den oberen Knopf." },
    { t: "Mehrmals täglich", r: "Ein Mann rasiert sich mehrmals am Tag – und trägt trotzdem immer einen Bart. Wie geht das?", s: "Er ist Barbier (Friseur). Er rasiert den ganzen Tag andere Menschen, nicht sich selbst." },
    { t: "Der Bankrott", r: "Ein Mann schiebt sein Auto bis vor ein Hotel und weiß im selben Moment, dass er pleite ist. Was ist los?", s: "Sie spielen Monopoly. Seine Spielfigur – das Auto – landet auf einem Feld mit dem Hotel eines Mitspielers, das er nicht bezahlen kann." },
    { t: "Die Pfütze unter ihm", r: "Ein Mann hängt tot in einem leeren, von innen verschlossenen Raum. Unter ihm nur eine Wasserpfütze. Wie hat er das gemacht?", s: "Er stellte sich auf einen großen Eisblock, um sich zu erhängen. Das Eis schmolz langsam – zurück blieb nur die Pfütze." },
    { t: "Das Eis im Glas", r: "Zwei Personen trinken denselben Cocktail aus derselben Karaffe. Eine stirbt, die andere nicht – obwohl sie sogar schneller mehrere Gläser trank. Wie?", s: "Das Gift steckte in den Eiswürfeln. Wer langsam trank, gab dem Eis Zeit zu schmelzen und das Gift freizusetzen. Die schnell trinkende Person trank, bevor das Eis schmolz." },
    { t: "Freitag", r: "Ein Cowboy reitet am Freitag in die Stadt, bleibt drei Tage und reitet am Freitag wieder hinaus. Wie ist das möglich?", s: "Sein Pferd heißt Freitag." },
    { t: "Der stille Anruf", r: "Eine Frau liegt nachts wach im Hotel. Sie greift zum Telefon, wählt eine Nummer, sagt kein Wort und legt wieder auf. Kurz darauf schläft sie zufrieden ein. Warum?", s: "Im Nachbarzimmer schnarchte jemand laut. Sie rief dort an – das Klingeln weckte die Person, das Schnarchen verstummte, und sie konnte zuerst einschlafen." },
    { t: "Der Taucher im Wald", r: "Nach einem Waldbrand finden Einsatzkräfte mitten im verkohlten Wald einen toten Mann – in voller Taucherausrüstung. Das nächste Gewässer ist kilometerweit entfernt. Was ist passiert?", s: "Ein Löschflugzeug schöpfte zum Löschen Wasser aus einem See und saugte dabei den tauchenden Mann mit auf. Über dem brennenden Wald wurde das Wasser – samt Taucher – abgeworfen." },
    { t: "Das langsamste Kamel", r: "Ein Vater sagt seinen zwei Söhnen: ‚Wessen Kamel als Letztes das Ziel erreicht, erbt mein Vermögen.‘ Beide trödeln ewig. Ein weiser Mann flüstert ihnen etwas zu – und plötzlich rasen beide los. Was sagte er?", s: "‚Steigt um und reitet das Kamel des anderen.‘ Es zählt ja, wessen eigenes Kamel zuletzt ankommt – also will nun jeder das fremde Kamel, das er reitet, möglichst schnell ins Ziel bringen." },
    { t: "Die Albatros-Suppe", r: "In einem Lokal am Meer bestellt ein Mann Albatros-Suppe. Nach dem ersten Löffel bezahlt er, geht – und nimmt sich noch am selben Abend das Leben. Warum?", s: "Jahre zuvor war er schiffbrüchig. Ein Begleiter sagte ihm damals, das Fleisch, das ihn am Leben hielt, sei Albatros – in Wahrheit war es das des verstorbenen Begleiters. Als er jetzt echte Albatros-Suppe schmeckt, erkennt er den Unterschied und damit die furchtbare Wahrheit." },
    { t: "Die geschmolzene Waffe", r: "Ein Mann wird erstochen in seiner von innen verriegelten Wohnung gefunden. Die Mordwaffe fehlt spurlos – nur eine kleine Wasserpfütze liegt neben der Leiche. Womit wurde er getötet?", s: "Mit einem Eiszapfen. Der Täter erstach ihn und musste nichts mitnehmen – die Waffe schmolz von selbst und hinterließ nur Wasser. Abgesperrt hatte das Opfer selbst, weil es den Mörder kannte und hereinließ." },
    { t: "Die Pilze", r: "Ein Ehepaar isst zu Abend selbst gesammelte Pilze. Der Mann stirbt noch in der Nacht – die Frau, die deutlich mehr gegessen hat, fehlt nichts. Wie kann das sein?", s: "Sie hatte die giftigen Pilze gezielt nur auf seinen Teller gelegt und für sich essbare zubereitet. Ein kühl geplanter Giftmord." },
    { t: "Der Föhn", r: "Ein Mann liegt tot in der Badewanne, ein Föhn schwimmt im Wasser – Stromschlag. Nur: Der Mann war völlig kahl und hat nie im Leben einen Föhn besessen. Was ist passiert?", s: "Er wurde ermordet. Der Täter warf einen mitgebrachten Föhn ins Wasser, um einen Unfall vorzutäuschen – dass ein Glatzkopf gar keinen Föhn besitzt, verrät die Inszenierung." },
    { t: "Tödlicher Applaus", r: "Eine Frau steht hoch oben in der Zirkuskuppel. Das Publikum jubelt – und genau dieser Jubel kostet sie das Leben. Was geschah?", s: "Sie war Trapezkünstlerin und arbeitete ohne Netz. Im falschen Moment brandete unerwartet lauter Applaus auf, ihr Partner griff einen Sekundenbruchteil daneben – sie stürzte in die Tiefe." },
    { t: "Das letzte Foto", r: "Eine Wanderin stürzt von einer Klippe in den Tod. Auf ihrer Kamera findet die Polizei ein allerletztes Bild – und verhaftet sofort ihren Begleiter. Was war darauf zu sehen?", s: "Das Foto zeigt ihn mit ausgestreckten Händen – nicht um sie zu halten, sondern im Moment, als er sie stieß. Im Fallen drückte sie reflexartig den Auslöser." },
    { t: "Der Todesengel", r: "Ein Mann kommt mit einer harmlosen Verletzung ins Krankenhaus und ist am nächsten Morgen tot. Die Obduktion zeigt eine tödliche Dosis eines Medikaments, das ihm nie verschrieben wurde. Was steckt dahinter?", s: "Eine Pflegekraft verabreichte ihm heimlich die Überdosis – ein Todesengel, der über Jahre wehrlose Patienten umbrachte." },
    { t: "Erfroren im Sommer", r: "An einem glühend heißen Augusttag wird ein Mann erfroren aufgefunden. Wie ist das möglich?", s: "Er wurde in einem Kühlhaus eingesperrt – ob Mord oder tödliches Versehen – und erfror dort bei Minusgraden, während draußen die Sonne brannte." },
    { t: "Der eineiige Zwilling", r: "Ein Mann ermordet seinen eineiigen Zwillingsbruder und lebt von da an dessen Leben weiter. Niemand schöpft Verdacht – bis ein winziges Detail ihn verrät. Welches?", s: "Der getötete Bruder hatte eine Tätowierung (oder eine alte Narbe), die der Mörder nicht besaß. Als jemand danach fragte, flog der Betrug auf." },
    { t: "Die Schlange im Paket", r: "Ein Mann stirbt zu Hause an einem Giftschlangenbiss. Alle Türen waren verriegelt, und im ganzen Haus findet man keine Schlange. Wie kam das Gift zu ihm?", s: "Eine Giftschlange war in einem ihm zugestellten Paket versteckt – ein geplanter Mord. Nach dem Biss verschwand sie durch den Abfluss ins Freie." },
    { t: "Die vierte Ehefrau", r: "Ein charmanter Mann heiratet eine wohlhabende Frau. Wenige Wochen später ist sie bei einem angeblichen Unfall tot. Es ist bereits seine vierte verstorbene Ehefrau. Was steckt dahinter?", s: "Er ist ein Heiratsschwindler und Serienmörder: Er ehelicht reiche Frauen, schließt hohe Lebensversicherungen auf sie ab und tötet sie dann, um zu erben." },
    { t: "Der stille Notruf", r: "Eine Frau ruft den Notruf an und bestellt scheinbar seelenruhig eine Pizza. Die Mitarbeiterin schickt trotzdem sofort die Polizei los. Warum?", s: "Die Frau wurde von ihrem gewalttätigen Partner bedroht und konnte nicht offen sprechen. Mit der vorgetäuschten Pizzabestellung signalisierte sie verdeckt einen Notfall – die geschulte Mitarbeiterin verstand das Signal." },
    { t: "Das einfache Rückflugticket", r: "Ein Mann stürzt im Urlaub von einer Klippe in den Tod. Seine Frau beteuert unter Tränen, es sei ein schrecklicher Unfall gewesen. Der Ermittler verhaftet sie, kaum dass er die Reisebuchung gesehen hat. Was hatte sie verraten?", s: "Sie hatte schon vor der Reise nur ein einziges Rückflugticket gebucht – für sich allein. Sie wusste also von Anfang an, dass ihr Mann nicht zurückkehren würde." }
  ];

  var ANS = [
    { k: "ja", t: "Ja", c: "#34d399" },
    { k: "nein", t: "Nein", c: "#ef4444" },
    { k: "egal", t: "Unwichtig", c: "#a78bfa" }
  ];
  function ansLabel(k) { for (var i = 0; i < ANS.length; i++) if (ANS[i].k === k) return ANS[i]; return null; }

  function shuffleIdx(n) {
    var a = []; for (var i = 0; i < n; i++) a.push(i);
    for (var j = a.length - 1; j > 0; j--) { var r = Math.floor(Math.random() * (j + 1)); var t = a[j]; a[j] = a[r]; a[r] = t; }
    return a;
  }

  GAMES.push({
    id: "blackstories",
    name: "Black Stories",
    emoji: "🕵️",
    tagline: "Einer liest, einer rät – ohne Punkte.",
    help: "Eine Person liest das Rätsel vor und kennt die geheime Lösung. Die andere stellt Ja/Nein-Fragen, um herauszufinden, was passiert ist. Die vorlesende Person antwortet nur mit Ja, Nein oder Unwichtig. Online sieht nur die vorlesende Person die Lösung – perfekt für einen Videoanruf!",
    kind: "custom",
    online: true,
    noScore: true,

    mount: function (host, ctx) {
      var me = ctx.me;
      var useOnline = Store.room.available();
      var state = null, unwatch = null, unpres = null, presence = {};

      Engine.clear(host);
      var area = E(".bs-area");
      host.appendChild(area);

      function freshState() { return { order: shuffleIdx(STORIES.length), idx: 0, reader: null, revealed: false, ans: null, ansN: 0 }; }

      if (useOnline) {
        unpres = Store.onPresence(function (p) { presence = p || {}; render(); });
        unwatch = Store.room.watch("blackstories", function (val) {
          if (!val || !val.order) { Store.room.transaction("blackstories", function (c) { return (c && c.order) ? c : freshState(); }); return; }
          state = val; render();
        });
        Store.room.transaction("blackstories", function (c) { return (c && c.order) ? c : freshState(); });
        this._cleanup = function () { if (unwatch) unwatch(); if (unpres) unpres(); };
      } else {
        state = freshState();
        this._cleanup = function () {};
        render();
      }

      function upd(patch) {
        if (useOnline) Store.room.update("blackstories", patch);
        else { Object.assign(state, patch); render(); }
      }

      function story() { return STORIES[state.order[state.idx]]; }
      function partnerOnline() { return !!presence[Engine.other(me)]; }

      function setReader(id) { upd({ reader: id }); }
      function swapRoles() { upd({ reader: Engine.other(state.reader) }); }
      function reveal() { Engine.sfx.flip(); upd({ revealed: true }); }
      function nextStory() { Engine.sfx.move(); upd({ idx: (state.idx + 1) % state.order.length, revealed: false, ans: null, ansN: (state.ansN || 0) + 1 }); }
      function sendAnswer(k) { Engine.beep(k === "ja" ? 660 : k === "nein" ? 280 : 480, 0.1, "sine", 0.07); upd({ ans: k, ansN: (state.ansN || 0) + 1 }); }

      function render() {
        if (!state) { Engine.clear(area).appendChild(E(".muted", { text: "Lade…" })); return; }
        Engine.clear(area);

        // Rollenwahl
        if (!state.reader) {
          area.appendChild(E(".bs-role-title", { text: "Wer liest vor und kennt die Lösung?" }));
          var row = E(".bs-roles");
          ["konsti", "mia"].forEach(function (id) {
            row.appendChild(E("button.bs-role", { style: { "--c": P[id].color }, onclick: function () { setReader(id); } }, [
              E(".bs-role-ava", { text: P[id].avatar }), E("div", { text: P[id].name + " liest vor" })
            ]));
          });
          area.appendChild(row);
          if (useOnline) area.appendChild(E(".presence.center", {}, [E("span.dot" + (partnerOnline() ? ".on" : "")), partnerOnline() ? (P[Engine.other(me)].name + " ist da") : (P[Engine.other(me)].name + " offline")]));
          return;
        }

        var s = story();
        var iAmReader = !useOnline || me === state.reader; // lokal: Gerät gehört der vorlesenden Person

        // Kopf
        var head = E(".bs-head", {}, [
          E(".bs-count", { text: "Story " + (state.idx + 1) + " / " + state.order.length }),
          E(".bs-reader-chip", { style: { "--c": P[state.reader].color } }, [P[state.reader].avatar + " " + P[state.reader].name + " liest vor"])
        ]);
        area.appendChild(head);
        if (useOnline) area.appendChild(E(".presence.center", {}, [E("span.dot" + (partnerOnline() ? ".on" : "")), partnerOnline() ? (P[Engine.other(me)].name + " online") : (P[Engine.other(me)].name + " offline")]));

        // Rätselkarte (sehen beide)
        area.appendChild(E(".bs-card", {}, [E(".bs-emoji", { text: "🕵️" }), E(".bs-title", { text: s.t }), E(".bs-riddle", { text: s.r })]));

        // Lösungsbereich
        if (state.revealed) {
          area.appendChild(E(".bs-solution.show", {}, [E(".bs-sol-label", { text: "💡 Auflösung" }), E(".bs-sol-text", { text: s.s })]));
        } else if (useOnline && iAmReader) {
          // Vorleser:in sieht die Lösung dauerhaft (Gegenüber sieht den Bildschirm nicht)
          area.appendChild(E(".bs-solution.show.reader", {}, [E(".bs-sol-label", { text: "🤫 Nur du siehst das – nicht vorlesen!" }), E(".bs-sol-text", { text: s.s })]));
        } else if (!useOnline) {
          // Lokal: "Halten zum Lesen" für die vorlesende Person
          var solText = E(".bs-sol-text.hidden", { text: s.s });
          var holdBtn = E("button.bs-hold", { type: "button" }, ["👁️ Halten zum Lesen (für " + P[state.reader].name + ")"]);
          var showSol = function (e) { e && e.preventDefault(); solText.classList.remove("hidden"); holdBtn.classList.add("active"); };
          var hideSol = function () { solText.classList.add("hidden"); holdBtn.classList.remove("active"); };
          holdBtn.addEventListener("pointerdown", showSol);
          holdBtn.addEventListener("pointerup", hideSol);
          holdBtn.addEventListener("pointerleave", hideSol);
          holdBtn.addEventListener("pointercancel", hideSol);
          area.appendChild(E(".bs-solution", {}, [holdBtn, solText]));
        } else {
          // Online-Rater:in: Lösung verdeckt
          area.appendChild(E(".bs-solution.locked", {}, [E(".bs-sol-text", { text: "🔒 Die Lösung kennt nur " + P[state.reader].name + ". Stell Ja/Nein-Fragen!" })]));
        }

        // Antwort-Anzeige (für Rater:in sichtbar)
        if (state.ans) {
          var a = ansLabel(state.ans);
          if (a) area.appendChild(E(".bs-answer", { style: { "--c": a.c }, key: state.ansN }, [a.t]));
        }

        // Antwort-Buttons (nur die vorlesende Person)
        if (iAmReader && !state.revealed) {
          var ab = E(".bs-answers");
          ANS.forEach(function (a) {
            ab.appendChild(E("button.bs-ans-btn", { style: { "--c": a.c }, onclick: function () { sendAnswer(a.k); } }, [a.t]));
          });
          area.appendChild(E(".bs-answers-label", { text: useOnline ? "Deine Antwort (sieht " + P[Engine.other(me)].name + "):" : "Antwort anzeigen:" }));
          area.appendChild(ab);
        }

        // Steuerung
        var actions = E(".game-actions");
        if (!state.revealed && iAmReader) actions.appendChild(E("button.btn.btn-soft", { onclick: reveal }, ["💡 Auflösen"]));
        actions.appendChild(E("button.btn.btn-soft", { onclick: swapRoles }, ["🔄 Rollen tauschen"]));
        actions.appendChild(E("button.btn.btn-primary", { onclick: nextStory }, ["➡️ Nächste Story"]));
        area.appendChild(actions);
      }
    }
  });
})();
