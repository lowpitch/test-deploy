'use strict';

// ----------------------------------------------------------------------------
// Imports
//
var $ = require('jquery'),
    Backbone = require('backbone'),
    Router = require('../routers/router'),
    Facebook = require('../util/Facebook'),
    FastClick = require('../util/FastClick'),
    touchswipe = require('touchswipe'),
    touchpunch = require('touchpunch'),
    template = require('../templates/main.html'),
    config = require('../data-store/Config'),
    draf = require('../util/draf');



// ----------------------------------------------------------------------------
// AppView
//
var AppView = Backbone.View.extend({

    el: '#pals-app',

    initialize: function() {
        this.setupConfig();
        this.preventDefaultClick();
        this.render();
        this.setupRouter();
        Facebook.loadAPI();
        FastClick(document.body);

        if (navigator.userAgent.match(/iPad;.*CPU.*OS 7_\d/i)) {
            $('html').addClass('ipad ios7');
        }

        if (navigator.userAgent.match(/iPad;/i)) {
            $('html').addClass('ipad');
        }
    },

    render: function() {
        this.$el.html(template());
    },

    setupRouter: function() {
        // Main routes for the application
        this.router = new Router();

        // No html5 push state because we don't have control of the web server to do redirects
        // hashbangs FTW :O
        Backbone.history.start({
            pushState: false
        });
    },

    preventDefaultClick: function() {
        // Stop urls from fireing and use Backbone routing instead
        var self = this;

        this.$el.on('click', 'a:not([data-bypass])', function(event) {



            var href = $(this).attr('href'),
                protocol = this.protocol + '//';

            //console.log(href, protocol, href.slice(0, protocol.length));
            // Ensure the protocol is not part of URL, meaning its relative.
            if (href && href !== '#' && href.slice(0, protocol.length) !== protocol) {

                event.preventDefault();

                if (href.substr(0, 1) == "#") {
                    href = href.substr(1, href.length - 1);
                }
                self.router.navigate(href, {
                    trigger: true
                });
                return false;
            }

            if (href === "#") {
                event.preventDefault();
            }
        });
    },

    setupConfig: function() {
        // Data is bootstrapped into the page in a script tag.
        // Get this data from the window object and add it to
        // the config initialize so it can be used around the app
        config.initialize(window.palsDataStore);
    }

});


// ----------------------------------------------------------------------------
// exports
//
module.exports = new AppView();