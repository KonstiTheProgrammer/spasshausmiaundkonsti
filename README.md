# 🏠💕 Konsti & Mia – Spaßhaus

Ein kleines Spiele-Portal nur für euch zwei. Wählt am Anfang, ob ihr **Konsti**
oder **Mia** seid, spielt coole 2-Spieler-Spiele und sammelt Punkte in einem
gemeinsamen **globalen Punktestand**. Sieht auf **Handy, iPad und PC** gut aus.

> Gebaut für eine Fernbeziehung: Es läuft **sofort lokal** (wenn ihr zusammen an
> einem Gerät seid) und kann optional **online über die Distanz** gespielt werden,
> sodass ihr denselben Punktestand teilt und turnbasierte Spiele gemeinsam spielt.

---

## 🚀 Sofort loslegen (lokal, ohne Einrichtung)

Es gibt **zwei** Wege:

**A) Einfach öffnen**
- Doppelklick auf `index.html`. Fertig. 🎉
  (Alles wird auf diesem einen Gerät gespeichert – perfekt, wenn ihr nebeneinander sitzt.)

**B) Mit lokalem Mini-Server** (empfohlen zum Testen der Online-Funktion)
- Im Projektordner ein Terminal öffnen und starten:
  ```bash
  python -m http.server 4321
  ```
- Dann im Browser öffnen: <http://localhost:4321>

Beim ersten Start wählt ihr eure Figur (🐻 Konsti / 🐰 Mia). Das lässt sich
jederzeit oben rechts über **⚙️** wieder ändern.

---

## 🎮 Die Spiele

| Spiel | Was | Modus |
|---|---|---|
| 🔴 **Vier Gewinnt** | Vier Steine in eine Reihe | lokal + online |
| ❌ **Tic Tac Toe** | Drei in einer Reihe | lokal + online |
| 🧠 **Memory** | Paare finden | lokal + online |
| 🟦 **Käsekästchen** | Linien ziehen, Kästchen kassieren | lokal + online |
| ❓ **Quizduell** | 6 Fragen, wer mehr weiß, gewinnt | lokal + online |
| ✌️ **Schere Stein Papier** | Best of 5, gleichzeitig wählen | lokal + online |
| ⚡ **Reaktionsduell** | Wer tippt bei Grün zuerst? | nur zusammen am Gerät |
| 🕵️ **Black Stories** | Einer liest, einer rät (Ja/Nein) | lokal + online, ohne Punkte |
| 💌 **Pärchen-Fragen** | Näher kommen, ohne Punkte | für euch beide |

> **Black Stories** ist wie gemacht für die Distanz: Eine Person liest das Rätsel
> und kennt die geheime Lösung, die andere stellt Ja/Nein-Fragen. **Online sieht
> nur die vorlesende Person die Lösung** – ihr spielt es einfach per Videoanruf.
> Lokal (ein Gerät) hält die vorlesende Person den „👁️ Halten zum Lesen“-Knopf,
> um die Lösung kurz nachzulesen, ohne dass die ratende Person sie sieht.

**Punkte:** Wer ein Spiel gewinnt, bekommt **1 Punkt** auf den globalen
Punktestand. Auf der Startseite seht ihr Konsti vs. Mia, einen Balken, wer führt,
Serien-Statistiken und eine Aufschlüsselung pro Spiel.

---

## 🌍 Online über die Distanz spielen (optional, ~5 Min)

Damit ihr von **zwei verschiedenen Geräten** denselben Punktestand teilt und
turnbasierte Spiele gemeinsam spielen könnt, braucht es eine kleine kostenlose
Datenbank (Firebase). Das ist kostenlos und reicht für euch zwei locker aus.

### Schritt 1 – Firebase-Projekt anlegen
1. Geht auf <https://console.firebase.google.com> und meldet euch mit einem
   Google-Konto an.
2. **„Projekt hinzufügen"** → Name z. B. `spasshaus` → Google Analytics könnt ihr
   **ausschalten** → Projekt erstellen.

### Schritt 2 – Realtime Database aktivieren
1. Links im Menü **„Build → Realtime Database"** öffnen.
2. **„Datenbank erstellen"** → Region wählen (Europa, z. B. `europe-west1`).
3. Startmodus: **„Im Testmodus starten"** wählen (einfachste Variante).
4. Merkt euch die **URL** der Datenbank (sieht so aus:
   `https://spasshaus-xxxx-default-rtdb.europe-west1.firebasedatabase.app`).

### Schritt 3 – App in Firebase registrieren
1. Im Projekt oben aufs **Web-Symbol `</>`** klicken (App hinzufügen).
2. Spitznamen vergeben (egal was) → registrieren.
3. Firebase zeigt euch ein `firebaseConfig`-Objekt mit Werten wie `apiKey`,
   `authDomain`, `databaseURL`, `projectId`, `appId`.

### Schritt 4 – Werte eintragen
Öffnet die Datei **`js/config.js`** und tragt eure Werte ein:

```js
window.KM_CONFIG = {
  firebase: {
    apiKey:      "AIza....",
    authDomain:  "spasshaus-xxxx.firebaseapp.com",
    databaseURL: "https://spasshaus-xxxx-default-rtdb.europe-west1.firebasedatabase.app",
    projectId:   "spasshaus-xxxx",
    appId:       "1:....:web:...."
  },
  roomCode: "konsti-und-mia"   // beide müssen denselben Code haben (Standard passt)
};
```

