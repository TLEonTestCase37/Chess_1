const socket = io();

//frontend emits some data
// socket.emit("Hello");

//frontend k console pe log kiye
//upon receiving some data
// socket.on("Hello Bhai Log", function () {
//   console.log("Hello Bhai");
// });

const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
  const board = chess.board();

  //if there is some garbage in
  //the inner html of the board element
  //remove it beforehand
  boardElement.innerHTML = "";

  //prints quare of the board
  //try it out for visualizing
  //how board works
  board.forEach((row, rowIndex) => {
    row.forEach((square, squareIndex) => {
      //creating a square based on ths indices
      const squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
      );

      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = squareIndex;

      //if a sqaure holds a piece
      if (square) {
        const pieceElemenet = document.createElement("div");
        pieceElemenet.classList.add(
          "piece",
          square.color === "w" ? "white" : "black"
        );
        //we will get this through unicode
        pieceElemenet.innerText = getPieceUnicode(square);
        //to determine whether a piece is
        //draggable or not ,check
        //if its the player's own piece or not
        pieceElemenet.draggable = playerRole === square.color;

        //when a piece is dragged
        pieceElemenet.addEventListener("dragstart", (e) => {
          if (pieceElemenet.draggable) {
            draggedPiece = pieceElemenet;
            sourceSquare = { row: rowIndex, col: squareIndex };
            //to make sure there is no issue while dragging pieces
            //necessity while creating a draggable element
            e.dataTransfer.setData("text/plain", "");
          }
        });

        pieceElemenet.addEventListener("dragend", (e) => {
          draggedPiece = null;
          sourceSquare = null;
        });

        //square element me piece daal diya
        squareElement.appendChild(pieceElemenet);
      }

      squareElement.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      squareElement.addEventListener("drop", (e) => {
        e.preventDefault();
        if (draggedPiece) {
          const targetSquare = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col),
          };
          handleMove(sourceSquare, targetSquare);
        }
      });
      boardElement.appendChild(squareElement);
    });
  });

  if (playerRole === "b") {
    boardElement.classList.add("flipped");
  }
  else{
    boardElement.classList.remove("flipped");
  }
};

const handleMove = (source, target) => {
  const move = {
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    promotion: "q",
  };

  socket.emit("move", move);
  renderBoard();
};

// to get the images or shapes of the pieces
const getPieceUnicode = (piece) => {
  const unicodePieces = {
    K: "♔",
    Q: "♕",
    R: "♖",
    B: "♗",
    N: "♘",
    P: "♙",
    k: "♚",
    q: "♛",
    r: "♜",
    b: "♝",
    n: "♞",
    p: "♟",
  };
  return unicodePieces[piece.type] || "";
};

socket.on("playerRole", function (role) {
  playerRole = role;
  renderBoard();
});

socket.on("spectatorRole", function () {
  playerRole = null;
  renderBoard();
});

socket.on("boardState", function (fen) {
  chess.load(fen);
  renderBoard();
});

socket.on("move", function (move) {
  chess.move(move);
  renderBoard();
});
