const crypto = require("crypto");

// 生成密钥对
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048, // 密钥长度
  publicKeyEncoding: {
    type: "spki", // 公钥格式
    format: "pem", // 输出格式
  },
  privateKeyEncoding: {
    type: "pkcs8", // 私钥格式
    format: "pem", // 输出格式
  },
});
// 原始数据
const plaintext = "Hello, world!";

// 加密
const encrypted = crypto.publicEncrypt(
  publicKey,
  Buffer.from(plaintext, "utf8")
);

// 将加密后的数据转换为 Base64 编码
const encryptedBase64 = encrypted.toString("base64");

console.log("加密后的数据（Base64 编码）:");
console.log(encryptedBase64);

// 将 Base64 编码的数据解码为原始的加密数据
const encryptedBuffer = Buffer.from(encryptedBase64, "base64");

// 解密
const decrypted = crypto.privateDecrypt(privateKey, encryptedBuffer);

console.log("解密后的数据:");
console.log(decrypted.toString("utf8"));
