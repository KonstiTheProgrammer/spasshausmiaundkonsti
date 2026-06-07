/* Tic Tac Toe --------------------------------------------------------- */
(function () {
  "use strict";
  var E = Engine.el;
  var LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  function winnerInfo(cells) {
    for (var i = 0; i < LINES.length; i++) {
      var a = LINES[i][0], b = LINES[i][1], c = LINES[i][2];
      if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) return { winner: cells[a], line: LINES[i] };
    }
    return null;
  }

  GAMES.push(Engine.turnGame({
    id: "tictactoe",
    name: "Tic Tac Toe",
    emoji: "❌",
    tagline: "Drei in einer Reihe – der Klassiker.",
    help: "Abwechselnd ein Feld antippen. Wer zuerst drei eigene Felder in einer Reihe hat (waagerecht, senkrecht oder diagonal), gewinnt.",

    create: function () {
      return { cells: [null, null, null, null, null, null, null, null, null], turn: Math.random() < 0.5 ? "konsti" : "mia" };
    },

    applyMove: function (state, idx, by) {
      if (state.cells[idx]) return null;
      var cells = state.cells.slice();
      cells[idx] = by;
      return { cells: cells, turn: Engine.other(by) };
    },

    status: function (state) {
      var w = winnerInfo(state.cells);
      if (w) return { over: true, winner: w.winner, draw: false, line: w.line };
      if (state.cells.every(function (x) { return !!x; })) return { over: true, winner: null, draw: true };
      return { over: false, winner: null, draw: false };
    },

    renderBoard: function (host, view) {
      var cells = view.state.cells;
      var winCells = {};
      if (view.status.line) view.status.line.forEach(function (i) { winCells[i] = true; });
      var board = E(".ttt-board");
      for (var i = 0; i < 9; i++) {
        (function (idx) {
          var who = cells[idx];
          var canPlay = !view.over && view.isMyTurn && !who;
          var cell = E(".ttt-cell" + (canPlay ? ".playable" : "") + (winCells[idx] ? ".win" : ""), {
            onclick: function () { if (canPlay) view.move(idx); }
          });
          if (who) {
            var isLast = idx === view.lastMove;
            cell.appendChild(E(".ttt-mark" + (isLast ? ".pop" : ""), {
              style: { "--c": Engine.players[who].color }
            }, [Engine.players[who].avatar]));
          }
          board.appendChild(cell);
        })(i);
      }
      host.appendChild(board);
    }
  }));
})();
