'use strict';

// ----------------------------------------------------------------------------
// Imports
//
var _ = require('underscore'),
    Backbone = require('backbone'),
    MasterView = require('../views/MasterView'),
    template = require('../templates/nav.html');



// ----------------------------------------------------------------------------
// NavView
//
var NavView = MasterView.extend({

    events: {
        'click .nav .item a': 'navClicked',
        // 'scroll': 'scrollNav'
    },

    el: '#nav',

    scrollPosition: 0,

    clingingTo: null,

    originalNavMarginTop: 0,

    initialize: function() {
        // _.bindAll(this, 'scrollNav');
        _.bindAll(this, 'updateVerticalPosition');
        Backbone.$(window).on('resize', this.updateVerticalPosition);

        Backbone.on('activeViewUpdated', this.activeViewUpdated, this);
        Backbone.on('reposition-nav', this.updateVerticalPosition, this);
        Backbone.on('force-nav-change', this.sectionChanged, this);
        this.render();
    },

    show: function(callback) {
        this.$el.show();

    },

    hide: function(callback) {
        this.$el.hide();

    },

    activeViewUpdated: function(view, viewIdentifier) {

        if (viewIdentifier == "video" || viewIdentifier == "archive") {
            this.hide();
        } else {
            this.clingTo(view, false);
            this.show();
        }
    },

    clingTo: function(view, withAnimation) {
        this.clingingTo = view;
        this.updateVerticalPosition(withAnimation);
    },

    updateVerticalPosition: function(withAnimation) {
        if (this.clingingTo && "getPositionForNav" in this.clingingTo) {
            var verticalPositionFromView = this.clingingTo.getPositionForNav();
            if (withAnimation === true) {
                this.$el.find('nav.nav').velocity({
                    'top': verticalPositionFromView
                }, 600);
            } else {
                this.$el.find('nav.nav').css('top', verticalPositionFromView);
            }
        }
    },

    render: function() {
        this.$el.html(template());
        this.originalNavMarginTop = this.$('.navigation').css('margin-top'); // store original margin-top for animation reset later


    },

    sectionChanged: function(newSection) {
        this.$('.navigation .item').removeClass('selected');
        this.$('a[data-progress=' + newSection + ']').parent().addClass('selected');
    },

    navClicked: function(event) {
        event.preventDefault();

        var trigger = Backbone.$(event.currentTarget);
        var progressNumber = trigger.data('progress');

        Backbone.trigger('nav-clicked', progressNumber);



        // // remove all selection classes
        // this.$('.navigation .item').removeClass('selected');
        // trigger.parents('.item').addClass('selected');

        // // Set progress class
        // this.$('.navigation')
        //     .removeClass('progress1 progress2 progress3 progress4')
        //     .addClass('progress' + progressNumber);

        // send out an event to say that the navigation button has been clicked
        // different views will handle this differently I guess


    }

});


// ----------------------------------------------------------------------------
// exports
//
module.exports = NavView;