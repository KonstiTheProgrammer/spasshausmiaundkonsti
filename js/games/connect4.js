/* Vier Gewinnt -------------------------------------------------------- */
(function () {
  "use strict";
  var ROWS = 6, COLS = 7;
  var E = Engine.el;

  function emptyGrid() {
    var g = [];
    for (var r = 0; r < ROWS; r++) { g.push([]); for (var c = 0; c < COLS; c++) g[r].push(null); }
    return g;
  }
  function clone(g) { return g.map(function (row) { return row.slice(); }); }

  function dropRow(grid, col) {
    for (var r = ROWS - 1; r >= 0; r--) if (!grid[r][col]) return r;
    return -1;
  }

  function winnerInfo(grid) {
    var dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var who = grid[r][c]; if (!who) continue;
        for (var d = 0; d < dirs.length; d++) {
          var dr = dirs[d][0], dc = dirs[d][1], line = [[r, c]];
          for (var k = 1; k < 4; k++) {
            var nr = r + dr * k, nc = c + dc * k;
            if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || grid[nr][nc] !== who) break;
            line.push([nr, nc]);
          }
          if (line.length === 4) return { winner: who, line: line };
        }
      }
    }
    return null;
  }

  GAMES.push(Engine.turnGame({
    id: "connect4",
    name: "Vier Gewinnt",
    emoji: "🔴",
    tagline: "Vier in eine Reihe – wer denkt schneller?",
    help: "Tippt auf eine Spalte, um euren Stein fallen zu lassen. Wer zuerst vier Steine waagerecht, senkrecht oder diagonal in einer Reihe hat, gewinnt.",

    create: function () {
      return { grid: emptyGrid(), turn: Math.random() < 0.5 ? "konsti" : "mia" };
    },

    applyMove: function (state, col, by) {
      var r = dropRow(state.grid, col);
      if (r < 0) return null; // Spalte voll
      var grid = clone(state.grid);
      grid[r][col] = by;
      return { grid: grid, turn: Engine.other(by) };
    },

    status: function (state) {
      var w = winnerInfo(state.grid);
      if (w) return { over: true, winner: w.winner, draw: false, line: w.line };
      var full = state.grid[0].every(function (x) { return !!x; });
      if (full) return { over: true, winner: null, draw: true };
      return { over: false, winner: null, draw: false };
    },

    renderBoard: function (host, view) {
      var grid = view.state.grid;
      var winCells = {};
      if (view.status.line) view.status.line.forEach(function (p) { winCells[p[0] + "," + p[1]] = true; });
      var lastCol = view.lastMove;
      var lastCellRow = -1;
      if (typeof lastCol === "number") { for (var rr = 0; rr < ROWS; rr++) { if (grid[rr][lastCol]) { lastCellRow = rr; break; } } }

      var board = E(".c4-board", { style: { "--cols": COLS, "--rows": ROWS } });
      for (var c = 0; c < COLS; c++) {
        (function (col) {
          var canPlay = !view.over && (view.isMyTurn) && dropRow(grid, col) >= 0;
          var colEl = E(".c4-col" + (canPlay ? ".playable" : ""), {
            onclick: function () { if (canPlay) view.move(col); }
          });
          for (var r = 0; r < ROWS; r++) {
            var who = grid[r][col];
            var isLast = (col === lastCol && r === lastCellRow);
            var cell = E(".c4-cell");
            var slot = E(".c4-slot");
            if (who) {
              var disc = E(".c4-disc" + (isLast ? ".drop" : "") + (winCells[r + "," + col] ? ".win" : ""), {
                style: { "--c": Engine.players[who].color, "--c2": Engine.players[who].color2 }
              });
              slot.appendChild(disc);
            }
            cell.appendChild(slot);
            colEl.appendChild(cell);
          }
          board.appendChild(colEl);
        })(c);
      }
      host.appendChild(board);
    }
  }));
})();
