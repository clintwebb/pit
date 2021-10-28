/*
 * Dashboard
 *
 * The dashboard object is for interacting with the user, and updating the dashboard.   All other operations will mostly be handled and directed by the Events object.
 *
 */




// 		$(window).on('popstate', function(event) {
// 		alert("pop");
// 		});


// Dashboard is broken into three sections.
//  Init
//    This initialises things that need to be initialised, regardless of initial state.
//  Action
//    Actions are things that are used by other parts of the system to update the visuals or state of the dashboard.
//  Triggers
//    Triggers are things that are generally caused by something the user is intending on doing.  Triggers generally result in something that starts an Action.


var Dashboard = {
	Init: function() {

		// For all interactive elements, will simply give them a function to call.  Any additional logic will then be in there.  Sometimes it will simply then just trigger an action.  A little bit unnecessary in many cases, but for now will keep the triggers and actions seperate.

		$("#but-signin").click(function()			{ Dashboard.Trigger.Signin(); });
		$("#but-signup-inc").click(function()		{ Dashboard.Trigger.SigninCreate(); });
		$('#but-add-org').click(function()			{ Dashboard.Trigger.AddOrg(); });
		$("#but-signout").click(function()			{ Dashboard.Trigger.Logout(); });
		$("#but-signup-cancel").click(function()	{ Dashboard.Trigger.SignupCancel(); });
		$("#but-signup").click(function()			{ Dashboard.Trigger.Signup(); });

		console.log("FEATHER")
		feather.replace()

		$(".loader").hide();
	},
	Action: {
		AddOrg: function(orgdata) {
			// this function is used to add an organisation to the Orgbar on the dashboard.

			navid="nav-org-"+orgdata.orgid;

			console.assert(orgdata);
			console.assert(orgdata.settings);
			console.assert(orgdata.settings.orgname);

			$("#orglist").append("<li class=\"nav-item\" id=\""+navid+"\"><a class=\"nav-link\" href=\"#\" onClick=Dashboard.Trigger.SelectOrg(\""+orgdata.orgid+"\")><span data-feather=\"package\"></span>"+orgdata.settings.orgname+"</a></li>");
	// 			$('li').append("<p>hello</p>")
	// 				$('a', {class:"nav-link", href:"#", onclick: function() { Dashboard.SelectOrg(orgdata.orgid)}  }).append(
	// 					$('span', {'data-feather': "package"}).append(
	// 						orgdata.org.settings.orgname
	// 					)
	// 				)
	//  			).appendTo($("#orglist"));
	//  		);

			document.location.hash = orgdata.orgid;
			feather.replace();
		},
		ShowLogin: function() {
			// show the login screen.  // and set the appropriate event listeners on the form objects.
			$("#main").hide();
			$("#intro").show();
	        $(".form-signin").show();
			$(".form-signup").hide();
			$('#frm-signin')[0].email.select();
		},
		ShowSignup: function() {
			// Called when a user is seing the Signin page, but wants to switch to create account
			$("#main").hide();
			$("#intro").show();
	        $(".form-signin").hide();
			$(".form-signup").show();
			$('#frm-signup')[0].email.select();

		},
		ShowDashboard: function(id, auth) {
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
			$("#orglist").empty();

			$('#frm-signin')[0].email.value = '';
			$('#frm-signin')[0].pass.value = '';
			$('#frm-signin')[0].email.select();

			// the user has specifically selected to signout, so all session data should also be removed.
			// if there is specific items we wish to retain in localstorage, then that will need to be handled specifically
			// (probably by grabbing those items, clearing everything, and then putting them back)
			sessionStorage.clear();
			localStorage.clear();

			Dashboard.Action.ShowLogin();
		}
	},
	Trigger: {
		AddOrg: function() {
			// 		var org = Orgs.newOrgPack({name: "freddy"});
			// this would
			var org = { orgid: "blah", settings: { orgname: "freddy"}}
			Dashboard.AddOrg(org);
			alert("Functionality not yet available");
		},

		SelectOrg: function(orgid) {
			// Triggered when user selects an Org from the Organisations list.
			alert("Selected: " + orgid);
			navid="#nav-org-"+orgid;

			document.location.hash = orgid;

			localStorage.setItem('lastorg', orgid);

			// lookup the details of this organisation
			var org = Orgs.getOrg(orgid);
			$("#dash-org-title").text(org.settings.orgname);
		},

		SigninCreate: function() {
			// user was presented with the signin page, but has chosen to create an account.
			Dashboard.Action.ShowSignup();
		},

		Signin: function() {
			// we have the username, and the password entered.

			// activate the loading overlay.
			$(".loader").show();

			// We set an almost immediate timout so that the browser can complete the "Loader" change.
			// The timeout then fires off, and performs the functionality.  This is to provide a faster visual response to the user.
			setTimeout(function() {

				// The username and password entered by the user, will be hashed to generate a large string (Account-Guard).  Once we have the password from the form, we clear it.
				var inEmail = $('#frm-signin-email').val();
				var inPass = $('#frm-signin-pass').val();
				$('#frm-signin')[0].pass.value = '';

				Events.Signin({
					email: inEmail,
					pass: inPass
				});

			}, 10);
		},
		SignupCancel: function() {
			Dashboard.Action.ShowLogin();
		},
		Signup: function() {
			$(".form-signin").hide();

			// check that the two passwords match.. if not, then do a quick alert, and take them back to the creation form (with email filled in).
			var inPass1 = $('#frm-signup-pass1').val();
			var inPass2 = $('#frm-signup-pass2').val();

			console.assert(inPass1 != null && inPass1.length > 0, "Password is empty");
			console.assert(inPass1 != null && inPass1.length > 0, "Password is empty");

			if (inPass1.localeCompare(inPass2) != 0) {
				// the passwords dont match.
				alert("Passwords dont match.  Please try again.");
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
					Events.Signup( {
						email: $('#frm-signup-email').val(),
						pass: inPass1
					} );

				}, 10);
			}
		},
		Logout: function() {
			Dashboard.Action.Logout();
		}
	},

};



$(document).ready(function() {
	console.log("DASHBOARD READY");

});


console.log("Dashboard module loaded");
