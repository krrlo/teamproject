//서버와 통신할 준비 , 서버와 클라이언트 간의 실시간 양방향 통신 설정,
//서버의 루트 경로에 연결하도록 지정
//소켓 io () 함수   ()에 서버의 url 전달 , 해당 url 에 연결된 소켓을 생성
//서버로부터 이벤트를 수신하거나 서버에 이벤트를 전송할 수 있음
//socket.emit()을 사용하여 서버로 이벤트를 보낼 수 있음 socket.on()을 사용하여 서버로부터 오는 이벤트를 처리할 수 있음
const socket = io("/");
const videoGrid = document.getElementById("video-grid");

//peer객체 생성, ( peer객체의 id를 설정 , 다른피어에게 전달됨  ,  peer서버의 호스트주소와 포트번호 설정)
//서버 내의 특정 프로세스에 연결
const myPeer = new Peer({
  host: "/", // 서버의 주소
  port: "3001", //PeerJS 서버가 실행되고 있는 포트
});

//새로운 비디오 요소 생성
const myVideo = document.createElement("video");
//생성된 비디오 요소를 음소거
myVideo.muted = true;

const peers = {};

//사용자의 캠과 마이크에 접근
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  //사용자가 미디어 액세스 권한을 수락하면
  .then((stream) => {
    //미디어 스트림을 전달받아 해당 스트림을 비디오에 연결, 내 화면을 화면에추가
    addVideoStream(myVideo, stream);

    //내 피어(myPeer) 다른사용자로부터 call 받을때의 동작을 정의
    myPeer.on("call", (call) => {
      //전화를 받았을때  내 비디오 및 오디오 스트림을 상대방에게 전달
      call.answer(stream);
      // 새로운 비디오 요소 생성 상대방의 비디오 스트림을 표시하는 데 사용
      const video = document.createElement("video");

      // answer가 발생하면 'stream'이라는 이벤트를 통해 다른 유저의 stream을 받아옴
      //상대방의 비디오 스트림을 수신할때 실행되는 콜백함수 정의
      call.on("stream", (userVideoStream) => {
        //상대방의 비디오 스트림을 새로운 비디오 요소에 추가하여 나의 화면에 표시
        addVideoStream(video, userVideoStream);
      });
    });

    //다른 사용자가 방에 연결되었을 때 / user-connected 이벤트가 발생했을때, 실행되는 콜백함수,
    //새로운 사용자의 id를 전달 받는다 (userId)
    socket.on("user-connected", (userId) => {
      //해당 사용자와의 연결을 설정하고 스트림을 전달하는 작업
      //connectToNewUser함수실행

      connectToNewUser(userId, stream);
    });
  }); ////.then

//다른 사용자가 연결을 종료하면 호출되는 이벤트 핸들러
//다른 peer의 stream을 close 시킴
socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

//peer 서버와 정상적으로 통신이 된 경우 'open' 이벤트가 발생
//이어서 Peer 객체의 ID를 생성하고, 해당 ID로 Peer가 서버에 등록
//이 과정에서 Peer 객체가 서버와 연결될 때 open 이벤트가 자동으로 발생
// id = 자신의 peerID
myPeer.on("open", (id) => {
  //socket을 통해 서버로 join-room 이벤트를 emit , 이때 ROOM_ID와 자신의 id를 함께 전달,
  //서버가 해당 Peer를 특정 방에 연결하고, 다른 사용자들과의 연결을 관리할 수 있도록 하는 역할
  //서버는 이 이벤트를 수신하여 클라이언트가 특정 방에 참여하고자 함을 이해
  socket.emit("join-room", ROOM_ID, id);
});

//mypeer.가 다른 사용자에게 통화를 걸어 자신의 비디오 스트림을 전달하는 과정.
//새로운 사용자가 방에 연결되었을때 실행되는 함수
//새로운 사용자와 peer연결 설정,
//사용자id와 사용자의 스트림을 매개변수로 받음
function connectToNewUser(userId, stream) {
  //현재 사용자가  새로운 사용자 에게 전화를 걸고  자신의 스트림을 전달
  const call = myPeer.call(userId, stream);
  //새로운 사용자의 비디오 스트림을 표시하기위해
  const video = document.createElement("video");
  //새로운 사용자로부터 스트림이 수신될때  , 새로운 사용자의 스트림을 화면에 추가
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  //연결이 종료될때 실행할 콜백함수등록
  call.on("close", () => {
    video.remove();
  });

  //peers 객체에 해당 사용자의 ID를 키로, 해당 사용자와의 연결을 값으로 저장
  //나중에 연결을 관리하는데 사용
  peers[userId] = call;
}

//const myVideo = document.createElement("video");
// const video = document.createElement("video");
function addVideoStream(video, stream) {
  //비디오 요소의 srcObject 속성에 스트림 객체(stream)를 할당
  video.srcObject = stream;
  //비디오 요소의 "loadedmetadata" 이벤트를 리스닝
  //이 이벤트는 비디오의 메타데이터(너비, 높이 등)가 로드되었을 때 발생
  video.addEventListener("loadedmetadata", () => {
    //이벤트가발생하면 화면에 비디오를 표시하기위해 play()함수호출
    video.play();
  });

  //const videoGrid = document.getElementById("video-grid");
  //videoGrid라는 HTML 요소에 해당 비디오 요소를 추가
  videoGrid.append(video);
}
