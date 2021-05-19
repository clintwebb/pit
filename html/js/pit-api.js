
// this is a group of functions that manage the session.  It is not an instance that tracks a session as an object, but interacts with the information in the sessionStorage and localStorage to keep track of the active session, and utilise it.

var Session = {

    // this function is intended to be used to trigger a session establishment prior to actually needing it (but knowing that will be needed very soon).
    // an example of this.
    //      Session.check() - kick off a new session if one isn't already there.
    //      generate some data that will needed (including all the encryption and such)
    //      var pack = Session.send(request) - use the session to send the request, and return a pack of data.
    // performing this check is not mandatory... as a valid session will be established when sending the request if one
    // isn't already established.  However, it allows that activty to occur in the background while generating the request.
    // This should allow for better response time for the User.
    check : function() {
        // check if session data is valid in sessionStorage
        var session = JSON.parse(sessionStorage.getItem('session'));
        if (! session) {
            Session.connect();
        }
        else {
            if ( session.expires < Math.round(Date.now() / 1000)) {
                console.log("Session has expired.  Requesting new session.");
                sessionStorage.removeItem('session');
                Session.connect();
            }
            else {
                console.log("Session is still valid");
				return true;
            }
        }
		return false;
    },


    connect : function() {

        // when trying to establish a session, we will wait 30 seconds if a session is already being attempted.
        var session_connecting = parseInt(sessionStorage.getItem('session_connecting'));
        if ( session_connecting == null ) {
            return false;
        }
        else {
            var now = Math.round(Date.now()/1000);
            var expire = session_connecting + 30;
            if (expire > now) {
                console.log("Session connection already in progress...");
                return false;
            }
        }


        console.log("Session connecting.");
        sessionStorage.setItem('session_connecting', Math.round(Date.now()/1000));

        // generate a new private/public keypair.
        var crypt = new JSEncrypt({default_key_size: 2048});
        crypt.getKey();

        var privkey  = crypt.getPrivateKey();
        var pubkey  =  crypt.getPublicKey();

        // send the public key to the server
        var sdata = { 'puk': Base64.encode(pubkey), 'aaa': Base64.encode("hello1") };

        $.ajax({
            url: '/api/1/session',
            dataType: 'json',
            type: 'post',
            contentType: 'application/x-www-form-urlencoded',
            data: sdata,
            success: function( data, textStatus, jQxhr ){

                var pack = Pack.unpack(privkey, data);
                if ( pack.success ) {
                    console.log("SUCCESS!! - Secure session established.");

                    // get the session ID, and the key, and store it.
                    var session = {
                        'sid': pack.sid,
                        'server': Base64.decode(pack.public),
                        'client': privkey,
                        'timeout' : pack.timeout,
                        'expires' : Math.round(Date.now() / 1000) + pack.timeout
                    };
                    sessionStorage.setItem("session", JSON.stringify(session));
                }
                else {
                    console.log("FAILED to establish secure session!");
                }
                sessionStorage.removeItem('session_connecting');

            },
            error: function( jqXhr, textStatus, errorThrown ){
                console.log("FAILED to establish secure session!");
                console.log( errorThrown );
                sessionStorage.remoteItem('session_connecting');
            }
        });
    },

    randpass : function() {
        var array = new Uint32Array(4);
        window.crypto.getRandomValues(array);
        var va = array[0].toString(16) +
                 array[1].toString(16) +
                 array[2].toString(16) +
                 array[3].toString(16);
        return va;
    },


    send : function(sdata) {

        // for easier parsing of the data, we will send data in a similar format to a form submission, but a little bit different.
        //   key,base64-value
        // that way we can use grep and awk to strip out the key,value easily

        var payload_output = '';

        for (const [key, value] of Object.entries(sdata.payload)) {
            var bb=Base64.encode(value.toString());
            payload_output += key + "," + bb + "\n";
        }

        // generate a random string aes-key
		sdata.skey = Session.randpass();
        console.log("payload: ", sdata.payload);
        console.log("skey: ", sdata.skey);
		sdata.payload_ready= CryptoJS.AES.encrypt(payload_output, sdata.skey).toString();
        console.log("payload: ", sdata.payload_ready);

		Session.__send(sdata);
    },

	__send : function(sdata) {

		console.assert(sdata);
		console.assert(sdata.payload_ready);

		// check if we have a valid session, if we dont, then set a timer to activate this function again.
		if (Session.check() == false) {
			// an existing session isn't established yet, so we need to wait.  We will activate a timer, to re-run this function.
			console.log("Session Pending. Waiting...")
			setTimeout(function() {
				Session.__send(sdata);
			}, 50);

			return false;
		}


		// if everything is good, then make the request.
		var active_session = JSON.parse(sessionStorage.getItem("session"));
		console.assert(active_session);

        console.log("session-server-public: ", active_session.server)

        // use the session session-server-public key to encrypt the aes-key.
        var encrypt = new JSEncrypt();
		console.assert(active_session.server);
		encrypt.setPrivateKey(active_session.server);
		console.assert(sdata.skey)
        var password = encrypt.encrypt(sdata.skey);
		console.assert(password);
        console.log("encrypted pass: ", password);


		console.assert(active_session.client);
		console.assert(sdata.payload_ready);
		var sign = new JSEncrypt();
		sign.setPrivateKey(active_session.client);
		var signature = sign.sign(sdata.payload_ready, CryptoJS.SHA256, "sha256");

		console.assert(active_session.sid);
		console.assert(sdata.payload_ready);
        console.log("PS:", signature);
		var indata = { 'sid': active_session.sid, 'pk': password, 'pd': sdata.payload_ready, 'ps': signature }


		console.assert(sdata.target);
        $.ajax({
            url: sdata.target,
            dataType: 'json',
            type: 'post',
            contentType: 'application/x-www-form-urlencoded',
            data: indata,
            success: function( data, textStatus, jQxhr ){

//                 var pack = Pack.unpack(privkey, data);
//                 if ( pack.success ) {
//                     console.log("SUCCESS!! - New Account Created.");
//
//
// 					console.log("TODO - Need to store the user and org details in the localStorage.")
//
// 					console.log("Session Expiry Updated");
// 					var session = JSON.parse(sessionStorage.getItem("session"));
// 					console.assert(session);
// 					assert(session.timeout > 0);
// 					session.expires = Math.round(Date.now() / 1000) + session.timeout;
//                     sessionStorage.setItem("session", JSON.stringify(session));
//
//
//
//                 }
//                 else {
                    console.log("FAILED to establish secure session!");

					        sdata.failure("done");


//                 }
            },
            error: function( jqXhr, textStatus, errorThrown ){
                console.log("FAILED to establish secure session!");
                console.log( errorThrown );
            }
        });


	}

}
