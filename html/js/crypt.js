// Reference: https://embed.plnkr.co/0VPU1zmmWC5wmTKPKnhg/
// Requires:
//   CryptoJS

var Crypt = {

	encrypt: function(msg, pass) {
		var salt = CryptoJS.lib.WordArray.random(128/8);
		var key = CryptoJS.PBKDF2(pass, salt, { keySize: 256/32, iterations: 100 });
		var iv = CryptoJS.lib.WordArray.random(128/8);

		var encrypted = CryptoJS.AES.encrypt(msg, key, {
			iv: iv,
			padding: CryptoJS.pad.Pkcs7,
			mode: CryptoJS.mode.CBC
		});

		// salt, iv will be hex 32 in length
		// append them to the ciphertext for use  in decryption
		var transitmessage = salt.toString()+ iv.toString() + encrypted.toString();
		return transitmessage;
	},

	decrypt: function(transitmessage, pass) {
		var salt = CryptoJS.enc.Hex.parse(transitmessage.substr(0, 32));
		var iv = CryptoJS.enc.Hex.parse(transitmessage.substr(32, 32))
		var encrypted = transitmessage.substring(64);
		var key = CryptoJS.PBKDF2(pass, salt, { keySize: 256/32, iterations: 100 });

		var decrypted = CryptoJS.AES.decrypt(encrypted, key, {
			iv: iv,
			padding: CryptoJS.pad.Pkcs7,
			mode: CryptoJS.mode.CBC
		});
		return decrypted;
	},
	decryptString: function(transitmessage, pass) {
		return Crypt.decrypt(transitmessage, pass).toString(CryptoJS.enc.Utf8);
	},
	decryptJSON: function(transitmessage, pass) {
		return JSON.parse(Crypt.decryptString(transitmessage, pass));
	}

};
