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
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    appId: ""
  },

  // Euer gemeinsamer "Raum". Beide müssen denselben Code haben, um
  // im selben Spielstand/Punktestand zu landen. Standard reicht völlig.
  roomCode: "konsti-und-mia"
};

// Online wird automatisch aktiv, sobald oben ein apiKey + databaseURL stehen.
window.KM_ONLINE_CONFIGURED = !!(
  window.KM_CONFIG.firebase.apiKey &&
  window.KM_CONFIG.firebase.databaseURL
);
