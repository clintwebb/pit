// orgs

var Orgs = {
    neworgpack : function(name) {
        var crypt = new JSEncrypt({default_key_size: 2048});
        crypt.getKey();

        var privkey  = crypt.getPrivateKey();
        var pubkey  =  crypt.getPublicKey();


        var result = { 'orgname': name
        };

        return result;

    }
};

console.log("Orgs module loaded");
