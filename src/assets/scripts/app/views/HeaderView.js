'use strict';

// ----------------------------------------------------------------------------
// Imports
//
var Backbone = require('backbone'),
    MasterView = require('../views/MasterView'),
    template = require('../templates/header.html');



// ----------------------------------------------------------------------------
// HeaderView
//
var HeaderView = MasterView.extend({

    el: '#header',

    initialize: function () {
        this.render();
    },

    render: function () {
        this.$el.html(template());
    }

});


// ----------------------------------------------------------------------------
// exports
//
module.exports = HeaderView;
