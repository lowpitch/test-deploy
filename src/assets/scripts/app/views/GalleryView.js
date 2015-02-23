'use strict';

// ----------------------------------------------------------------------------
// Imports
//
var Backbone = require('backbone'),
    MasterView = require('../views/MasterView'),
    $ = require('jquery'),
    Mobile = require('../util/Mobile'),
    template = require('../templates/gallery.html');



// ----------------------------------------------------------------------------
// GalleryView
//
var GalleryView = MasterView.extend({

    el: '#gallery',

    events: {
        'click .close': 'closeClicked',
        'click .previous': 'previousClicked',
        'click .next': 'nextClicked'
    },

    initialize: function() {

        this.render();
        Backbone.on('showGallery', this.showGallery, this);
        Backbone.on('hideGallery', this.hideGallery, this);
        var self = this;
        this.$el.swipe({
            //Generic swipe handler for all directions
            swipe: function(event, direction, distance, duration, fingerCount, fingerData) {
                console.log("SWPIE");
                if (direction == 'right') {
                    self.$el.find('.previous').trigger('click');
                } else if (direction == 'left') {
                    self.$el.find('.next').trigger('click');
                }
                //console.log("SWIPE", direction);
            }
        });

    },

    nextClicked: function() {
        var self = this;
        this.$el.find('.nav-box').hide();
        this.$el.find('.image-holder img').velocity({
            opacity: 0
        }, {
            duration: 500,
            complete: function() {
                self.index++;
                if (self.index >= self.currentData.images.length) {
                    self.index = 0;

                }
                self.$el.find('.image-holder img').remove();
                self._showImage();
            }
        })
    },

    previousClicked: function() {
        var self = this;
        this.$el.find('.nav-box').hide();
        this.$el.find('.image-holder img').velocity({
            opacity: 0
        }, {
            duration: 500,
            complete: function() {
                self.index--;
                if (self.index < 0) {
                    self.index = self.currentData.images.length - 1;

                }
                self.$el.find('.image-holder img').remove();
                self._showImage();
            }
        })
    },

    closeClicked: function() {
        Backbone.trigger('hideGallery');
    },

    showGallery: function(data) {
        this.isActive = true;
        var self = this;
        var item = data.item;
        var images = [];
        for (var i = 1; i <= 8; i++) {
            if (typeof(item.media["media" + i]) != "undefined" && item.media["media" + i] != "") {
                images.push(item.media["media" + i]);
            }
        }
        data.images = images;
        this.currentData = data;
        this.$el.html(template(data.item)).show();


        this.index = data.index;

        this.$el.hide().fadeIn();
        this.$el.find('.pagination').text((this.index + 1) + "/" + this.currentData.images.length);
        this.$el.find('.info-holder').velocity({
            zoom: 1
        }, {
            duration: 300,
            complete: function() {
                self.$el.find('.info-holder').addClass('shown');
                setTimeout(function() {
                    self._showImage();
                }, 500);

            }
        })

    },

    _showImage: function() {

        if (!this.isActive) {
            return;
        }
        var self = this;
        var currentImage = this.currentData.images[this.index];
        this.$el.find('.pagination').text((this.index + 1) + "/" + this.currentData.images.length);

        var $newImage = $('<img src="/assets/media/section-' + this.currentData.section + '/archive/' + currentImage + '" />');
        this.$el.find('.image-holder').append($newImage);

        $newImage.on('load', function() {

            var availableHeight = $('.image-holder').height();
            var availableWidth = $('.image-holder').width();
            var imageWidth = $(this).width(),
                imageHeight = $(this).height();

            var screenAspect = availableWidth / availableHeight,
                imageAspect = imageWidth / imageHeight;

            if (imageAspect > screenAspect) {
                // make the image full width
                $(this).css('width', '100%');
            } else {
                $(this).css('height', '100%');
            }

            // calculate again
            imageWidth = $(this).width(), imageHeight = $(this).height();

            $(this).css('margin-left', ((availableWidth - imageWidth) / 2) + "px");
            $(this).css('margin-top', ((availableHeight - imageHeight) / 2) + "px");
            //  console.log($(this).width(), $(this).height());
            //$(this).css('width', '100%');
            $(this).addClass('loaded');

            self.$el.find('.nav-box').fadeIn();
        });
    },

    hideGallery: function() {
        if (this.isActive) {
            this.isActive = false;
            this.$el.empty().hide();
        }
    }



});


// ----------------------------------------------------------------------------
// exports
//
module.exports = GalleryView;