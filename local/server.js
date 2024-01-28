//시그널링서버
const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidV4 } = require("uuid");

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

//방 고유아이디를 생성한다음 해당 id를 사용하여 방에 참여할수 있도록 함
//roomId란 이름으로 렌더링할 HTML 템플릿에 방 ID 전달하는 역할
//room ejs로 보냄
app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

//서버와 클라이언트가 연결되면 핸들러 실행
io.on("connection", (socket) => {
  //클라이언트에서 "join-room" 이벤트가 발생하면, 해당 방에 참여하려는 사용자의 roomId와 userId가 소켓을 통해 서버로 전송
  socket.on("join-room", (roomId, userId) => {
    //서버는 해당 사용자를  방에 조인 시킴
    socket.join(roomId);
    //해당방에 속한 다른 사용자들에게 새로운 사용자가 방에 연결되었음을 알리기 위해 "user-connected"이벤트를 브로드캐스트 함
    socket.to(roomId).broadcast.emit("user-connected", userId);

    socket.on("disconnect", () => {
      //이때 서버는 해당 방에서 사용자가 연결을 해제했음을 다른 사용자들에게 알리기 위해 "user-disconnected" 이벤트를 브로드캐스트
      socket.to(roomId).broadcast.emit("user-disconnected", userId);
    });
  });
});

server.listen(3000);
