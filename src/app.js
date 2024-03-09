// server.mjs 파일

import express from "express";
import http from "http";
import { Server as SocketServer } from "socket.io";
import cors from "cors";

const app = express();
const httpServer = http.createServer(app);
const io = new SocketServer(httpServer);
app.use(cors());
// 클라이언트가 연결되었을 때 실행되는 이벤트 리스너
io.on("connection", (socket) => {
  console.log(socket.rooms);

  // 클라이언트로부터 메시지를 받을 때 실행되는 이벤트 리스너
  socket.on("message", (data) => {
    console.log("클라이언트로부터 메시지를 받았습니다:", data);
  });

  // 클라이언트가 연결을 끊었을 때 실행되는 이벤트 리스너
  socket.on("disconnect", () => {
    console.log(socket.rooms);
    console.log("클라이언트가 연결을 끊었습니다.");
  });
});

const PORT = process.env.PORT || 8000;

httpServer.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
