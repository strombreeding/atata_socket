// server.mjs 파일

import express from "express";
import http from "http";
import { Server as SocketServer } from "socket.io";
import cors from "cors";
import { randomUUID } from "crypto";

const app = express();
const httpServer = http.createServer(app);
const io = new SocketServer(httpServer);
app.use(cors());

app.get("/", (req, res) => {
  return res.send("hello world");
});
let waitingUsers = [];
/* 
  아래 타입
  {
  mid : string;
  user1: User;
  user2: User;
  stats : "boom" | "success"
}[]
*/
let matchingRoom = []; //
// 클라이언트가 연결되었을 때 실행되는 이벤트 리스너
io.on("connection", (socket) => {
  socket.on("joinQueue", () => {
    console.log("큐잡기");
    waitingUsers.push(socket);
    if (waitingUsers.length >= 2) {
      // Matchmaking
      const user1 = waitingUsers.shift();
      const user2 = waitingUsers.shift();
      const roomId = randomUUID();
      matchingRoom.push(roomId);
      // Emit message to users for connection
      user1.emit("matchFound", roomId);
      user2.emit("matchFound", roomId);
    }
  });

  socket.on("acceptMatch", (id) => {
    console.log("입장", id);
    const idx = matchingRoom.indexOf(id);
    socket.join(id);
    const acceptCnt = io.sockets.adapter.rooms.get(id);
    if (acceptCnt && acceptCnt.size >= 2) {
      // ㅇㅋ 둘다 수락 이동해.
      socket.to(id).emit("welcome");
      socket.to(id).emit("goBang");
      socket.emit("goBang"); // 이동하라는 emit 보내기
    } else if (idx < 0) {
      socket.emit("cancelMatch");
      // socket.rooms.delete(id);
      io.sockets.adapter.rooms.delete(id);
      console.log(
        "유저가 취소하거나 이동함 ",
        io.sockets.adapter.rooms.get(id)
      );
    }
  });

  socket.on("moveToBangDone", (id) => {
    console.log("오 잘 왔네 ㅋㅋ");
    socket.join(id);
    const acceptCnt = io.sockets.adapter.rooms.get(id);
    if (acceptCnt.size >= 2) {
      socket.to(id).emit("welcome");
    }
  });

  socket.on("cancelMatch", (id) => {
    console.log("취소 ", id);
    const idx = matchingRoom.indexOf(id);
    socket.join(id);
    socket.to(id).emit("cancelMatch");
    matchingRoom.splice(idx, 1);
    socket.rooms.delete(id);
    // waitingUsers.push(socket);
  });

  socket.on("offer", (offer, roomId) => {
    console.log(roomId, "에게 오퍼 전달");
    socket.to(roomId).emit("offer", offer);
  });

  socket.on("answer", (answer, roomId) => {
    socket.to(roomId).emit("answer", answer);
  });

  socket.on("modalClose", (id) => {
    socket.to(id).emit("closeRoom");
    socket.emit("closeRoom");
    socket.rooms.delete(id);
    const idx = matchingRoom.indexOf(id);
    matchingRoom.splice(idx, 1);
  });

  socket.on("ice", (ice, roomId) => {
    socket.to(roomId).emit("ice", ice);
  });

  socket.on("disconnect", (id) => {
    waitingUsers = waitingUsers.filter((user) => user !== socket);
    console.log("커넥해제", matchingRoom);
  });
});

const PORT = process.env.PORT || 8000;

httpServer.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
