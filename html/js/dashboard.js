/* globals Chart:false, feather:false */



var Dashboard = {
	AddOrg: function(orgdata) {
		// this function is used to add an organisation to the Orgbar on the dashboard.

		navid="nav-org-"+orgdata.orgid;

		console.assert(orgdata);
		console.assert(orgdata.settings);
		console.assert(orgdata.settings.orgname);

 		$("#orglist").append("<li class=\"nav-item\" id=\""+navid+"\"><a class=\"nav-link\" href=\"#\" onClick=Dashboard.SelectOrg(\""+orgdata.orgid+"\")><span data-feather=\"package\"></span>"+orgdata.settings.orgname+"</a></li>")
// 			$('li').append("<p>hello</p>")
// 				$('a', {class:"nav-link", href:"#", onclick: function() { Dashboard.SelectOrg(orgdata.orgid)}  }).append(
// 					$('span', {'data-feather': "package"}).append(
// 						orgdata.org.settings.orgname
// 					)
// 				)
//  			).appendTo($("#orglist"));
//  		);

		feather.replace();
	},
	SelectOrg: function(orgid) {
		alert("Selected: " + orgid);
		navid="#nav-org-"+orgid;

		// lookup the details of this organisation
		var org = Orgs.getOrg(orgid);
		$("#dash-org-title").text(org.settings.orgname);
	},
	Login: function() {
		// this function will be called the same way, under these circumstances:
		//  * when the user logs in manually
		//  * when the user logs in automatically
		//  * when a new account is setup.

		// then we need to load all the relevant data... specifically the organisations and their main packs.
		// select the organisation to display... if saved, display the last one that was open.
		// setup up all the background activities (timers) for processing the message queues.

        $("#intro").hide();
        $("#main").show();

	},
	Logout: function() {
		// clear info out of the session and local storage
		// reload the page.
	}
};

(function () {
  'use strict'

  console.log("FEATHER")
  feather.replace()

})()


