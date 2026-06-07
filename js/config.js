/* =====================================================================
   KONFIGURATION
   =====================================================================
   Das Spaßhaus funktioniert SOFORT ohne irgendeine Einrichtung
   (lokal auf einem Gerät – perfekt, wenn ihr zusammen seid).

   Wollt ihr ÜBER DIE DISTANZ zusammen spielen und EINEN gemeinsamen
   Punktestand teilen, braucht ihr ein kostenloses Firebase-Projekt.
   Die genaue Anleitung steht in der README.md (dauert ~5 Minuten).

   Tragt danach hier eure Firebase-Werte ein. Solange "apiKey" leer
   ist, bleibt alles lokal – nichts geht kaputt.
   ===================================================================== */

window.KM_CONFIG = {
  // ---- Firebase (optional, für Online-Spiel über die Distanz) ----
  firebase: {
    apiKey: "AIzaSyB4ecBrC6jp27wUpjSrnKiy71vrdWv5kPo",
    authDomain: "spasshaus-40b96.firebaseapp.com",
    databaseURL: "https://spasshaus-40b96-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "spasshaus-40b96",
    storageBucket: "spasshaus-40b96.firebasestorage.app",
    messagingSenderId: "229044858396",
    appId: "1:229044858396:web:2a8c26b097e9888b7d79d9",
    measurementId: "G-TXPLQH4N9C"
  },

  // Euer gemeinsamer "Raum". Beide laden dieselbe Seite -> denselben Code,
  // und landen so im selben Spielstand/Punktestand. (Privat & nicht offensichtlich.)
  roomCode: "mk-spasshaus-7q9f3a"
};

// Online wird automatisch aktiv, sobald oben ein apiKey + databaseURL stehen.
window.KM_ONLINE_CONFIGURED = !!(
  window.KM_CONFIG.firebase.apiKey &&
  window.KM_CONFIG.firebase.databaseURL
);
