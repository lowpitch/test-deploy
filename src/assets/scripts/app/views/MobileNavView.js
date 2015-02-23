'use strict';

// ----------------------------------------------------------------------------
// Imports
//
var _ = require('underscore'),
    Backbone = require('backbone'),
    MasterView = require('../views/MasterView'),
    template = require('../templates/mobile-nav.html');



// ----------------------------------------------------------------------------
// MobileNavView
//
var MobileNavView = MasterView.extend({

    events: {

        "click .mobile-nav a": "mobileNavClicked",
        "click .icon-menu": "mobileNavButtonClicked"
    },

    el: '#mobile-nav',


    initialize: function() {

        var $mobileNav = this.$el.find('.mobile-nav');
        this.$el.html(template());

        this.$el.find('.mobile-nav').append(Backbone.$('#nav nav.navigation').html()).find('.subheading').remove();
        this.$el.find('.mobile-nav ul').prepend('<li><a class="home" href="/#">Homepage</a></li>');
        this.$el.find('.mobile-nav ul').append('<li><a class="about" href="/about">About Footballers United</a></li>');
    },

    navigating: function() {
        this.$el.removeClass('open');
    },

    mobileNavButtonClicked: function() {
        this.$el.toggleClass('open');
    },

    mobileNavClicked: function(event) {

        this.$el.removeClass('open');
        var trigger = Backbone.$(event.currentTarget);
        if (trigger.hasClass('home')) {
            Backbone.history.navigate('/', true);
            //Backbone.history.navigate('/#', true);
            return;
        }

        if (trigger.hasClass('about')) {
            Backbone.history.navigate('/about', true);
            //Backbone.history.navigate('/#', true);
            return;
        }
        event.preventDefault();
        var progressNumber = trigger.data('progress');

        Backbone.trigger('mobile-nav-clicked', progressNumber);


    }



});


// ----------------------------------------------------------------------------
// exports
//
module.exports = MobileNavView;