$(document).ready(function() {

	console.log("READY")

	$('#but-add-org').click(function() {
// 		var org = Orgs.newOrgPack({name: "freddy"});
		var org = { orgid: "blah", org: { settings: { orgname: "freddy"}}}
		Dashboard.AddOrg(org);
		alert("Functionality not yet available");
	});


    $("#but-signin").click(function() {

		// we have the username, and the password entered.

		// activate the loading overlay.
		$(".loader").show();

		// we set an almost immediate timout so that the browser can complete the "Loader" change.  The timeout then fires off, and performs the functionality.  This is to provide a faster visual response to the user.
		setTimeout(function() {

			// The username and password entered by the user, will be hashed to generate a large string (Account-Guard).
			var inEmail = $('#frm-signin-email').val();
			var inPass = $('#frm-signin-email').val();
			var auth = CryptoJS.SHA256(inEmail + inPass).toString();
			console.assert(auth.length > 0);
			console.log("long-passphrase: ", auth);

			var id = CryptoJS.SHA256(inEmail).toString();

			// Now that we have our auth, and our ID, we need to attempt the first phase of the login.

			// if we already have the privkey, then we just need to validate it.


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

// 									var privkey = CryptoJS.AES.decrypt(Base64.decode(data2.rec), auth).toString();
									var privkey = Crypt.decryptString(data2.rec, auth);
									console.log("privkey: ", privkey);

									var crypt = new JSEncrypt({default_key_size: 2048});
									crypt.setPrivateKey(privkey);

									var orgpack = Pack.unpack(privkey, data2.orgpack);

									localStorage.setItem("privkey", data2.rec);
									localStorage.setItem("mainorgid", orgpack.orgid);

									// if the user selected to rememebr the login, then we also store the auth-hash in localstorage
									if ($("#login-remember").is(':checked')) {
										localStorage.setItem("auth", auth);
									}

									Dashboard.AddOrg(orgpack);
									Dashboard.Login({
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
								$('#frm-signup')[0].password.value = '';
								$('#frm-signup')[0].verify.value = '';
								$('#frm-signin')[0].email.select();
								$(".loader").hide();
							}
						});
					}
					else {
						alert("Login attempt failed... please try again.")
						$('#frm-signin')[0].password.value = '';
						$('#frm-signin')[0].email.select();
						$(".loader").hide();
					}
				},
				error: function( jqXhr, textStatus, errorThrown ){
					console.log("FAILED to establish secure session!");
					console.log( errorThrown );
				}
			});
		}, 10);
    });

    $("#but-signup-inc").click(function() {
        $(".form-signin").hide();
        $(".form-signup").show();
        $('#frm-signup')[0].email.select();
    });
    $("#but-signin-inc").click(function() {
        $(".form-signin").show();
        $(".form-signup").hide();
    });

    $("#but-signout").click(function() {
        $("#main").hide();
        $("#intro").show();
    });

    $("#but-signup-cancel").click(function() {
        $(".form-signup").hide();
        $(".form-signin").show();
        $('#frm-signin')[0].email.select();
    });

    $("#but-signup").click(function() {
        $(".form-signin").hide();

        // check that the two passwords match.. if not, then do a quick alert, and take them back to the creation form (with email filled in).
        var inPass1 = $('#frm-signup-pass1').val();
        var inPass2 = $('#frm-signup-pass2').val();

        console.assert(inPass1 != null && inPass1.length > 0, "Password is empty");
        console.assert(inPass1 != null && inPass1.length > 0, "Password is empty");

        if (inPass1.localeCompare(inPass2) != 0) {
            // the passwords dont match.
            alert("Passwords dont match.  Please try again");
            $('#frm-signup')[0].password.value = '';
            $('#frm-signup')[0].verify.value = '';
            $('#frm-signup')[0].password.select();
        }
        else {
            // seems to match.

            // activate the loading overlay.
            $(".loader").show();

			// we set an almost immediate timout so that the browser can complete the "Loader" change.  The timeout then fires off, and performs the functionality.  This is to provide a faster visual response to the user.
			setTimeout(function() {

				// The username and password entered by the user, will be hashed to generate a large string (Account-Guard).
				var inEmail = $('#frm-signup-email').val();
				var auth = CryptoJS.SHA256(inEmail + inPass1).toString();
				console.assert(auth.length > 0);
				console.log("long-passphrase: ", auth);

				// A private/public key pair for the user (and the default ORG) is generated.
				var crypt = new JSEncrypt({default_key_size: 2048});
				crypt.getKey();

				// A copy of the private key will be protected by that large string (auth).
				var id = CryptoJS.SHA256(inEmail).toString();
				var privkey  = crypt.getPrivateKey();
				var pubkey   = crypt.getPublicKey();
				var encprivkey = Crypt.encrypt(privkey,auth);
				var guard = CryptoJS.SHA256(encprivkey).toString();
				var guard_hash = CryptoJS.SHA256(guard + auth).toString();

				var org = Orgs.newOrgPack({ name: inEmail, key: privkey });
				console.assert(org.orgpack.s);

				// generate an account-guard (just a hash of the encrypted private key).
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

							localStorage.setItem("privkey", encprivkey);
							localStorage.setItem("mainorgid", org.orgid);

							// if the user selected to rememebr the login, then we also store the auth-hash in localstorage
							if ($("#login-remember2").is(':checked')) {
								localStorage.setItem("auth", auth);
							}


							// TODO: need to add this organisation to the dashboard, and then switch to it.
							Dashboard.AddOrg(org);

							Dashboard.Login({
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




			}, 10);


        }
    });


    // check the sessionStorage to see if we have anything unpacked in there.
    // if not, then we need to ask the user to login.
	if ("privkey" in localStorage) {
		// we have the privkey... do we also have the auth?
		if ("auth" in localStorage) {
			// we have the auth and the privkey... so the user wants to automatically login.
			Dashboard.Login({
				'privkey': localStorage["privkey"],
				'auth':    localStorage["auth"]
			})
		}
	}
	else {
		// if we do not have the privkey, we will definately need the user to login (or create an account).

	}


	// TODO: Setup timer to check the User Messages



	// TODO: Setup timers to check the messages for the Organisations.



    $(".loader").hide();
});


console.log("Dashboard module loaded");
