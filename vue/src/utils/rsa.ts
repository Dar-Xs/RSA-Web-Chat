export async function generateRSAKeyPairToPEM(): Promise<{
  publicKey: string
  privateKey: string
}> {
  // 定义生成密钥对的参数
  const algorithm: RsaHashedKeyGenParams = {
    name: 'RSA-OAEP',
    modulusLength: 4096,
    publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // 公钥指数为65537
    hash: { name: 'SHA-256' }
  }

  // 生成密钥对
  const keyPair = await window.crypto.subtle.generateKey(
    algorithm,
    true, // 是否可导出私钥
    ['encrypt', 'decrypt'] // 密钥用途
  )

  // 将公钥导出为 SPKI 格式
  const publicKey = await window.crypto.subtle.exportKey('spki', keyPair.publicKey)

  // 将私钥导出为 PKCS#8 格式
  const privateKey = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey)

  // 将导出的公钥和私钥转换为 PEM 格式的字符串
  const pemPublicKey = convertBinaryToPEM(publicKey, 'PUBLIC KEY')
  const pemPrivateKey = convertBinaryToPEM(privateKey, 'PRIVATE KEY')

  // 返回 PEM 格式的公钥和私钥字符串
  return { publicKey: pemPublicKey, privateKey: pemPrivateKey }
}

// 辅助函数：将二进制数据转换为 PEM 格式的字符串
function convertBinaryToPEM(binaryData: ArrayBuffer, label: string): string {
  const base64Data = btoa(String.fromCharCode(...new Uint8Array(binaryData)))
  let pemString = `-----BEGIN ${label}-----\n`

  const matches = base64Data ? base64Data.match(/.{1,64}/g) : null
  pemString += matches ? matches.join('\n') : ''

  pemString += `\n-----END ${label}-----\n`
  return pemString
}

export async function importPrivateKey(pemKey: string): Promise<CryptoKey> {
  // 删除 PEM 密钥的头部和尾部，并将其转换为 ArrayBuffer
  const pemKeyWithoutHeaders = pemKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')
  const pemKeyBuffer = Uint8Array.from(atob(pemKeyWithoutHeaders), (c) => c.charCodeAt(0)).buffer

  // 将 PEM 密钥转换为 CryptoKey 对象
  const key = await window.crypto.subtle.importKey(
    'pkcs8',
    pemKeyBuffer,
    { name: 'RSA-OAEP', hash: { name: 'SHA-256' } },
    false,
    ['decrypt']
  )

  return key
}
export async function importPublicKey(pemKey: string): Promise<CryptoKey> {
  // 删除 PEM 密钥的头部和尾部，并将其转换为 ArrayBuffer
  const pemKeyWithoutHeaders = pemKey
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s/g, '')
  const pemKeyBuffer = Uint8Array.from(atob(pemKeyWithoutHeaders), (c) => c.charCodeAt(0)).buffer

  // 将 PEM 密钥转换为 CryptoKey 对象
  const key = await window.crypto.subtle.importKey(
    'spki',
    pemKeyBuffer,
    { name: 'RSA-OAEP', hash: { name: 'SHA-256' } },
    true,
    ['encrypt']
  )

  return key
}

// 明文:string        -转换> ArrayBuffer      -加密> 密文:ArrayBuffer -编码> 即将传输base64:string
// 收到base64:string  -解码> 密文:ArrayBuffer  -解密> ArrayBuffer     -转换>明文:string

// base64编码
function base64Encode(data: ArrayBuffer): string {
  const uint8Array = new Uint8Array(data)
  const base64String = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)))
  return base64String
}
// base64解码
function base64Decode(base64String: string): ArrayBuffer {
  const binaryString = atob(base64String)
  const length = binaryString.length
  const uint8Array = new Uint8Array(length)

  for (let i = 0; i < length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i)
  }
  return uint8Array.buffer
}
// string -> ArrayBuffer
function string2ArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder()
  return encoder.encode(str).buffer
}
// ArrayBuffer -> string
function ArrayBuffer2string(arrayBuffer: ArrayBuffer): string {
  const decoder = new TextDecoder()
  return decoder.decode(arrayBuffer)
}

// 加密 string 为 base64 string
export async function encryptStringRSA(publicKey: CryptoKey, data: string): Promise<string> {
  const stringBuffer = string2ArrayBuffer(data)
  const encryptedBuffer = await encryptRSA(publicKey, stringBuffer)
  const encryptedString = base64Encode(encryptedBuffer)
  return encryptedString
}

// 解密 base64 string 为 string
export async function decryptStringRSA(
  privateKey: CryptoKey,
  encryptedData: string
): Promise<string> {
  const encryptedBuffer = base64Decode(encryptedData)
  const decryptedBuffer = await decryptRSA(privateKey, encryptedBuffer)
  const decryptedString = ArrayBuffer2string(decryptedBuffer)
  return decryptedString
}

// ArrayBuffer 加密
async function encryptRSA(cryptoKey: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> {
  let blockSize: number
  if (cryptoKey.algorithm.name === 'RSA-OAEP') {
    const rsaKeyGenParams = cryptoKey.algorithm as RsaKeyGenParams
    blockSize = Math.floor(rsaKeyGenParams.modulusLength / 8 - 100)
  } else {
    throw new Error('Unsupported key algorithm')
  }
  const blocks = Math.ceil(data.byteLength / blockSize)
  const encryptedBlocks: ArrayBuffer[] = []

  for (let i = 0; i < blocks; i++) {
    const blockStart = i * blockSize
    const blockEnd = Math.min(blockStart + blockSize, data.byteLength)
    const block = data.slice(blockStart, blockEnd)

    const encryptedBlock = await window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      cryptoKey,
      block
    )

    encryptedBlocks.push(encryptedBlock)
  }

  return concatenateArrayBuffers(encryptedBlocks)
}
// ArrayBuffer 解密
async function decryptRSA(cryptoKey: CryptoKey, encryptedData: ArrayBuffer): Promise<ArrayBuffer> {
  let blockSize: number
  if (cryptoKey.algorithm.name === 'RSA-OAEP') {
    const rsaKeyGenParams = cryptoKey.algorithm as RsaKeyGenParams
    blockSize = Math.floor(rsaKeyGenParams.modulusLength / 8)
  } else {
    throw new Error('Unsupported key algorithm')
  }
  const blocks = Math.ceil(encryptedData.byteLength / blockSize)
  const decryptedBlocks: ArrayBuffer[] = []
  
  for (let i = 0; i < blocks; i++) {
    const blockStart = i * blockSize
    const blockEnd = Math.min(blockStart + blockSize, encryptedData.byteLength)
    const block = encryptedData.slice(blockStart, blockEnd)

    const decryptedBlock = await window.crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      cryptoKey,
      block
    )

    decryptedBlocks.push(decryptedBlock)
  }

  return concatenateArrayBuffers(decryptedBlocks)
}

// 数据连接
function concatenateArrayBuffers(arrayBuffers: ArrayBuffer[]): ArrayBuffer {
  const totalLength = arrayBuffers.reduce((length, buffer) => length + buffer.byteLength, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0

  for (const buffer of arrayBuffers) {
    result.set(new Uint8Array(buffer), offset)
    offset += buffer.byteLength
  }

  return result.buffer
}
