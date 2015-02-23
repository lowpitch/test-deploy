
    // First time we define jQuery add it to the window because Backbone uses this global
    var $ = window.jQuery = require('jquery');
    var Velocity = require('velocity-animate');
    var Backbone = require('backbone');
    Backbone.$ = $;

    // And so it begins...
    $(function () {
        var app = require('./app/views/AppView');
    });
