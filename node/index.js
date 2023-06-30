const http = require("http");
const server = http.createServer();

// 创建 socket.io 实例
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const { getChallengePair } = require("./utils/auth");

const onlineMap = new Map();
const challengeMap = new Map();

io.on("connection", (socket) => {
  console.log("A client connected.");

  // 登陆 预检
  socket.on("login:challenge", (data) => {
    const publicKey = data.publicKey;
    const { question, answer } = getChallengePair(publicKey);
    challengeMap.set(publicKey, answer);
    socket.emit("login:challenge", { question: question });
  });
  socket.on("login:answer", (data) => {
    const {publicKey, answer} = data;

    if(!challengeMap.has(publicKey)) {
      socket.emit("login:answer", { success: false, message: "Use login, ask for challenge first." });
      return;
    }
    const savedAnswer = challengeMap.get(publicKey);

    if(answer !== savedAnswer) {
      socket.emit("login:answer", { success: false, message: "Challenge failure." });
      return;
    }
    onlineMap.set(publicKey, socket); //two way bind
    socket.publicKey = publicKey;
    socket.emit("login:answer", { success: true, message: "Log in success." });
  });

  // 消息
  socket.on("message", (data) => {
    console.log("Received message:", data);
    // 响应
    socket.emit("message", "Server received your message.");
  });

  // 发送消息给好友
  socket.on("send", (data) => {
    if(!socket.publicKey || !onlineMap.has(socket.publicKey)) {
      socket.emit("send", { success: false, message: "Log in first." });
      return;
    }

    const {receiverKey, message} = data;
    const serverKey = socket.publicKey;
    if(!onlineMap.has(receiverKey)) {
      socket.emit("send", { success: false, message: "Receiver offline." });
      return;
    }
    const receiver = onlineMap.get(receiverKey);
    receiver.emit("receive", { sender: serverKey, message: message });
    socket.emit("send", { success: true, message: "Message send." });
  });

  // 断开连接
  socket.on("disconnect", () => {
    console.log("A client disconnected.");
    if(socket.publicKey) {  // remove login status
      onlineMap.delete(socket.publicKey);
    }
  });
});

server.listen(3000, () => {
  console.log("WS Server listening on port 3000.");
});
