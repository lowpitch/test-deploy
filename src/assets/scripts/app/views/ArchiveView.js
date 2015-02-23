'use strict';

// ----------------------------------------------------------------------------
// Imports
//
var _ = require('underscore'),
    $ = require('jquery'),
    Backbone = require('backbone'),
    MasterView = require('../views/MasterView'),
    template = require('../templates/archive.html'),
    ArchiveFactory = require('../util/ArchiveFactory'),
    config = require('../data-store/Config');



// ----------------------------------------------------------------------------
// ArchiveView
//
var ArchiveView = MasterView.extend({

    events: {
        'click .resume': 'backToVideo',
        'click .main-close': 'closeArchive',
        'click .overlay-close': 'closeOverlay',
        'click .logo-block': 'removeClassThenBackToVideo',
        'click .play-from-here': 'playFromHere',
        'click .navigation': 'handleClickOnBar',
        'click .icon-facebook': 'onFacebookIconClicked',
        'click .icon-twitter': 'onTwitterIconClicked',
        'click .chapter-button': 'onPaginate',
        'click .gallery img': 'launchGallery',
        'click .first-time .wrapper': "_clearFirstTimeOverlay"
    },

    el: '#archive',

    dirtyScroll: true,
    lastActiveItem: null,
    itemLookup: [],
    isFirstRoute: false,
    lastId: false,

    initialize: function(options) {
        this.options = options || {};
        Backbone.on('sectionChanged', this.sectionChanged, this);
        this.render();
        _.bindAll(this, 'itemScroll');
        var self = this;
        this.$el.find('.archive-items').on('scroll', function() {
            //console.log("Scroll detected", self);
            self.dirtyScroll = true;
        });
        $(window).resize(function() {
            self.dirtyScroll = true;
        })
        window.requestAnimationFrame(this.itemScroll);

        this.$el.find('nav.navigation').append($('#nav nav.navigation').html());
        this.$el.find('nav.navigation .item-title').wrap('<div class="title-container"></div>');
        this.$el.find('nav.navigation a').each(function() {
            var replacement = $('<span class="nolink">' + $(this).html() + '</span>');

            $(this).replaceWith(replacement);
        });
        this.$el.find('nav.navigation').prepend("<div class='fakeprogress'><span></span></div>");

        // Backbone.on('syncProgress', function(overallPercentage) {
        //     self.$el.find('.fakeprogress span').css('width', overallPercentage + "%");
        // })
        //

        var throttledMove = _.throttle(function(event) {
            //console.log(event);
            $('.rollover').css('left', (-80 + event.clientX - ($('.rollover').width() / 2)) + "px");
        }, 50);
        $('.structure-wrap .navigation').on('mousemove', throttledMove);

    },

    firstRoute: function(isFirst) {
        this.isFirstRoute = isFirst;

        if (isFirst) {
            //
            //        this._showFirstTimeOverlay();
        } else {
            //       this._clearFirstTimeOverlay();
        }
    },

    _showFirstTimeOverlay: function() {
        this.showingFirstTime = true;
        this.$el.find('.first-time').delay(300).queue(function() {
            $(this).addClass('visible').clearQueue();
        });
    },

    _clearFirstTimeOverlay: function() {
        this.showingFirstTime = false;
        this.$el.find('.first-time').removeClass('visible').clearQueue();
    },

    closeOverlay: function() {
        this._clearFirstTimeOverlay();
    },

    moveFirstTimePrompt: function(percent) {
        ///console.log("Moving to ", percent);

        return;

        var windowWidth = this.$el.find('.navigation').width();
        var leftPos = windowWidth * (percent / 100);
        leftPos += 80;
        leftPos -= 16;
        this.$el.find('.pointer').css('left', leftPos + "px");
    },

    onPaginate: function(event) {
        if ($(event.currentTarget).hasClass('previous')) {
            var nextSection = parseInt(this.currentSection) - 1;
            if (this.currentSection > 0) {
                Backbone.history.navigate('/section/' + nextSection + '/archive/1', true);
            }
        } else {
            var nextSection = parseInt(this.currentSection) + 1;
            if (this.currentSection < 6) {
                Backbone.history.navigate('/section/' + nextSection + '/archive/1', true);
            }
        }
        event.preventDefault();
        event.stopPropagation();
        return false;
    },
    handleClickOnBar: function(event) {
        Backbone.trigger('handleClickOnBar', event.clientX - 80);

    },

    playFromHere: function(event) {
        var start = Math.round($(event.currentTarget).data('start'));
        Backbone.trigger('jumpToTimeInSection', this.currentSection, start);
    },

    launchGallery: function(event) {
        var parent = $(event.currentTarget).parents('.archive-item');
        var id = parseInt(parent.data('id'));

        var item = this.getItemById(id);

        var index = -1;
        parent.find('.gallery img').each(function(ind) {
            if (this == event.currentTarget) {
                index = ind;
            }
        });
        var data = {
            item: item,
            index: index,
            section: this.currentSection
        };

        //console.log(data);

        Backbone.trigger('showGallery', data);
        //        console.log("Launch with item...", data);
    },

    imageLoaded: function() {

    },

    onFacebookIconClicked: function(event) {
        var share_url = "http://www.footballersunited.co.uk/#section/" + this.currentSection + "/archive/" + $(event.currentTarget).parent().parent().parent().data('id');
        var msg = " Check this out from the Footballers United archive: " + $(event.currentTarget).parent().parent().find('.heading-large').text() + " " + share_url;
        msg = encodeURIComponent(msg);

        var url = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(share_url); // + "&desc=" + msg;
        window.open(url, '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600')
    },

    onTwitterIconClicked: function(event) {
        var share_url = "http://www.footballersunited.co.uk/#section/" + this.currentSection + "/archive/" + $(event.currentTarget).parent().parent().parent().data('id');
        var msg = "Check this out from the Footballers United archive: " + $(event.currentTarget).parent().parent().find('.heading-large').text() + " " + share_url;
        msg = encodeURIComponent(msg);
        var url = "https://twitter.com/intent/tweet?original_referer=" + encodeURIComponent(share_url) + "&text=" + msg;
        window.open(url, '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600')
    },

    removeClassThenBackToVideo: function() {
        var self = this;
        this.$el.find('.logo-block').removeClass('move-in');
        setTimeout(function() {
            //Backbone.history.navigate('/section/' + self.currentSection + '/play', true);
            Backbone.trigger('returnToVideo');
        }, 600);
    },
    closeArchive: function() {

        if (this.isFirstRoute) {
            var start = this.$el.find('.item' + this.lastId);
            if (start.length > 0) {
                start.find('.play-from-here').trigger('click');
                return;
            }
        }
        Backbone.trigger('returnToVideo');

        // //console.log(Backbone.history, );
        // //
        // if (Backbone.history.history.length > 1) {
        //     Backbone.history.history.back();

        // } else {
        //     Backbone.history.navigate('/section/' + this.currentSection + '/play', true);
        // }
        //
        // Backbone.trigger ('videoPlay');
    },

    itemScroll: function() {



        // get the scroll position
        if (!this.dirtyScroll) {
            window.requestAnimationFrame(this.itemScroll);
            return;
        }
        this.dirtyScroll = false;

        var scrollPosition = this.$el.find('.archive-items').scrollTop();
        var newTop, itemHeight, metaHeight, opacityPercent;
        var activeItem = null;

        this.$el.find('.archive-item').each(function(i) {
            var $item = $(this);
            var itemTop = $item.position().top;

            // see if it's above

            itemHeight = $item.height();
            metaHeight = $item.find('.meta').height() + 20;

            if (itemTop < 190) {
                newTop = (190 - itemTop);
                if (newTop > itemHeight - metaHeight) {
                    opacityPercent = 1 - (2 * ((newTop - (itemHeight - metaHeight)) / metaHeight));
                    if (opacityPercent > 0) {
                        $item.find('.meta').css({
                            'transform': 'translate3d(0px,' + (itemHeight - metaHeight) + 'px,0px)',
                            'opacity': Math.round(opacityPercent * 100) / 100
                        });

                    }
                } else {
                    activeItem = this;
                    $item.find('.meta').css({
                        'transform': 'translate3d(0px,' + newTop + 'px,0px)',
                        'opacity': 1
                    });
                }
            } else {
                if (!activeItem) {
                    activeItem = this;
                }
                $item.find('.meta').css({
                    'transform': 'translate3d(0px,0px,0px)',
                    'opacity': 1
                });
            }


        })

        if (activeItem && activeItem != this.lastActiveItem) {
            this.newItemActive(activeItem);
        }

        window.requestAnimationFrame(this.itemScroll);

    },

    newItemActive: function(item) {
        if (!item) {
            return;
        }
        var startPercentage = (this.currentSection - 1) * 20;
        this.lastActiveItem = item;
        var id = $(item).data('id');
        var itemConfig = this.itemLookup[id];
        var itemStart = itemConfig.timecode[0].start;
        var sectionLength = config.data.sections[this.currentSection - 1].length;
        var percentOfSection = (itemStart / sectionLength) * 20;
        var totalPercent = startPercentage + percentOfSection;
        this.$el.find('.fakeprogress span').css('width', totalPercent + "%");

        if (this.showingFirstTime) {
            this.moveFirstTimePrompt(totalPercent);
        }
        // console.log(config);

    },

    render: function() {
        this.$el.html(template({}));
    },

    sectionChanged: function(sectionId) {


        this.currentSection = sectionId;
        if (sectionId == -1) {
            this.$el.find('.archive-items .item-holder').empty();
            return;
        }

        if (sectionId == 1) {
            this.$el.find('.previous').hide();
        } else {
            this.$el.find('.previous').show();
        }

        if (sectionId == 5) {
            this.$el.find('.next').hide();
        } else {
            this.$el.find('.next').show();
        }

        this.lastActiveItem = null;

        var data = this.getSectionData(sectionId);
        var self = this;

        var output = "";

        this.itemLookup = [];
        for (var i = 0; i < data.length; i++) {

            this.itemLookup[data[i].id] = data[i];

            output += ArchiveFactory.getFullContent(data[i]);
            //            output += itemTemplate (data[i]);
        }

        this.$el.find('.archive-items .item-holder').html(output);


        this.dirtyScroll = true;
    },

    scrollTo: function(id) {
        var self = this;
        this._scrollTo(id);
        this.$el.find('.archive-items img').on('load', function() {
            self._scrollTo(id);
            self.dirtyScroll = true;
        })

        this.lastId = id;

        this.$el.find('.logo-block').removeClass('move-in').addClass('move-in');
        this.$el.find('.archive-item').removeClass('scrolled-to');
        this.$el.find('.item' + id).addClass('scrolled-to');

    },

    _scrollTo: function(id) {
        if (this.$el.find('.item' + id).length == 0 || !this.$el.find('.item' + id).position()) {
            return;
        }
        this.$el.find('.archive-items').scrollTop(this.$el.find('.item' + id).position().top - 30 + this.$el.find('.archive-items').scrollTop());
        //this.itemScroll();
        this.dirtyScroll = true;
    },

    getArchiveData: function() {
        var id = parseInt(this.options.id);

        return _.find(config.data.archive[this.options.sectionId - 1], function(obj) {
            return obj.id === id;
        });
    },

    getItemById: function(id) {
        //console.log("getItemById", config.data.archive.length, this.options.sectionId, config.data.archive[this.options.sectionId - 1]);
        return _.find(config.data.archive[this.currentSection - 1], function(obj) {
            //  console.log("Looking at item", obj.id, "compare to", id, obj.id === id);
            return obj.id === id;
        });
    },



    getSectionData: function(sectionId) {
        var archiveData = config.data.archive[parseInt(sectionId) - 1];
        archiveData.sort(function(a, b) {
            if (a.timecode[0].start < b.timecode[0].start) {
                return -1;
            } else if (a.timecode[0].start > b.timecode[0].start) {
                return 1;
            }
            return 0;
        })
        return archiveData;
    },

    backToVideo: function() {
        Backbone.trigger('enterVideoMode');
        Backbone.trigger('videoPlay');
    }

});


// ----------------------------------------------------------------------------
// exports
//
module.exports = ArchiveView;