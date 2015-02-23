'use strict';

// ----------------------------------------------------------------------------
// Imports
//
var Backbone = require('backbone');



// ----------------------------------------------------------------------------
// MasterView
//
var MasterView = Backbone.View.extend({

    initialize: function () {

    },

    show: function (callback) {
        this.$el.fadeIn(callback);
    },

    hide: function (callback) {
        this.$el.fadeOut(callback);
    },

    isVisible: function () {
        return this.$el.is(':visible');
    }

});


// ----------------------------------------------------------------------------
// exports
//
module.exports = MasterView;
