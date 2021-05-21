// orgs

var Orgs = {


    newOrgPack : function(predata) {

		if (! predata.name) { predata.name = "Unnamed"; }

		// Returns a data that will be injected in a request to create a new organisation.
        var crypt = new JSEncrypt({default_key_size: 2048});

		// if a key was provided, we will use that.  If one was not, then we create a new key.
		if (predata.key) { crypt.setPrivateKey(predata.key); }
		else { crypt.getKey(); }


        var privkey  = crypt.getPrivateKey();
        var pubkey  =  crypt.getPublicKey();

		// id doesn't matter what this is, as long it is fairly unique.  This will be the identifier of this organisation.
		var idhash = CryptoJS.SHA256(privkey + Pack.randpass() + name).toString();


		var sendorg = {
			orgid: idhash,
			settings : { orgname: predata.name },
			members: null,
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
	getOrg: function(orgid) {
		console.log("GetOrg - getting the organisation data");

		var org = null;

		// we should really always have the mainorg in session storage.
		if ("mainorg" in sessionStorage) {
			var mainorg = JSON.parse(sessionStorage["mainorg"]);
			if (mainorg.orgid == orgid) {
				org = mainorg;
			}
		}

		// the mainorg wasn't the org we were logging for.
		if (org == null) {
			// we dont have the org yet.
		}

		return org;
	}
};

console.log("Orgs module loaded");
