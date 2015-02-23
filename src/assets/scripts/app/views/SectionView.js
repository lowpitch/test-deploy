'use strict';

// ----------------------------------------------------------------------------
// Imports
//
var _ = require('underscore'),
    Backbone = require('backbone'),
    $ = require('jquery'),
    MasterView = require('../views/MasterView'),
    template = require('../templates/section.html'),
    sectionInnerTemplate = require('../templates/section-inner.html'),
    sectionInnerTemplate1 = require('../templates/section-inner-1.html'),
    sectionInnerTemplate2 = require('../templates/section-inner-2.html'),
    sectionInnerTemplate3 = require('../templates/section-inner-3.html'),
    sectionInnerTemplate4 = require('../templates/section-inner-4.html'),
    sectionInnerTemplate5 = require('../templates/section-inner-5.html'),
    config = require('../data-store/Config');



// ----------------------------------------------------------------------------
// SectionView
//
var SectionView = MasterView.extend({

    events: {
        'click .play': 'videoPlay',
        'click .section': 'sectionClicked'
    },

    el: '#section',

    initialize: function(options) {
        this.options = options;
    },


    sectionClicked: function(event) {

        //console.log($(event.currentTarget).data('id'));

        var $clicked = $(event.currentTarget);

        if ($clicked.hasClass('current')) {
            // goto the page
            Backbone.history.navigate('/section/' + $clicked.data('id') + '/play', true);
            return;
        } else if ($clicked.hasClass('previous')) {
            this.options.sectionId--;
            this._resolveClasses();


        } else {
            this.options.sectionId++;
            this._resolveClasses();
        }

        Backbone.history.navigate('/section/' + this.options.sectionId, false);
        Backbone.trigger('sendAnalytics');
        var self = this;
        this.$el.find('.texture .section-holder .container').fadeOut(function() {
            self._renderSection();
            Backbone.trigger('force-nav-change', self.options.sectionId);
        });

    },

    forceUpdate: function() {
        this._update();
    },

    _update: function() {
        var self = this;

        this._resolveClasses();

        this._renderSection();

        this.$el.swipe({
            //Generic swipe handler for all directions
            swipe: function(event, direction, distance, duration, fingerCount, fingerData) {
                if (direction == 'right') {
                    self.$el.find('.previous').trigger('click');
                } else if (direction == 'left') {
                    self.$el.find('.next').trigger('click');
                }
                //console.log("SWIPE", direction);
            }
        });

    },

    render: function() {

        var self = this;

        this.$el.html(template(this.getData()));

        this.$el.find('.header img').on('load', function() {
            Backbone.trigger('reposition-nav');
        })

        this.$el.find('.section .background').each(function() {
            $(this).css('opacity', 0);
            $(this).parent().prepend('<div class="bg-container"></div>');

            $(this).parent().find('.bg-container').css({
                // 'background-size': 'cover',
                'background-image': 'url(' + $(this).attr('src') + ')'

            })

        });

        this._update();


    },

    _renderSection: function() {

        var templates = [sectionInnerTemplate1, sectionInnerTemplate2, sectionInnerTemplate3, sectionInnerTemplate4, sectionInnerTemplate5];

        this.$el.find('.texture .section-holder').html(templates[this.options.sectionId - 1](this.getData()));


        this.$el.find('.mobile-title-box div').text(this.$el.find('.section.current .chapter-title').text());

        this.$el.find('.carousel').removeClass('pos1 pos2 pos3 pos4 pos5').addClass('pos' + this.options.sectionId);

        this.$el.find('.section-masthead').attr('src', '/assets/media/landing-pages/background/section-' + this.options.sectionId + ".jpg");
    },

    _resolveClasses: function() {
        for (var i = 1; i <= 5; i++) {
            var $curr = this.$el.find('.section' + i);
            $curr.attr('class', 'section section' + i);
            var diff = i - this.options.sectionId;

            if (diff == 0) {
                $curr.addClass('current');
            } else if (diff == 1) {
                $curr.addClass('next');
            } else if (diff == -1) {
                $curr.addClass('previous');
            } else if (diff > 0) {
                $curr.addClass('right' + (diff));
            } else {
                $curr.addClass('left' + (-diff));
            }
        }
    },

    getPositionForNav: function() {
        return this.$el.find('.header').height() - 80;
    },

    getData: function() {
        var sectionId = this.options.sectionId;
        return _.find(config.data.sections, function(obj) {
            return obj.id === parseInt(sectionId, 10);
        });
    },

    videoPlay: function() {

        Backbone.history.navigate("/section/" + this.options.sectionId + "/play", true);
    }

});



// ----------------------------------------------------------------------------
// exports
//
module.exports = SectionView;