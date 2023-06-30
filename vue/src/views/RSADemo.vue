<script setup lang="ts">
import { ref } from 'vue';

const publicKey = ref(new ArrayBuffer(0));
const privateKey = ref(new ArrayBuffer(0));
const encryptedData = ref(new ArrayBuffer(0));
const decryptedData = ref('');

async function generateKeys() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  publicKey.value = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
  privateKey.value = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  console.log('Public Key:', publicKey.value);
  console.log('Private Key:', privateKey.value);
}

async function encryptData() {
  const data = 'Hello, World!';
  const importedPublicKey = await window.crypto.subtle.importKey(
    'spki',
    publicKey.value,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['encrypt']
  );

  const encodedData = new TextEncoder().encode(data);
  const encryptedDataValue = await window.crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    importedPublicKey,
    encodedData
  );

  encryptedData.value = encryptedDataValue;
  console.log('Encrypted Data:', encryptedData.value);
}

async function decryptData() {
  const importedPrivateKey = await window.crypto.subtle.importKey(
    'pkcs8',
    privateKey.value,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['decrypt']
  );

  const decryptedDataValue = await window.crypto.subtle.decrypt(
    {
      name: 'RSA-OAEP',
    },
    importedPrivateKey,
    encryptedData.value
  );

  const decodedData = new TextDecoder().decode(decryptedDataValue);
  decryptedData.value = decodedData;
  console.log('Decrypted Data:', decryptedData.value);
}
</script>

<template>
  <div class="flex gap-4">
    <button @click="generateKeys">Generate Keys</button>
    <button @click="encryptData">Encrypt Data</button>
    <button @click="decryptData">Decrypt Data</button>
  </div>
</template>

