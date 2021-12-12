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
//    Triggers are things that are generally caused by something the user is intending on doing.
//    Triggers generally result in something that starts an Action, or an Event which often results in an Action.
//
// *** Seperating these into Actions and Triggers is done to help during initial development.  Once the flow is working and understood, having them seperate may no longer be useful and the functionality can be combined.  It was just found to be useful during the initial stages.


var Dashboard = {
	Init: function() {

		// For all interactive elements, will simply give them a function to call.  Any additional logic will then be in there.  Sometimes it will simply then just trigger an action.  A little bit unnecessary in many cases, but for now will keep the triggers and actions seperate.

		$("#but-signin").click(function()			{ Dashboard.Trigger.Signin.Submit(); });
		$("#but-signup-inc").click(function()		{ Dashboard.Trigger.Signin.Create(); });
		$('#but-add-org').click(function()			{ Dashboard.Trigger.Org.Add(); });
		$("#but-signup").click(function()			{ Dashboard.Trigger.Signup.Submit(); });
		$("#but-signup-cancel").click(function()	{ Dashboard.Trigger.Signup.Cancel(); });
		$("#but-settings").click(function()			{ Dashboard.Trigger.Settings.Show(); });
		$("#but-settings-cancel").click(function()	{ Dashboard.Trigger.Settings.Cancel(); });
		$("#but-settings-save").click(function()	{ Dashboard.Trigger.Settings.Save(); });
		$("#but-signout").click(function()			{ Dashboard.Trigger.Logout(); });

		feather.replace()

		$(".loader").hide();
		console.log("DASHBOARD Initialized");
	},
	Action: {
		AddOrg: function(orgdata) {
			// this function is used to add an organisation to the Orgbar on the dashboard.

			navid="nav-org-"+orgdata.pack.orgid;

			console.assert(orgdata);
			console.assert(orgdata.pack);
			console.assert(orgdata.packid);
			console.assert(orgdata.pack.settings);
			console.assert(orgdata.pack.orgid);

			// The element for organisation names have changed over time.  They should be converted at a different level... TODO
			var vname = "Unnamed";
			if      (orgdata.pack.settings.name)    { vname = orgdata.pack.settings.name; }
			else if (orgdata.pack.settings.orgname) { vname = orgdata.pack.settings.orgname; }

			$("#orglist").append("<li class=\"nav-item\" id=\""+navid+"\"><a class=\"nav-link\" href=\"#\" onClick=Dashboard.Trigger.Org.Select(\""+orgdata.pack.orgid+"\")><span data-feather=\"package\"></span>"+vname+"</a></li>");
	// 			$('li').append("<p>hello</p>")
	// 				$('a', {class:"nav-link", href:"#", onclick: function() { Dashboard.SelectOrg(orgdata.orgid)}  }).append(
	// 					$('span', {'data-feather': "package"}).append(
	// 						vname
	// 					)
	// 				)
	//  			).appendTo($("#orglist"));
	//  		);

			document.location.hash = orgdata.pack.orgid;
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
		ShowDashboard: function() {
			// this function will be called the same way, under these circumstances:
			//  * when the user logs in manually
			//  * when the user logs in automatically
			//  * when a new account is setup.

			// then we need to load all the relevant data... specifically the organisations and their main packs.
			// select the organisation to display... if saved, display the last one that was open.
			// setup up all the background activities (timers) for processing the message queues.

			$("#intro").hide();
			$("#main").show();
			$("#main_dash").show();
			$("#main_settings").hide();
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
		},
		UpdatedSettings: function() {
			// some settings have been updated.  So get everything we need from the sessionStorage, update the appropriate elements, and then display the dashboard.
			// this includes:
			//		clearing the Orgs list, and regenerating it.
			//		Updating the main name on the dashboard.
			alert("Dashboard.UpdatedSettings() - INCOMPLETE");
			Dashboard.Action.ShowDashboard();
		}
	},
	Trigger: {
		Org: {
			Add: function() {
				// 		var org = Orgs.newOrgPack({name: "freddy"});
				// this would
				var org = { orgid: "blah", settings: { orgname: "freddy"}}
				Dashboard.Action.AddOrg(org);
				alert("Functionality not yet available");
			},
			Select: function(orgid) {
				// Triggered when user selects an Org from the Organisations list.
				alert("Selected: " + orgid);
				navid="#nav-org-"+orgid;

				document.location.hash = orgid;

				localStorage.setItem('lastorg', orgid);

				// lookup the details of this organisation
				var org = Orgs.getOrg(orgid);
				$("#dash-org-title").text(org.settings.orgname);
			},
		},
		Signin: {
			Create: function() { Dashboard.Action.ShowSignup(); },
			Submit: function() {
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
			}
		},
		Signup: {
			Cancel: function() { Dashboard.Action.ShowLogin(); },
			Submit: function() {
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
		},
		Settings: {
			Show: function() {

				// we should have the orgs in the session.  We need to have something that specifies which org is the active one.
				// get the settings from the org, and display it.
				var orgs = JSON.parse(sessionStorage.getItem('orgs'));
				var currorg = sessionStorage.getItem('currorg');
				var mainorg = sessionStorage.getItem('mainorg');

				var packs = JSON.parse(sessionStorage.getItem('packs'));
				console.assert(packs);

				if (currorg != mainorg ) {
					alert("not main org.")
				}

				console.assert(currorg);
				console.assert(orgs);
				console.assert(currorg in orgs);

				$('#frm-settings')[0].name.value = packs[orgs[mainorg]].settings.orgname;

				$("#intro").hide();
				$("#main").show();
				$("#main_dash").hide();
				$("#main_settings").show();
			},
			Cancel: function() {
				Dashboard.Action.ShowDashboard();
			},
			Save: function() {

				var orgs = JSON.parse(sessionStorage.getItem('orgs'));
				var packs = JSON.parse(sessionStorage.getItem('packs'));
				var currorg = sessionStorage.getItem('currorg');
				var mainorg = sessionStorage.getItem('mainorg');

				console.assert(currorg);
				console.assert(orgs);
				console.assert(currorg in orgs);

				var corg = orgs[currorg];
				console.assert(corg);

				var oldpack = packs[corg];
				console.assert(oldpack);

				var nName = $('#frm-settings-name').val();

				var same = true;
				if ( nName != oldpack.settings.name) { same = false; }

				if (same != true) {
					// the settings were changed, we need to create an updated orgpack (which references teh existing one)
					alert("Incomplete");

					console.assert(orgs[mainorg]);
					console.assert(packs[orgs[mainorg]]);
					var byname = packs[orgs[mainorg]].settings.orgname;
					console.assert(byname);

					var bydate = new Date;


					var newpack = JSON.parse(JSON.stringify(oldpack));
					newpack.settings.name = nName;
					newpack.updated = {
						date: bydate.toISOString(),
						by: byname,
						summary: "Updated Settings.",
						nextpack: corg
					};

					// if the org is the mainorg for the user, then we use the users privkey.
					var orgkey;
					if (currorg == mainorg) {
						orgkey = sessionStorage.getItem('privkey');
					}
					else {
						// if it is a different org, then we need to get the privkey for that org.
					}
					console.assert(orgkey);


					Orgs.updateOrgPack(orgpack, newpack);
				}

				// To save the settings, we need to trigger an event which will update the orgpack with the new info, and submit it.  Once completed, it will then refresh the content
				Dashboard.Action.UpdatedSettings();
			}
		},
		Logout: function() { Dashboard.Action.Logout(); }
	}

};

var toggler = document.getElementsByClassName("caret");
var i;

for (i = 0; i < toggler.length; i++) {
  toggler[i].addEventListener("click", function() {
    this.parentElement.querySelector(".nested").classList.toggle("active");
    this.classList.toggle("caret-down");

	// Trigger

  });
}


console.log("Dashboard module loaded");
