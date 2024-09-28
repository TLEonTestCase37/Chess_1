const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");
const { title } = require("process");

const app = express();
const server = http.createServer(app);

const io = socket(server);

const chess = new Chess();
let players = {};
let currPlayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game" });
});

io.on("connection", function (uniquesocket) {
  console.log("Connected");

  // io is used for everyone
  //uniquesocekt is for just one browser
  //disconnection
  // uniquesocket.on("disconnect", function () {
  //   console.log("Disconnected");
  // });

  // uniquesocket.on("Hello", function () {
  //   receives message from a browser
  //   console.log("Hello recieved");

  //   backend sends message to every browser connected
  //   io.emit("Hello Bhai Log");
  // });

  if (!players.white) {
    players.white = uniquesocket.id;
    uniquesocket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = uniquesocket.id;
    uniquesocket.emit("playerRole", "b");
  } else {
    uniquesocket.emit("spectatorRole");
  }

  //if a player disconnects
  //remove it from the players list
  uniquesocket.on("disconnect", function () {
    if (uniquesocket.id === players.white) {
      delete players.white;
    } else if (uniquesocket.id === players.black) {
      delete players.black;
    }
  });

  //when a move is received from a player
  uniquesocket.on("move", (move) => {
    //for a valid move
    try {
      //if its not your move and you move it
      //return false to the player
      if (chess.turn() == "w" && uniquesocket.id !== players.white) return;
      if (chess.turn() == "b" && uniquesocket.id !== players.black) return;

      //check the move in the variable result
      const result = chess.move(move);

      //if a valid move,update the game state
      if (result) {
        currPlayer = chess.turn();
        io.emit("move", move);

        //fen is just the board's current state
        //pgn is the whole game played uptil that point
        io.emit("boardState", chess.fen());
      } else {
        console.log("Invalid move: ", move);
        uniquesocket.emit("invalidMove", move);
      }
    } catch (err) {
      //for not a valid move
      //catch the error
      //otherwise server will crash
      console.log(err);
      uniquesocket.emit("invalidMove", move);
    }
  });
});

server.listen(3000, function () {
  console.log("Server is up and running on port 3000");
});
