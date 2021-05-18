
var Pack = {

  unpack : function(privkey, data) {
    // we expect the pack to contain two entries, k and d.
    // k is the key encrypted by the client session
    // d is the actual data encrypted by the 'k' key.

    // now we decrypt the key with our saved private key.
    var decrypt = new JSEncrypt();
    decrypt.setPrivateKey(privkey);
    var password = decrypt.decrypt(data.k);

    var encryptedWA = CryptoJS.enc.Base64.parse(data.d);
    var prefixWA = CryptoJS.lib.WordArray.create(encryptedWA.words.slice(0, 8/4));                             // Salted__ prefix
    var saltWA = CryptoJS.lib.WordArray.create(encryptedWA.words.slice(8/4, 16/4));                            // 8 bytes salt: 0x0123456789ABCDEF
    var ciphertextWA = CryptoJS.lib.WordArray.create(encryptedWA.words.slice(16/4, encryptedWA.words.length)); // ciphertext

    var keyIvWA = CryptoJS.PBKDF2( password, saltWA, { keySize: (32+16)/4, iterations: 10000, hasher: CryptoJS.algo.SHA256 } );
    var keyWA = CryptoJS.lib.WordArray.create(keyIvWA.words.slice(0, 32/4));
    var ivWA = CryptoJS.lib.WordArray.create(keyIvWA.words.slice(32/4, (32+16)/4));
    var decryptedWA = CryptoJS.AES.decrypt( {ciphertext: ciphertextWA}, keyWA, {iv: ivWA} );

    return JSON.parse(decryptedWA.toString(CryptoJS.enc.Utf8));
  }

}
