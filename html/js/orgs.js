// orgs

var Orgs = {


    newOrgPack : function(predata) {

		console.assert(predata);
		console.assert(predata.settings);
		if (! predata.name) { predata.name = "Unnamed"; }

		// Returns a data that will be injected in a request to create a new organisation.
        var crypt = new JSEncrypt({default_key_size: 2048});

		// if a key was provided, we will use that.  If one was not, then we create a new key.
		if (predata.key) { crypt.setPrivateKey(predata.key); }
		else { crypt.getKey(); }

        var privkey  = crypt.getPrivateKey();
        var pubkey  =  crypt.getPublicKey();

		// id doesn't matter what this is, as long it is fairly unique.  This will be the identifier of this organisation.
		var idhash = CryptoJS.SHA256(privkey + Pack.randpass() + predata.name).toString();

		var sendorg = {
			orgid: idhash,
			settings : predata.settings,
			members: null,
			orgs: null,
			groups : {
				'Internet': null,
				'Shopping': null,
				'Utilities': null
			}
		}

		var orgpack = Pack.pack(privkey, JSON.stringify(sendorg));

        var result = {
			'orgid': idhash,
			'org': sendorg,
			'privkey': privkey,
			'orgpack': orgpack
        };

		// note that the private key needs to be stored in the users main pack... so we cant just return the send data.

        return result;

    },
	getOrg: function(orgid, fn) {
		console.log("GetOrg - getting the organisation data");

		var org = null;

		// we should really always have the mainorg in local storage.
		console.assert("mainorgid" in sessionStorage);
		console.assert("orgs" in sessionStorage);

		var orgs = JSON.parse(sessionStorage["orgs"]);
		if (orgid in orgs) {
			org = orgs[orgid];
		}
		else {
			// the org isn't in the structure... so we need to look it up
			$.ajax({
				url: '/api/1/getorg',
				dataType: 'json',
				type: 'post',
				contentType: 'application/x-www-form-urlencoded',
				data: {'oid': orgid},
				success: function( data, textStatus, jQxhr ){
					if (data.success) {
						console.log("we have the org data.")
// 						org = Pack.unpack()
					}
					else {
						console.log("failed to obtain the org.");
					}
				},
				error: function( jqXhr, textStatus, errorThrown ){
					console.log( errorThrown );
				}
			});
		}

		// the mainorg wasn't the org we were logging for.
		if (org == null) {
			// we dont have the org yet.
		}

		return org;
	},
	updateOrgPack: function(orgkey, newpack) {
		console.log("Update Org Pack");

		// submit the new org pack,
		// update the internal structures
		// if it is the main org of a user, then we encrypt it with the privkey in session.
		// if it is not the main org, then we need to get the privkey for that org, out of the users mainorg.

		var updatedOrgPack = pack.pack(orgkey, newpack);


	}
};

console.log("Orgs module loaded");
