'use strict';

// ----------------------------------------------------------------------------
// Imports
//
var _ = require('underscore'),
    Backbone = require('backbone'),
    $ = require('jquery'),
    MasterView = require('../views/MasterView'),
    Facebook = require('../util/Facebook'),
    template = require('../templates/facebook-overlay.html'),
    templateNotLoggedIn = require('../templates/facebook-overlay-prompt.html');



// ----------------------------------------------------------------------------
// FacebookView
//
var FacebookView = MasterView.extend({

    events: {
        'click .facebook-continue': 'finishedFacebook',
        'click .facebook-connect': 'connectFacebook',
        'click .facebook-disconnect': 'disconnectFacebook',
        'click .close': 'finishedFacebook'
    },

    el: '#facebook-overlay',


    initialize: function() {
        this.$el.hide();

        Backbone.on('showFacebook', this.showFacebook, this);
        Backbone.on('hideFacebook', this.hideFacebook, this);
        Backbone.on('closeFacebook', this.closeFacebook, this);
        Backbone.on('facebookStatus', this.updateFacebookStatus, this);

    },

    connectFacebook: function() {


        this.$el.find('.facebook-btn').hide();
        Facebook.connect();
    },

    disconnectFacebook: function(event) {


        this.$el.find('.facebook-btn').hide();
        Facebook.disconnect();

        event.preventDefault();
        event.stopPropagation();
        this.finishedFacebook();
        return false;
    },

    updateFacebookStatus: function(statusObj) {

        if (!statusObj.ready) {
            return;
        }


        if (statusObj.loggedIn && statusObj.permissioned) {
            var self = this;
            this.$el.find('.social').fadeOut(function() {
                if (self.currentConfig) {
                    self.showFacebook(self.currentConfig);
                }
            })

        } else {
            this.$el.find('.facebook-btn').show();
        }
    },


    _animate: function() {
        this.$el.find('.stat-row').each(function(index) {
            var self = this;
            var countColumn = $(this).find('.count-column');
            var endValue = parseInt(countColumn.text());
            countColumn.text(0);

            $(this).velocity({
                zoom: 1,

            }, {
                delay: index * 1000,
                complete: function(complete) {
                    $(self).removeClass('hidden-stat-row');


                    $(self).velocity({
                        zoom: 1
                    }, {
                        duration: 300,
                        delay: 500,
                        complete: function() {
                            countColumn.text(endValue);
                        },
                        progress: function(elements, percent) {
                            countColumn.text(Math.round(endValue * percent));
                        }
                    })
                },

            })
        })
    },

    showFacebook: function(config) {
        this.$el.fadeIn();
        this.currentConfig = config;

        var status = Facebook.retrieveStatus();
        if (status && status.ready && status.loggedIn && status.permissioned) {
            config.friend_count = Facebook.getFriendCount();
            this.$el.html(template(config));

            this._animate();
        } else {
            this.$el.html(templateNotLoggedIn(config));
        }



    },



    finishedFacebook: function(event) {
        // this.currentConfig = null;

        Backbone.trigger('hideFacebook');


        event.preventDefault();
        event.stopPropagation();
        return false;

    },

    hideFacebook: function() {
        if (this.currentConfig) {
            this.currentConfig = null;
            this.$el.fadeOut(function() {
                $(this).empty();
            });
        }
    },

    closeFacebook: function(event) {
        this.$el.hide();

    }

});


// ----------------------------------------------------------------------------
// exports
//
module.exports = FacebookView;