> Sobald `apiKey` **und** `databaseURL` ausgefüllt sind, schaltet sich der
> Online-Modus automatisch ein. Ihr seht es unter **⚙️ → Verbindung**
> („🌍 Online verbunden").

### Schritt 5 – Online stellen, damit ihr beide draufkommt
Ihr müsst die Seite irgendwo hochladen, damit beide sie über das Internet öffnen
können. Einfachste Möglichkeiten (kostenlos):

**GitHub Pages (empfohlen, ihr habt ja GitHub):**
Das Projekt ist bereits ein git-Repository mit einem ersten Commit. Es fehlt nur
noch das Hochladen:
1. Auf <https://github.com/new> ein **neues, leeres** Repository anlegen
   (z. B. `spasshaus`) – **ohne** README/.gitignore (haben wir schon). Public ist ok.
2. Im Projektordner die zwei Zeilen ausführen (URL anpassen):
   ```bash
   git remote add origin https://github.com/DEIN-NAME/spasshaus.git
   git push -u origin main
   ```
3. Im Repo: **Settings → Pages → Build and deployment → Source: „Deploy from a
   branch“ → Branch: `main` / `/ (root)` → Save**.
4. Nach ~1 Minute ist die Seite live unter
   `https://DEIN-NAME.github.io/spasshaus/`. Diese URL teilt ihr euch beide. 🎉

> Tipp: Änderungen später einfach mit `git add -A && git commit -m "..." &&
> git push` hochladen – GitHub Pages aktualisiert sich automatisch.

**Noch einfacher ohne git – Netlify Drop:** <https://app.netlify.com/drop> – den
ganzen Projektordner ins Browserfenster ziehen, fertig (sofort eine URL).

Danach öffnet **beide** dieselbe URL, wählt eure Figur – und schon teilt ihr
Punkte und könnt Vier Gewinnt, Tic Tac Toe, Memory & Käsekästchen über die
Distanz spielen. Bei turnbasierten Spielen seht ihr „Du bist dran" bzw.
„… ist dran" und ob der/die andere gerade online ist. Zieht jemand offline einen
Zug, wird er gespeichert und ist da, sobald die andere Person wieder reinschaut. 💕

#### Datenbank-Regeln (wichtig, damit es dauerhaft läuft)
Der Testmodus läuft nach ~30 Tagen ab. Setzt in der Realtime Database unter
**„Regeln"** Folgendes – damit ist nur euer Spielbereich `rooms/` beschreibbar:

```json
{
  "rules": {
    "rooms": { ".read": true, ".write": true }
  }
}
```

**Warum kein Login nötig ist:** Es gibt nur euch zwei. Statt Benutzerkonten
verbindet euch der gemeinsame `roomCode` (in `js/config.js`). Wählt dort einen
**privaten, nicht zu erratenden** Code (z. B. `kuschelhase-2024-xyz`) – beide
denselben. Der Firebase-`apiKey` darf ruhig öffentlich im Code stehen, das ist bei
Web-Apps normal und kein Geheimnis. Da niemand sonst eure URL und euren `roomCode`
kennt, ist das für ein privates Pärchen-Projekt völlig ausreichend.

> Hinweis: Das erlaubt technisch jedem mit der Datenbank-URL Zugriff. Für ein
> privates Pärchen-Projekt ist das in der Praxis unkritisch (die URL kennt sonst
> niemand). Wer es wasserdicht will, kann später Firebase-Authentifizierung
> ergänzen.

---

## 🎨 Anpassen

- **Namen / Farben / Avatare:** in `js/engine.js` ganz oben bei `Engine.players`.
  ```js
  konsti: { id:"konsti", name:"Konsti", avatar:"🐻", color:"#38bdf8", color2:"#6366f1" },
  mia:    { id:"mia",    name:"Mia",    avatar:"🐰", color:"#fb7185", color2:"#f472b6" }
  ```
- **Eigene Pärchen-Fragen:** in `js/games/questions.js` zur Liste `DECK` hinzufügen.
- **Quiz-Fragen & -Themen:** in `js/games/quizduell.js` bei `CATS`. Jede Frage:
  `{ q: "Frage?", a: ["A","B","C","D"], c: 0 }` – `c` ist der Index der richtigen
  Antwort. Themen aktuell: Game of Thrones, Wien, Forchheim, Bamberg, Nürnberg,
  Grundschullehramt, Informatik.
- **Eigene Black Stories:** in `js/games/blackstories.js` bei `STORIES` hinzufügen:
  `{ t: "Titel", r: "Das Rätsel…", s: "Die Auflösung…" }`.
- **Gemeinsamer Raum:** `roomCode` in `js/config.js` (beide gleich).

---

## 📱 Auf dem Handy / iPad wie eine App

Öffnet die (gehostete) Seite im Browser und nutzt **„Zum Home-Bildschirm
hinzufügen"**. Dann startet das Spaßhaus im Vollbild wie eine echte App.

---

## 🛠️ Technik (kurz)

- Reines HTML/CSS/JavaScript, **kein Build nötig**.
- Läuft komplett offline (lokal, `localStorage`); Online-Sync optional über
  Firebase Realtime Database.
- Aufbau: `index.html`, `css/styles.css`, `js/` (config, store, engine, app) und
  `js/games/` (ein Spiel pro Datei).

Viel Spaß, ihr zwei – egal wie weit weg, hier spielt ihr zusammen. 💕
