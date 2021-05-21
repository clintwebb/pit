/* globals Chart:false, feather:false */

(function () {
  'use strict'

  feather.replace()



})()


$(document).ready(function() {

    $("#but-signup").click(function() {
        $(".form-signin").hide();
        $(".form-signup").hide();

        $('#frm-signup-verify')[0].password.value = '';
        $(".form-signup-verify").show();
        $('#frm-signup-verify')[0].password.select();
    });

    $("#but-signin").click(function() {
        $("#intro").hide();
        $("#main").show();
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
        $(".form-signin").show();
        $(".form-signup").hide();
    });

    $("#but-signup-verify").click(function() {

        // check that the two passwords match.. if not, then do a quick alert, and take them back to the creation form (with email filled in).
        var inPass1 = $('#frm-signup-pass1').val();
        var inPass2 = $('#frm-signup-pass2').val();

        console.assert(inPass1 != null && inPass1.length > 0, "Password is empty");
        console.assert(inPass1 != null && inPass1.length > 0, "Password is empty");

        if (inPass1.localeCompare(inPass2) != 0) {
            // the passwords dont match.
            alert("Passwords dont match.  Please try again");
            $('#frm-signup-verify')[0].password.value = '';
            $('#frm-signup')[0].password.value = '';

            $(".form-signup-verify").hide();
            $(".form-signup").show();

            $('#frm-signup')[0].password.select();
        }
        else {
            // seems to match.

            // activate the loading overlay.
            $(".loader").show();

            // The username and password entered by the user, will be hashed to generate a large string (Account-Guard).
            var inEmail = $('#frm-signup-email').val();
            var auth = CryptoJS.SHA256(inEmail + inPass1).toString();
            console.assert(auth.length > 0);
            console.log("long-passphrase: ", auth);

//          A private/public key pair for the user (and the default ORG) is generated.
            var crypt = new JSEncrypt({default_key_size: 2048});
            crypt.getKey();

//          A copy of the private key will be protected by that large string (auth).
            var id = CryptoJS.SHA256(inEmail).toString();
            var privkey  = crypt.getPrivateKey();
            var pubkey   = crypt.getPublicKey();
            var encprivkey = CryptoJS.AES.encrypt(privkey, auth).toString();
            var guard = CryptoJS.SHA256(encprivkey).toString();
            var guard_hash = CryptoJS.SHA256(guard + auth).toString();

            var org = Orgs.neworgpack({ name: inEmail, key: privkey });

			console.assert(org.orgpack.s);

            // since this is the orgpack for the user, we need to save the

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



            PitAPI.send({
                target: '/api/1/newaccount',
                payload: sdata,
                success: function(result) {
					if (result.success) {
						console.log("New Account Request done");
					}

                    console.log("AAAA");
                    $(".loader").hide();
                },
                failure: function(result) {
                    console.log("Failed to create account");
                    alert("failed to create the account");
                    $(".loader").hide();
                }
            });

//                     Browser sends an account creation request, which includes:
//                     A copy of the Account-Guard data that has been hashed with the long-passphrase
//                     A copy of the raw Account-Guard data.
//                     A copy of the users-private key that has been protected by the long-passphrase
//                     Server receives this packet, creates an account with the very very basics. Nothing else is known about it, other than it is a unique account. The server doesn't know the username or the password. It doesn't even have the public key.
//                     This means that the server has a copy of the private-key for the account. But does not have a copy of the passphrase that was used to encrypt it. So it cannot use it. It is only storing it so that authentication can be done one browsers that do not have a copy of the key (ie, the user uses a different browser to access the service. They need to use their username and password correctly to obtain a copy of the private-key and to decrypt it)
//                     All the relevant information is stored in the browser storage.
//                     Since the account is new, a default Group pack will be created in the browser, encrypted and sent to the server. This will be the basis of all future changes and additions to the users stored information.
//                     Browser will then walk the user through setting up any additional information. They will be warned that unless they specifically request it, others wont have access to any of their details.
//                     Account details are saved on the server.

        }
    });


    $("#but-signup-verify-cancel").click(function() {
        $(".form-signin").show();
        $(".form-signup-verify").hide();
    });


    // check the sessionStorage to see if we have anything unpacked in there.
    // if not, then we need to ask the user to login.





    $(".loader").hide();
});
