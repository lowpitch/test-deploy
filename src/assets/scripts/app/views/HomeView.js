'use strict';

// ----------------------------------------------------------------------------
// Imports
//
var Backbone = require('backbone'),
    MasterView = require('../views/MasterView'),
    Facebook = require('../util/Facebook'),
    Mobile = require('../util/Mobile'),
    template = require('../templates/home.html');



// ----------------------------------------------------------------------------
// HomeView
//
var HomeView = MasterView.extend({

    el: '#home',

    events: {
        "click .facebook-sign-in": "facebookSignIn",
        "click .facebook-connect": "facebookConnect",
        "click .facebook-disconnect": "facebookDisonnect",
        "click .watch-from-beginning": "watchFromBeginning"
    },

    initialize: function() {
        this.render();

        Backbone.on('facebookStatus', this.updateFacebookStatus, this);
        Backbone.on('facebookFriendCount', this.showFacebookFriendCount, this);

        Facebook.getStatus();
    },

    watchFromBeginning: function() {

        Backbone.trigger('videoScrub', 0, true);
    },


    updateFacebookStatus: function(statusObj) {

        // console.log("Facebook status has updated", statusObj);
        if (!statusObj.ready) {
            return;
        }

        this.$el.find('.social .btn').addClass('hidden');
        this.$el.find('.connected-message').addClass('hidden');
        if (statusObj.loggedIn && statusObj.permissioned) {

            this.showFacebookLoginButton('.facebook-disconnect');
            this.$el.find('.connected-message').removeClass('hidden');

            //Facebook.getFriendCount();
            // good to go
        } else if (statusObj.loggedIn) {
            this.showFacebookLoginButton('.facebook-connect');
        } else {
            this.showFacebookLoginButton('.facebook-sign-in');
        }
    },

    // showFacebookFriendCount: function(friend_count) {
    //     var message = "You have " + friend_count + " friend" + (friend_count == 1 ? "" : "s") + " on Facebook";
    //     this.$el.find('.connected-message').text(message).removeClass('hidden')
    // },

    showFacebookLoginButton: function(whichButton) {
        this.$el.find('.facebook-btn').addClass('hidden');
        if (whichButton) {
            // console.log("Looking to turn on button", this.$el.find(whichButton).length);
            this.$el.find(whichButton).removeClass('hidden');
        }
    },

    facebookSignIn: function() {
        this.showFacebookLoginButton(null);
        Facebook.loginAndConnect();
    },

    facebookConnect: function() {
        this.showFacebookLoginButton(null);
        Facebook.connect();
    },

    facebookDisonnect: function() {
        this.showFacebookLoginButton(null);
        Facebook.disconnect();
    },

    render: function() {
        this.$el.html(template());
        // when the main image has loaded, send out an event so that the nav can update its position
        this.$el.find('.header img').on('load', function() {
            Backbone.trigger('reposition-nav');
        })
    },

    getPositionForNav: function() {
        return this.$el.find('.header').height() - 80;
    }

});


// ----------------------------------------------------------------------------
// exports
//
module.exports = HomeView;