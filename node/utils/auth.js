const crypto = require("crypto");

// random string
function generateRandomString(length) {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
}

exports.getChallengePair = (publicKey) => {
  const data = generateRandomString(128);
  const cryptoKey = crypto.createPublicKey(publicKey);
  const encrypted = crypto.publicEncrypt(
    {
      key: cryptoKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(data, "utf8")
  );
  const encryptedBase64 = encrypted.toString("base64");

  return {
    question: encryptedBase64,
    answer: data,
  };
};
