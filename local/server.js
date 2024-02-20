//웹소켓서버
const express = require("express");
//const cors = require("cors");
const app = express();
// HTTP 서버(server)를 생성
const server = require("http").Server(app);
// Socket.IO 모듈을 사용하여 웹 소켓 서버(io)를 생성

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});





//서버와 클라이언트가 연결되면 핸들러 실행
io.on("connection", (socket) => {
  //클라이언트에서 "join-room" 이벤트가 발생하면, 해당 방에 참여하려는 사용자의 roomId와 userId가 소켓을 통해 서버로 전송
  console.log("io.on");

  socket.on("join-room", (roomId, userId) => {
    console.log("룸아이디", roomId);
    console.log("유저아이디", userId);
    //서버는 해당 사용자를  방에 조인 시킴
    socket.join(roomId);
    //해당방에 속한 다른 사용자들에게 새로운 사용자가 방에 연결되었음을 알리기 위해 "user-connected"이벤트를 브로드캐스트 함
    socket.to(roomId).broadcast.emit("user-connected", userId);

    socket.on("disconnect", () => {
      console.log("연결해제");
      //이때 서버는 해당 방에서 사용자가 연결을 해제했음을 다른 사용자들에게 알리기 위해 "user-disconnected" 이벤트를 브로드캐스트
      socket.to(roomId).broadcast.emit("user-disconnected", userId);
    });
  });
});

server.listen(3000);
