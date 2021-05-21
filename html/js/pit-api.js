
// this is a group of functions that interact with the PIT api at the server end.

var PitAPI = {



    send : function(sdata) {

        console.assert(sdata.target);
        console.assert(sdata.payload);

        $.ajax({
            url: sdata.target,
            dataType: 'json',
            type: 'post',
            contentType: 'application/x-www-form-urlencoded',
            data: sdata.payload,
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
