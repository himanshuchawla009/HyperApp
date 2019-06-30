const elliptic = require('elliptic').ec;
const EC = new elliptic('secp256k1');

var path = require('path');
const KeyEncoder = require('key-encoder');
const crypto = require('crypto');
const sha256 = require('sha256');
const sha3 = require('sha3');
const md5 = require('md5');
const base64 = require('base-64');
const ECKey = require('ec-key');
const JsCryptoKeyUtils = require('js-crypto-key-utils');
const pki = require('node-forge').pki
var fs = require('fs');

var sys = require('sys')
var spawn = require('child_process').spawn;
var shell = require("shelljs");
async function getPrivatekeyAsPem(key) {
  console.log("converting private key to pem")
  const encoder = new KeyEncoder('secp256k1');
  console.log("encoded loaded", key)
  const privateKeyHex = key.priv.toString(16);
  console.log("private key hex", privateKeyHex);
  const pem = encoder.encodePrivate(privateKeyHex, 'raw', 'pem');
  console.log("encoded private key", pem);
  const convertPem = await convertPrivateKeyPkcs8(pem);
  console.log("converted key", convertPem)
  return convertPem;
}

function getPublickeyAsPem(key) {
  try {
    console.log("converting public to pem")
    const encoder = new KeyEncoder('secp256k1');
    console.log("encoder loaded")
    const rawPublicKey = key.getPublic('hex');
    console.log("raw public key", rawPublicKey)
    let encoded = encoder.encodePublic(rawPublicKey, 'raw', 'pem');
    console.log(encoded, "encoded");
    return encoded
  } catch (error) {
    throw error;
  }
}

function getPrivateKeyAsCrypto(privkeyPemString, pin) {

  const hash = new sha3.SHA3(256);
  hash.update(pin);


  const sha3Pin = hash.digest('hex');
  const key = md5(sha3Pin);
  const iv = sha3Pin.slice(0, 16);

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let result = cipher.update(privkeyPemString, 'utf8', 'base64');
  result += cipher.final('base64');

  return result;
}

function getCryptoAsPrivateKey(key_cipher, pin) {
  const hash = new sha3.SHA3(256);
  hash.update(pin);

  const sha3Pin = hash.digest('hex');
  const key = md5(sha3Pin);
  const iv = sha3Pin.slice(0, 16);

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let result = decipher.update(key_cipher, 'base64', 'utf8');
  result += decipher.final('utf8');

  try {
    return convertPrivateKeyPkcs8(result);
  } catch (e) {
    return result;
  }


}

function getWallet(key) {
  const pubPem = getPublickeyAsPem(key);
  console.log("public pem", pubPem)
  const pubKey = new ECKey(pubPem, 'pem');
  const merged = Buffer.concat([pubKey.x, pubKey.y]);
  return sha256(merged);
}


function genKey() {
  let key = EC.genKeyPair();
  key.getPublic()

  return key;
}

function makeTransaction(key, amount, toaddr) {
  const wallet = getWallet(key);
  const nonce = new Date().getTime().toString() + Math.floor(Math.random() * 10000000000).toString();
  let rq = {
    action: 'Transaction',
    from: wallet,
    to: toaddr,
    amount: amount.toString(),
    pubkey: getPublickeyAsPem(key),
    nonce,
  };
  
  console.log(rq,"wallet request")
  rq = JSON.stringify(rq);
  const rq64 = base64.encode(rq);
  const signed = key.sign(sha256(rq64)).toDER('hex');
  return `${rq64}.ELAMA.${signed}`;
}

function createAccount(key, delimiter) {
  const wallet = getWallet(key);
  const nonce = new Date().getTime().toString() + Math.floor(Math.random() * 10000000000).toString();
  let rq = {
    action: 'CreateAccount',
    from: wallet,
    to: wallet,
    amount: '0',
    pubkey: getPublickeyAsPem(key),
    nonce,
  };
  rq = JSON.stringify(rq);
  const rq64 = base64.encode(rq);
  // console.log(key.sign(sha256(rq64)))
  const signed = key.sign(sha256(rq64)).toDER('hex');
  // return rq64 + ".IAMCOIN." + signed
  return rq64 + delimiter + signed;
}

function getKeyFromPrivatePem(pem_str) {
  const pk = new ECKey(pem_str, 'pem');
  console.log("pri k", pk.d)
  return EC.keyFromPrivate(pk.d, 'hex');
}



 function createMintAccountTx() {

  try {
    let  { stdout, stderr, code }  =shell.exec(`shopt -s expand_aliases; create`,
      { shell: '/bin/bash',silent:true });

      console.log(stdout)
      return stdout

  } catch (error) {
    console.log(error)
  }

}

 function exchangeTx(amount, address) {

  try {
    let  { stdout, stderr, code }  = shell.exec(`shopt -s expand_aliases; exchange ${amount} ${address}`,
      { shell: '/bin/bash'});
      console.log(stdout)
      return stdout
  } catch (error) {

    console.log(error)
  }

}

 function mintTx(amount) {

  try {
    let  { stdout, stderr, code } =shell.exec(`shopt -s expand_aliases; mint ${amount}`,
      { shell: '/bin/bash' });
      console.log(stdout)
      return stdout
  } catch (error) {
    console.log(error)
  }

}


function getAdminKeyFromPrivatePem(pem) {

  privateKey = pki.privateKeyFromPem(pem)
  console.log(privateKey, "private key")
}
const convertPrivateKeyPkcs8 = async (privateKeyPemString) => {
  const privateKey = new ECKey(privateKeyPemString, 'pem');
  let jwk = JSON.stringify(privateKey, null, 2);
  jwk = JSON.parse(jwk);
  const convertKey = await new JsCryptoKeyUtils.Key('jwk', jwk).export('pem');
  return convertKey;
};

createMintAccountTx();



module.exports.getPrivatekeyAsPem = getPrivatekeyAsPem;
module.exports.getPublickeyAsPem = getPublickeyAsPem;
module.exports.getWallet = getWallet;
module.exports.genKey = genKey;
module.exports.makeTransaction = makeTransaction;
module.exports.createAccount = createAccount;
module.exports.getKeyFromPrivatePem = getKeyFromPrivatePem;
module.exports.getPrivateKeyAsCrypto = getPrivateKeyAsCrypto;
module.exports.getCryptoAsPrivateKey = getCryptoAsPrivateKey;
module.exports.convertPrivateKeyPkcs8 = convertPrivateKeyPkcs8;
module.exports.getAdminKeyFromPrivatePem = getAdminKeyFromPrivatePem;

module.exports.createMintAccountTx = createMintAccountTx;
module.exports.mintTx= mintTx;
module.exports.exchangeTx= exchangeTx;