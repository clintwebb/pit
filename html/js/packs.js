
var Pack = {

	randpass : function() {
		var array = new Uint32Array(4);
		window.crypto.getRandomValues(array);
		var va = array[0].toString(16) +
			array[1].toString(16) +
			array[2].toString(16) +
			array[3].toString(16);
		return va;
	},

	pack: function(privkey, data) {
		// generate the pack information.
		console.assert(privkey);
		console.assert(data);

		// generate a random string aes-key
		var pkey = this.randpass();
		console.assert(pkey);
		var payload_ready = CryptoJS.AES.encrypt(data, pkey).toString();

		var encrypt = new JSEncrypt();
		encrypt.setPrivateKey(privkey);
		console.assert(payload_ready);
		console.assert(pkey);

		var digest = function(data){ return data; };
		var ps = encrypt.sign(Base64.decode(payload_ready), digest);
		console.assert(ps);

		return {
			h: CryptoJS.SHA256(data).toString(),
			k: encrypt.encrypt(pkey),
			d: payload_ready,
			s: ps
		};
	},

	unpack : function(privkey, data) {
    // we expect the pack to contain two entries, k and d.
    // k is the key encrypted by the client session
    // d is the actual data encrypted by the 'k' key.


// var ciphertext = CryptoJS.AES.encrypt('my message', 'secret key 123');

// Decrypt
// var bytes  = CryptoJS.AES.decrypt(ciphertext.toString(), 'secret key 123');
// var plaintext = bytes.toString(CryptoJS.enc.Utf8);
//
// console.log(plaintext);

		console.assert(privkey);
		console.assert(data.k);
		console.assert(data.d);
		console.assert(data.h);

		// now we decrypt the key with our saved private key.
		var decrypt = new JSEncrypt();
		decrypt.setPrivateKey(privkey);
		const password = decrypt.decrypt(data.k);
		const edata = CryptoJS.AES.decrypt( data.d, password);
		const rawpack = edata.toString(CryptoJS.enc.Utf8);
		const packid = CryptoJS.SHA256(rawpack).toString();
		console.assert(packid == data.h);

		return { pack: JSON.parse(rawpack), packid: packid };
	}



//	var payload_output = '';
//	for (const [key, value] of Object.entries(sdata.payload)) {
//		var bb=Base64.encode(value.toString());
//		payload_output += key + "," + bb + "\n";
//	}



}

console.log("Packs module loaded");
