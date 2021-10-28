// events management

// NOTE: events should remain seperate from the interface, however it will trigger actions in the interface..  Event handling should not need to look for any data in the interface or DOM, it should be provided directory, or in sessionStorage  (although there will be cases during development where the info will be ontained from the DOM, but this should ultimately be seperated.).



var Events = {
	Init: function() {

		Dashboard.Init();

		if ("uid" in localStorage && "privkey" in localStorage && "auth" in localStorage) {

			// we have the auth and the privkey... so the user wants to automatically login (or they refreshed the page).
			Dashboard.Action.Login({
				'uid':     localStorage["uid"],
				'privkey': localStorage["privkey"],
				'auth':    localStorage["auth"]
			});
		}
		else {
			// if we do not have the privkey, we will definately need the user to login (or create an account).
			Dashboard.Action.ShowLogin();
		}

		// TODO: Setup timer to check the User Messages
		// TODO: Setup timers to check the messages for the Organisations.



	},
	Signup: function(indata) {

		console.assert(indata.email);
		console.assert(indata.pass);

					// The username and password entered by the user, will be hashed to generate a large string (Account-Guard).
					var auth = CryptoJS.SHA256(indata.email + indata.pass).toString();
					console.assert(auth.length > 0);
					console.log("long-passphrase: ", auth);

					// A private/public key pair for the user (and the default ORG) is generated.
					var crypt = new JSEncrypt({default_key_size: 2048});
					crypt.getKey();

					// A copy of the private key will be protected by that large string (auth).
					var id = CryptoJS.SHA256(indata.email).toString();
					var privkey  = crypt.getPrivateKey();
					var pubkey   = crypt.getPublicKey();
					var encprivkey = Crypt.encrypt(privkey,auth);
					var guard = CryptoJS.SHA256(encprivkey).toString();
					var guard_hash = CryptoJS.SHA256(guard + auth).toString();

					var org = Orgs.newOrgPack({ name: indata.email, key: privkey });
					console.assert(org.orgpack.s);

					// generate an account-guard (just a hash of the encrypted private key), and include a newly formed OrgPack.
					var sdata = {
						'id': id,
						'g': guard,
						'gh': guard_hash,
						'pr': encprivkey,
						'pub': Base64.encode(pubkey),
						'oid': org.orgid,
						'oh': org.orgpack.h,
						'ok': org.orgpack.k,
						'od': org.orgpack.d,
						'os': org.orgpack.s
					};


					$.ajax({
						url: '/api/1/newaccount',
						dataType: 'json',
						type: 'post',
						contentType: 'application/x-www-form-urlencoded',
						data: sdata,
						success: function( data, textStatus, jQxhr ){

							if (data.success) {
								console.log("New Account Request done");

								sessionStorage.setItem("authkey", auth);

								var orgs = {};
								orgs[org.orgid] = org.org;

								sessionStorage.setItem("orgs", JSON.stringify(orgs))

								sessionStorage.setItem("privkey", encprivkey);
								sessionStorage.setItem("mainorgid", org.orgid);

								// if the user selected to rememebr the login, then we also store the auth-hash in localstorage
								if ($("#login-remember2").is(':checked')) {
									localStorage.setItem("auth", auth);
								}


								// TODO: need to add this organisation to the dashboard, and then switch to it.
								Dashboard.Action.AddOrg(org.org);

								Dashboard.Action.ShowDashboard({
									'privkey': encprivkey,
									'auth':    auth
								})
							}
							else {
								console.log("Failed to create account");
								alert("failed to create the account");
							}

							$(".loader").hide();
						},
						error: function( jqXhr, textStatus, errorThrown ){
							console.log("FAILED to establish secure session!");
							console.log( errorThrown );
						}
					});

	},
	Signin: function(indata) {

		console.assert(indata.email);
		console.assert(indata.pass);

		var auth = CryptoJS.SHA256(indata.email + indata.pass).toString();
		console.assert(auth.length > 0);
		console.log("long-passphrase: ", auth);

		var id = CryptoJS.SHA256(indata.email).toString();

		// Now that we have our auth, and our ID, we need to attempt the first phase of the login.

		// if we already have the privkey, then we just need to validate it.
		if ("privkey" in localStorage) {
			// NOTE that privkey should be protected by the auth.
			// we already have the privkey in localStorage, so we just need to validate it.
		}


		var sdata = { 'id': id };

		$.ajax({
			url: '/api/1/login',
			dataType: 'json',
			type: 'post',
			contentType: 'application/x-www-form-urlencoded',
			data: sdata,
			success: function( data, textStatus, jQxhr ){

				if (data.success) {
					console.log("Login - phase 1 ok");

					var sdata2 = {
						id: sdata.id,
						gh: CryptoJS.SHA256(data.g + auth).toString()
					}

					$.ajax({
						url: '/api/1/login',
						dataType: 'json',
						type: 'post',
						contentType: 'application/x-www-form-urlencoded',
						data: sdata2,
						success: function( data2, textStatus2, jQxhr2 ){

							if (data2.success) {
								console.log("Login - phase 2 ok");

								var privkey = Crypt.decryptString(data2.rec, auth);
// 									console.log("privkey: ", privkey);

// 									var crypt = new JSEncrypt({default_key_size: 2048});
// 									crypt.setPrivateKey(privkey);

								var orgpack = Pack.unpack(privkey, data2.orgpack);

								localStorage.setItem("privkey", data2.rec);
								localStorage.setItem("mainorgid", orgpack.orgid);

								// if the user selected to rememebr the login, then we also store the auth-hash in localstorage
								if ($("#login-remember").is(':checked')) {
									localStorage.setItem("auth", auth);
								}


								// testing.
								document.location.hash = 'lookAtMeNow';



								Dashboard.Action.AddOrg(orgpack);
								Dashboard.Action.ShowDashboard({
									'uid':     id,
									'privkey': data2.rec,
									'auth':    auth
								})
							}
							else {
								console.log("Failed to login");
								alert("failed to login");
							}

							$(".loader").hide();
						},
						error: function( jqXhr, textStatus, errorThrown ){
							console.log("FAILED to establish secure session!");
							console.log( errorThrown );
							alert("Login attempt failed... please try again.")
							$('#frm-signin')[0].pass.value = '';
							$('#frm-signin')[0].email.select();
							$(".loader").hide();
						}
					});
				}
				else {
					alert("Login attempt failed... please try again.")
					$('#frm-signin')[0].pass.value = '';
					$('#frm-signin')[0].email.select();
					$(".loader").hide();
				}
			},
			error: function( jqXhr, textStatus, errorThrown ){
				console.log("FAILED to establish secure session!");
				console.log( errorThrown );
			}
		});

	}
};

$(document).ready(function() {
	console.log("EVENTS READY");

	Events.Init();
});


console.log("Events module loaded");
