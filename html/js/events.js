/*
 * Events Management
 *
 * Events can be thought of as functionality that is triggered by either a timed event (something running in the background), or a user interaction.
 * Events is where the processing is done.  In order to avoid making things complicated, it is good practice to keep the logic seperate from the user interface.
 * The user triggers things to be done in the dashboard, which then often results in some action being done to the interface.
 *
 * Events in this case should not be confused with Routing in general, as it is not particular about appliation state, but for keeping the functionality logic seperate from the interface logic.
 * It subsequently does need to maintain application state, and it does that with sessionStorage.
 *
 * NOTE: events should remain seperate from the interface, however it will often trigger actions in the interface..
 *       Event handling should not need to look for any data in the interface or DOM, it should be provided directly, or in sessionStorage
 *       (although there will be cases during development where the info will be ontained from the DOM, but this should ultimately be seperated.).
 *
 */





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


		console.log("EVENTS Initialized");
	},
	Signup: function(indata) {

		console.assert(indata.email);
		console.assert(indata.pass);

					// The username and password entered by the user, will be hashed to generate a large string (Account-Guard).
					var auth = CryptoJS.SHA256(indata.email + indata.pass).toString();
					console.assert(auth.length > 0);
// 					console.log("long-passphrase: ", auth);

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

					var org = Orgs.newOrgPack({
						settings: {  name: indata.email },
						key: privkey
					});
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
// 					console.log("Login - phase 1 ok");

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
// 								console.log("Login - phase 2 ok");

								var privkey = Crypt.decryptString(data2.rec, auth);
// 									console.log("privkey: ", privkey);

								var orgpack = Pack.unpack(privkey, data2.orgpack);

								Events.ProcessMainOrg({ orgpack: orgpack, privkey: data2.rec, auth: auth });
								Dashboard.Action.ShowDashboard();
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

	},
	ProcessMainOrg: function(ndata) {

		console.assert(ndata);
		console.assert(ndata.orgpack);
		console.assert(ndata.orgpack.packid);
		console.assert(ndata.orgpack.pack);
		console.assert(ndata.privkey);
		console.assert(ndata.auth);
		console.assert(ndata.orgpack.pack.orgid);

		var orgs = {};
		var packs = {};

		sessionStorage.setItem("privkey", ndata.privkey);
		sessionStorage.setItem("auth", ndata.auth);
		sessionStorage.setItem("mainorg", ndata.orgpack.pack.orgid);


		orgs[ndata.orgpack.pack.orgid] = ndata.orgpack.packid;
		sessionStorage.setItem("orgs", JSON.stringify(orgs));

		packs[ndata.orgpack.packid] = ndata.orgpack.pack;
		sessionStorage.setItem("packs", JSON.stringify(packs));

		// if the user selected to rememebr the login, then we also store the auth-hash in localstorage
		if ($("#login-remember").is(':checked')) {
			localStorage.setItem("auth", ndata.auth);
		}

		// save the current org (which is currently the mainorg, but in other states, will be a different org, but will still need a seperate reference to the main one).
		sessionStorage.setItem('currorg', ndata.orgpack.pack.orgid);

		// TODO: for the document hash, we can use internal things so that we dont have to display such a large number.
// 		document.location.hash = 'orgpack.orgid';

		Dashboard.Action.AddOrg(ndata.orgpack);

		// if there are other orgs inside this org, then we need to process those (and obtain the packs for them), and store the keys so that we can decrypt everything.


	}
};

$(document).ready(function() {
	Events.Init();
});


console.log("Events module loaded");
