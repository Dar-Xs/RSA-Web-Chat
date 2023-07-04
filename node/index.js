let server;
if(process.env.ENV === 'production') {
  const https = require("https");
  const fs = require("fs");
  const option = {
    key: fs.readFileSync(process.env.KEY_PATH),
    cert: fs.readFileSync(process.env.CERT_PATH)
  }
  server = https.createServer(option);
} else if(process.env.ENV === 'development') {
  const http = require("http");
  server = http.createServer();
}
const crypto = require("crypto");

// 创建 socket.io 实例
const io = require("socket.io")(server, {
  cors: {
    origin: process.env.ORIGIN,
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
    const { publicKey, answer } = data;

    if (!challengeMap.has(publicKey)) {
      socket.emit("login:answer", {
        success: false,
        message: "Use login, ask for challenge first.",
      });
      return;
    }
    const savedAnswer = challengeMap.get(publicKey);

    if (answer !== savedAnswer) {
      socket.emit("login:answer", {
        success: false,
        message: "Challenge failure.",
      });
      return;
    }
    challengeMap.delete(publicKey);
    const hash = crypto.createHash("sha256").update(publicKey).digest("hex");
    onlineMap.set(hash, socket); //two way bind
    socket.hash = hash;
    socket.publicKey = publicKey;
    socket.emit("login:answer", {
      success: true,
      hash: hash,
      message: "Log in success.",
    });
  });

  // 消息
  socket.on("message", (data) => {
    console.log("Received message:", data);
    // 响应
    if(data.message === "ping") {
      socket.emit("message", "Pong.");
    } else {
      socket.emit("message", "Server received your message.");
    }
  });

  // 寻找好友
  socket.on("find", (data) => {
    if (!socket.publicKey || !onlineMap.has(socket.hash)) {
      socket.emit("find", { success: false, message: "Log in first." });
      return;
    }

    const { userHash } = data;
    if (!onlineMap.has(userHash)) {
      socket.emit("find", { success: false, message: "No such user online." });
      return;
    }

    const userKey = onlineMap.get(userHash).publicKey;
    socket.emit("find", {
      success: true,
      publicKey: userKey,
      message: "User found.",
    });
  });

  // 发送消息给好友
  socket.on("send", (data) => {
    if (!socket.publicKey || !onlineMap.has(socket.hash)) {
      socket.emit("send", { success: false, message: "Log in first." });
      return;
    }

    const { receiverHash, message } = data;
    const senderHash = socket.hash;
    if (!onlineMap.has(receiverHash)) {
      socket.emit("send", { success: false, message: "No such user online." });
      return;
    }
    const receiver = onlineMap.get(receiverHash);
    receiver.emit("receive", { sender: senderHash, message: message });
    socket.emit("send", { success: true, message: "Message send." });
  });

  // 断开连接
  socket.on("disconnect", () => {
    console.log("A client disconnected.");
    if (socket.hash) {
      // remove login status
      onlineMap.delete(socket.hash);
    }
  });
});

server.listen(3000, () => {
  console.log("WS Server listening on port 3000.");
});

setInterval(() => {
  let online = [];
  for (let key of onlineMap.keys()) {
    online.push(key.slice(0, 5));
  }
  console.log("online: ", online);

  let challenging = [];
  for (let key of challengeMap.keys()) {
    challenging.push(key.split("\n")[2].slice(0, 5));
  }
  console.log("challenging: ", challenging);
}, 10000);
