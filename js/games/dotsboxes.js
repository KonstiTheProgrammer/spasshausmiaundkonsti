/* Käsekästchen (Dots & Boxes) ---------------------------------------- */
(function () {
  "use strict";
  var E = Engine.el, P = Engine.players;
  var R = 4, C = 4; // Boxen (Punkte: 5x5)

  function make2d(rows, cols, val) {
    var a = []; for (var r = 0; r < rows; r++) { a.push([]); for (var c = 0; c < cols; c++) a[r].push(val); } return a;
  }
  function clone(s) { return JSON.parse(JSON.stringify(s)); }

  function boxDone(s, r, c) {
    return s.h[r][c] && s.h[r + 1][c] && s.v[r][c] && s.v[r][c + 1];
  }

  GAMES.push(Engine.turnGame({
    id: "dotsboxes",
    name: "Käsekästchen",
    emoji: "🟦",
    tagline: "Linien ziehen, Kästchen kassieren.",
    help: "Abwechselnd eine Linie zwischen zwei Punkten ziehen. Wer die 4. Seite eines Kästchens schließt, bekommt es UND darf nochmal. Wer am Ende mehr Kästchen hat, gewinnt.",

    create: function () {
      return {
        h: make2d(R + 1, C, null),   // waagerechte Linien
        v: make2d(R, C + 1, null),   // senkrechte Linien
        boxes: make2d(R, C, null),
        turn: Math.random() < 0.5 ? "konsti" : "mia"
      };
    },

    applyMove: function (state, move, by) {
      var s = clone(state);
      if (move.type === "h") { if (s.h[move.r][move.c]) return null; s.h[move.r][move.c] = by; }
      else { if (s.v[move.r][move.c]) return null; s.v[move.r][move.c] = by; }

      var gained = 0;
      for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) {
        if (!s.boxes[r][c] && boxDone(s, r, c)) { s.boxes[r][c] = by; gained++; }
      }
      if (gained === 0) s.turn = Engine.other(by); // sonst bleibt man dran
      return s;
    },

    status: function (state) {
      var k = 0, m = 0, open = 0;
      for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) {
        var o = state.boxes[r][c];
        if (o === "konsti") k++; else if (o === "mia") m++; else open++;
      }
      if (open > 0) return { over: false, winner: null, draw: false };
      if (k === m) return { over: true, winner: null, draw: true };
      return { over: true, winner: k > m ? "konsti" : "mia", draw: false };
    },

    renderBoard: function (host, view) {
      var s = view.state;
      var cols = ["var(--dot)"]; for (var i = 0; i < C; i++) cols.push("1fr", "var(--dot)");
      var board = E(".db-board", { style: { gridTemplateColumns: cols.join(" "), gridTemplateRows: cols.join(" ") } });

      // Punktestand mini
      var k = 0, m = 0;
      for (var rr = 0; rr < R; rr++) for (var cc = 0; cc < C; cc++) { if (s.boxes[rr][cc] === "konsti") k++; else if (s.boxes[rr][cc] === "mia") m++; }
      var sb = E(".db-scores", {}, [
        E(".db-sc", { style: { "--c": P.konsti.color } }, [P.konsti.avatar + " " + k]),
        E(".db-sc", { style: { "--c": P.mia.color } }, [P.mia.avatar + " " + m])
      ]);

      for (var gr = 0; gr <= 2 * R; gr++) {
        for (var gc = 0; gc <= 2 * C; gc++) {
          var even_r = gr % 2 === 0, even_c = gc % 2 === 0;
          if (even_r && even_c) {
            board.appendChild(E(".db-dot"));
          } else if (even_r && !even_c) {
            (function (r, c) {
              var owner = s.h[r][c];
              var canPlay = !view.over && view.isMyTurn && !owner;
              board.appendChild(E(".db-edge.h" + (owner ? ".on" : "") + (canPlay ? ".playable" : ""), {
                style: owner ? { "--c": P[owner].color } : null,
                onclick: function () { if (canPlay) view.move({ type: "h", r: r, c: c }); }
              }, [E(".db-line")]));
            })(gr / 2, (gc - 1) / 2);
          } else if (!even_r && even_c) {
            (function (r, c) {
              var owner = s.v[r][c];
              var canPlay = !view.over && view.isMyTurn && !owner;
              board.appendChild(E(".db-edge.v" + (owner ? ".on" : "") + (canPlay ? ".playable" : ""), {
                style: owner ? { "--c": P[owner].color } : null,
                onclick: function () { if (canPlay) view.move({ type: "v", r: r, c: c }); }
              }, [E(".db-line")]));
            })((gr - 1) / 2, gc / 2);
          } else {
            (function (r, c) {
              var owner = s.boxes[r][c];
              board.appendChild(E(".db-box" + (owner ? ".on" : ""), { style: owner ? { "--c": P[owner].color, "--c2": P[owner].color2 } : null }, [owner ? P[owner].avatar : ""]));
            })((gr - 1) / 2, (gc - 1) / 2);
          }
        }
      }
      host.appendChild(sb);
      host.appendChild(board);
    }
  }));
})();
