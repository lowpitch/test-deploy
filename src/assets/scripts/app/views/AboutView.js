'use strict';

// ----------------------------------------------------------------------------
// Imports
//
var Backbone = require('backbone'),
    MasterView = require('../views/MasterView'),
    Mobile = require('../util/Mobile'),
    template = require('../templates/about.html');



// ----------------------------------------------------------------------------
// AboutView
//
var AboutView = MasterView.extend({

    el: '#about',

    events: {

    },

    initialize: function() {
        this.render();

    },

    watchFromBeginning: function() {

        Backbone.trigger('videoScrub', 0, true);
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
module.exports = AboutView;