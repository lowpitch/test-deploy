'use strict';

// ----------------------------------------------------------------------------
// Imports
//
var $ = window.jQuery = require('jquery'),
    Backbone = require('backbone');



// ----------------------------------------------------------------------------
// Facebook
//
var Facebook = {

    ready: false,
    loggedIn: false,
    permissionGiven: false,
    friendCount: -1,

    loadAPI: function() {

        var self = this;

        window.fbAsyncInit = function() {
            // initialize the SDK
            FB.init({
                appId: '749017245164602',
                // appId: '751614211571572',
                cookie: true, // enable cookies to allow the server to access
                // the session
                xfbml: true, // parse social plugins on this page
                version: 'v2.1' // use version 2.1
            });

            self.ready = true;

            // get the initial log-in state of the user
            FB.getLoginStatus(function(response) {
                self.statusChanged(response);
            });
        };

        // Load the SDK asynchronously
        (function(d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            js = d.createElement(s);
            js.id = id;
            js.src = "//connect.facebook.net/en_US/sdk.js";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
    },

    statusChanged: function(response) {

        var loggedIn = false,
            permissionGiven = false;

        // console.log(response);

        switch (response.status) {
            case 'connected':
                loggedIn = true;
                permissionGiven = true;

                this.getFriendCount();

                break;
            case 'not_authorized':
                loggedIn = true;
                break;
        }

        this.loggedIn = loggedIn;
        this.permissionGiven = permissionGiven;

        // send out notification...
        this.dispatchStatus();
    },

    getStatus: function() {
        this.dispatchStatus();
    },

    getFriendCount: function() {
        var self = this;
        if (self.friendCount > -1) {
            // return 1000;
            //return 900;
            return self.friendCount;
        }
        FB.api('/me/friends', function(response) {
            if (response.summary && response.summary.total_count) {
                self.friendCount = response.summary.total_count;
                Backbone.trigger('facebookFriendCount', response.summary.total_count);
            } else {
                Backbone.trigger('facebookFriendCountError', response);
            }
        });

        return this.friendCount;
    },

    retrieveStatus: function() {
        return {
            ready: this.ready,
            loggedIn: this.loggedIn,
            permissioned: this.permissionGiven
        };
    },

    dispatchStatus: function() {
        Backbone.trigger('facebookStatus', this.retrieveStatus());
    },

    loginAndConnect: function() {
        this._loginAndConnect();
    },

    connect: function() {
        this._loginAndConnect();
    },

    disconnect: function() {
        var self = this;
        FB.logout(function(response) {
            // handle the response
            self.statusChanged(response);
        });
    },

    _loginAndConnect: function() {
        var self = this;
        FB.login(function(response) {
            // handle the response
            self.statusChanged(response);
        }, {
            scope: 'public_profile,user_friends'
        });
    },

    testAPI: function() {
        // console.log('Welcome!  Fetching your information.... ');
        FB.api('/me', function(response) {
            // console.log('Successful login for: ' + response.name);
        });
    }



};


// ----------------------------------------------------------------------------
// exports
//
module.exports = Facebook;