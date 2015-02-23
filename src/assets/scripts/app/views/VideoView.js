'use strict';

// ----------------------------------------------------------------------------
// Imports
//
var _ = require('underscore'),
    $ = require('jquery'),
    jqueryuui = require('jqueryui'),
    Backbone = require('backbone'),
    MasterView = require('../views/MasterView'),
    Video = require('../util/video'),
    ArchiveFactory = require('../util/ArchiveFactory'),
    template = require('../templates/video.html'),
    toggleTemplate = require('../templates/toggle-notification.html'),
    quietTemplate = require('../templates/quiet-notification.html'),
    mobileArchiveTemplate = require('../templates/mobile-archive-thumbnail.html'),
    mobileFacebookArchiveTemplate = require('../templates/mobile-facebook-archive-thumbnail.html'),
    Notifications = require('../views/NotificationsView'),
    config = require('../data-store/Config');



// ----------------------------------------------------------------------------
// VideoView
//
var VideoView = MasterView.extend({

    el: '#video',

    events: {
        'click .toggle-close': 'togglePromptClicked',
        'click .toggle-open-message': 'togglePromptClicked',
        'click .toggle-close-message': 'togglePromptClicked',
        'click .navigation .item a': 'navClicked',
        'click .show-archive': 'togglePopups',
        'click .play-pause': 'toggleVideo',
        'mouseenter .dots li span': 'viewDot',
        'mouseleave .dots li span': 'clearDot',
        'click .dots li': 'dotClicked',
        'click video': 'toggleVideo',
        'mouseenter .bottom-bar': 'movePopupsUp',
        'mouseleave .bottom-bar': 'movePopupsDown',
        'click .controls-wrap': 'toggleVideo',
        'click .timeline-box': 'launchNearestArchive',
        'click .navigation': 'timelineClicked',
        'click .bottom-bar': 'cancelClick',
        'click .mini-logo': 'logoClicked',
        'click .icon-speaker-off': 'muteAudio',
        'click .icon-speaker': 'unmuteAudio',
        'click .icon-facebook': 'facebookClicked',
        'click .icon-twitter': 'twitterClicked',
        'click .next': 'nextSection',
        'click .previous': 'previousSection',
        'click .quiet': 'quietNotificationClicked'
    },

    widthPercentToVideoPercent: function(percent) {
        var overallDuration = this.videoEndPoints[4];
        var section = Math.floor(percent / 20) + 1;
        var percentOfSectionClicked = (percent % 20) * 5;
        var startOfCurrentSection = this.videoStartPoints[section - 1];
        var lengthOfCurrentSection = this.videoEndPoints[section - 1] - startOfCurrentSection;
        var timeAtClick = startOfCurrentSection + (lengthOfCurrentSection * percentOfSectionClicked / 100);
        return Math.round(10000 * timeAtClick / overallDuration) / 100;
    },

    quietNotificationClicked: function() {
        Backbone.trigger('openArchiveOverlayAtCurrentTime');
    },

    muteAudio: function() {
        Backbone.trigger('muteAudio');
    },
    unmuteAudio: function() {
        Backbone.trigger('unmuteAudio');
    },

    audioMuted: function() {
        this.$el.find('.icon-speaker-off').hide();
        this.$el.find('.icon-speaker').show();
    },

    audioUnmuted: function() {
        this.$el.find('.icon-speaker-off').show();
        this.$el.find('.icon-speaker').hide();
    },

    nextSection: function() {
        if (this.currentSection < 5) {
            this.currentSection++;
            Backbone.history.navigate('/section/' + this.currentSection + '/play', true);
        }
    },


    previousSection: function() {
        if (this.currentSection > 1) {
            this.currentSection--;
            Backbone.history.navigate('/section/' + this.currentSection + '/play', true);
        }
    },
    facebookClicked: function() {
        var $ = Backbone.$;
        var msg = "Check out Footballers United: " + window.location;
        var share_url = encodeURIComponent("http://www.footballersunited.co.uk/#section/" + this.currentSection + "/play");

        var url = "https://www.facebook.com/sharer/sharer.php?u=" + (share_url);
        window.open(url, '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600')
    },
    twitterClicked: function() {

        var share_url = encodeURIComponent(window.location);
        var msg = "Check out Footballers United: " + window.location;
        msg = encodeURIComponent(msg);


        var url = "https://twitter.com/intent/tweet?original_referer=" + share_url + "&text=" + msg;

        window.open(url, '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600')

    },

    handleClickOnBar: function(xPos) {


        var totalWidth = $(window).width() - 160;
        var percent = Math.round(100 * (xPos / totalWidth));
        if (percent > 100) {
            percent = 100;
        }
        var section = Math.floor(percent / 20) + 1;
        if (section > 5) section = 5;
        Backbone.history.navigate('/section/' + section + '/play', true);
        var percentForVideo = this.widthPercentToVideoPercent(percent);
        Backbone.trigger('videoScrub', percentForVideo);

    },

    launchNearestArchive: function(event) {
        var xPos = event.clientX - 80;
        var diff = 1000000000;
        var active = null;
        var pos;
        this.$el.find('.dots li').each(function() {
            pos = $(this).position().left;

            if (Math.abs(pos - xPos) < diff) {
                diff = Math.abs(pos - xPos);
                active = $(this);
            }
        });
        if (active) {
            active.trigger('click');
        }
    },

    timelineClicked: function(event) {

        if (this.inFacebook) {
            this.closeFacebook();
            Backbone.trigger('hideFacebook');
        }
        var xPos = event.clientX - 80;


        this.handleClickOnBar(xPos);
    },

    openArchiveOverlayAtCurrentTime: function(event) {
        var archiveItems = config.data.archive[this.currentSection - 1];
        var foundOne = false;
        var currItem;
        var itemToOpen = null;
        var timeOfCurrentVideo;

        var timeOfVideo = this.lastVideoTime;

        timeOfVideo -= this.videoStartPoints[this.currentSection - 1];

        var diff = 10000000;

        //console.log(timeOfVideo);
        for (var i = archiveItems.length - 1; i >= 0; i--) {
            currItem = archiveItems[i];
            // store the first item, so we always find at least one match...
            if (!itemToOpen) {
                itemToOpen = currItem;
            }
            for (var j = 0; j < currItem.timecode.length; j++) {

                if (Math.abs(currItem.timecode[j].start - timeOfVideo) < diff) {
                    diff = Math.abs(currItem.timecode[j].start - timeOfVideo);
                    itemToOpen = currItem;
                }
            }
        }

        if (itemToOpen) {
            Backbone.history.navigate('/section/' + this.currentSection + '/archive/' + itemToOpen.id, true);
        }
    },

    jumpToTimeInSection: function(section, time) {
        var overallDuration = this.videoEndPoints[4];
        var startOfCurrentSection = this.videoStartPoints[section - 1];
        Backbone.history.navigate('/section/' + section + '/play', true);
        Backbone.trigger('videoScrub', (100 * (startOfCurrentSection + time)) / overallDuration);
    },

    logoClicked: function(event) {
        // debugger;
        // Backbone.history.navigate('/#', true);
        // event.preventDefault();
        // return false;

    },

    cancelClick: function(event) {

        event.preventDefault();
        return false;
    },

    progressTarget: null,
    timelineProgressTarget: null,
    timeoutReference: null,
    dotTimeoutReference: null,
    controlsVisible: true,
    showingPopups: false,
    isActive: false,
    videoStartPoints: [],
    videoEndPoints: [],
    rolloverItem: null,
    lastSection: -1,
    lastPosition: -1,
    returnToPosition: -1,
    scrubbing: false,
    showNarration: true,


    initialize: function() {

        var self = this;
        Backbone.on('videoPlay', this.videoStarts, this);
        Backbone.on('videoPause', this.videoStops, this);

        Backbone.on('audioMuted', this.audioMuted, this);
        Backbone.on('audioUnmuted', this.audioUnmuted, this);


        Backbone.on('mediaPlay', this.videoPlaying, this);
        Backbone.on('mediaPause', this.videoPaused, this);
        Backbone.on('mediaBuffering', this.videoBuffering, this);
        Backbone.on('mediaBuffered', this.videoFinishedBuffering, this);
        Backbone.on('videoCoverOn', this.videoCoverOn, this);
        Backbone.on('videoCoverOff', this.videoCoverOff, this);
        Backbone.on('sectionChanged', this.setSection, this);
        Backbone.on('videoTime', this.updateVideoProgress, this);
        Backbone.on('showFacebook', this.showFacebook, this);
        Backbone.on('hideFacebook', this.closeFacebook, this);

        Backbone.on('videoActive', this.makeActive, this);
        Backbone.on('videoInactive', this.makeInactive, this);

        Backbone.on('jumpToTimeInSection', this.jumpToTimeInSection, this);
        Backbone.on('handleClickOnBar', this.handleClickOnBar, this);

        Backbone.on('showTogglePrompt', this.showTogglePrompt, this);
        Backbone.on('clearTogglePrompt', this.clearTogglePrompt, this);

        Backbone.on('showQuietTime', this.showQuietTime, this);
        Backbone.on('clearQuietTime', this.clearQuietTime, this);

        Backbone.on('openArchiveOverlayAtCurrentTime', this.openArchiveOverlayAtCurrentTime, this);
        _.bindAll(this, 'windowResized', 'mouseMoved', 'hideControls');
        $(window).on('resize', this.windowResized);

        // initialize the main video once the video html has been rendered
        this.render();


        this.videoStartPoints.push(this.getStartPoint(1));
        this.videoStartPoints.push(this.getStartPoint(2));
        this.videoStartPoints.push(this.getStartPoint(3));
        this.videoStartPoints.push(this.getStartPoint(4));
        this.videoStartPoints.push(this.getStartPoint(5));

        this.videoEndPoints.push(this.getEndPoint(1));
        this.videoEndPoints.push(this.getEndPoint(2));
        this.videoEndPoints.push(this.getEndPoint(3));
        this.videoEndPoints.push(this.getEndPoint(4));
        this.videoEndPoints.push(this.getEndPoint(5));


        this.$el.hide();
        this.$el.find('nav.navigation').append($('#nav nav.navigation').html());
        this.$el.find('nav.navigation .item-title').wrap('<div class="title-container"></div>');
        this.$el.find('nav.navigation a').each(function() {
            var replacement = $('<span class="nolink">' + $(this).html() + '</span>');

            $(this).replaceWith(replacement);
        });
        this.$el.find('nav.navigation').prepend("<div class='fakeprogress'><span></span></div><div class='scrubber bg-scrubber'></div>").append("<div class='scrubber blank-scrubber'></div>");
        // this.$el.find('nav.navigation a').before("<div class='progress'></div>");
        Video.initialize();
        this.notifications = new Notifications();
        // render the dots in the timeline
        this.renderTimelineDots();

        this.turnOnPopups();
        this.windowResized();
        this.controlsVisible = false;
        this.hideControls();


        setTimeout(function() {
            self.windowResized();
        }, 500);

        var throttledScrub = _.throttle(function(percent) {
            //console.log("SENDING", percent);
            Backbone.trigger('videoScrub', self.widthPercentToVideoPercent(percent));
        }, 250);
        this.$el.find('.blank-scrubber').draggable({
            axis: "x",
            start: function() {

                self.$el.find('.bottom-bar').addClass('hover');
                self.scrubbing = true;
                self.$el.find('.bg-scrubber').addClass('scrubbing');

                if (self.inFacebook) {
                    Backbone.trigger('hideFacebook');
                }

            },
            drag: function() {
                var currentPosition = parseInt(self.$el.find('.blank-scrubber').css('left'), 10);
                self.$el.find('.bg-scrubber').css('left', currentPosition + "px");

                var widthOfArea = $(window).width() - 160;
                var percentage = (100 * (currentPosition + 18) / widthOfArea);
                //console.log(percentage);
                self.$el.find('.fakeprogress span').css('width', percentage + "%");
                throttledScrub(percentage);
            },
            stop: function() {
                self.scrubbing = false;
                self.$el.find('.bg-scrubber').removeClass('scrubbing');
            }
        });

        Backbone.on('returnToVideo', this.returnToVideo, this);
    },

    videoBuffering: function() {
        //return;
        this.$el.find('.buffer-dependent').addClass('buffering');
        // this.$el.find('.layout-video').addClass('buffering');
        this.$el.find('.buffering-video').addClass('buffering');
    },

    videoFinishedBuffering: function() {
        this.$el.find('.buffer-dependent').removeClass('buffering');
        // this.$el.find('.layout-video').removeClass('buffering');
        this.$el.find('.buffering-video').removeClass('buffering');
    },


    showFacebook: function(facebookConfig) {
        this.inFacebook = true;
        if (this.$el.find('.controls').hasClass('playing')) {
            Backbone.trigger('videoPause');
        }
        this.$el.addClass('facebook');
        this.makeInactive();
    },

    closeFacebook: function(facebookConfig) {
        this.inFacebook = false;
        if (!this.$el.find('.controls').hasClass('playing')) {
            if ($(window).width() > 767) {
                setTimeout(function() {
                    Backbone.trigger('videoPlay');

                }, 1000);

            }
        }
        this.$el.removeClass('facebook');
        this.makeActive();
    },

    makeActive: function() {
        var self = this;
        setTimeout(function() {
            // console.log("Now adding listener to the window");
            $(window).on('mousemove', self.mouseMoved);
        }, 500);

        this.isActive = true;
        this.$el.find('#notifications').show();
        this.$el.find('.logo-block').show();
        this.$el.find('.toggle-notifications').removeClass('hide');
        this.$el.find('.quiet-time').removeClass('hide');
        this.stopGentleAnimation();
    },

    _updateTogglePrompt: function(animate) {
        var self = this;
        if (!this.showNarration) {
            this.$el.find('.toggle-close-message').hide();
            this.$el.find('.toggle-close').hide();
            this.$el.find('.toggle-open-message').show();

            // if (animate) {
            //     this.$el.find('.turn-off').fadeOut(300, function() {
            //         self.$el.find('.turn-on').fadeIn();
            //     });
            // } else {
            //     this.$el.find('.turn-off').hide();
            //     this.$el.find('.turn-on').show();
            // }
        } else {

            this.$el.find('.toggle-close-message').show();
            this.$el.find('.toggle-close').show();
            this.$el.find('.toggle-open-message').hide();

            // if (animate) {
            //     this.$el.find('.turn-on').fadeOut(300, function() {
            //         self.$el.find('.turn-off').fadeIn();
            //     });
            // } else {
            //     this.$el.find('.turn-on').hide();
            //     this.$el.find('.turn-off').show();
            // }
        }
    },

    togglePromptClicked: function(event) {


        //       alert("CLICKED");
        this.showNarration = !this.showNarration;
        Backbone.trigger('toggleVideo', this.showNarration);

        this.$el.find('.toggle-close-message').hide();
        this.$el.find('.toggle-close').hide();
        this.$el.find('.toggle-open-message').hide();

        this._updateTogglePrompt(true);

        event.preventDefault();
    },

    showTogglePrompt: function(item) {
        // alert ("SHOW TOGGLE PROMPT");
        //  this.$el.find('.toggle-notifications').html(toggleTemplate(item)).fadeIn();
        this.$el.find('.toggle-close').stop().fadeIn();
        this.$el.find('.toggle-close-message .subheading').html(item.off_message);
        this.$el.find('.toggle-open-message .subheading').html(item.on_message);
        this._updateTogglePrompt();
    },

    clearTogglePrompt: function() {
        //   this.$el.find('.toggle-notifications').fadeOut();
        this.$el.find('.toggle-close').stop().fadeOut();
        this.$el.find('.toggle-close-message').stop().fadeOut();
        this.$el.find('.toggle-open-message').stop().fadeOut();
        this.$el.find('.toggle-close').css('display', '');
        this.$el.find('.toggle-close-message').css('display', '');
    },

    showQuietTime: function(item) {
        //  this.$el.find('.toggle-notifications').html(toggleTemplate(item)).fadeIn();
        this.$el.find('.quiet-time').stop().html(quietTemplate(item)).fadeIn();

    },

    clearQuietTime: function() {
        this.$el.find('.quiet-time').stop().fadeOut(function() {
            $(this).empty();
        });
    },

    makeInactive: function() {
        $(window).off('mousemove', this.mouseMoved);
        //console.log("Making inactive");
        this.hideControls();
        this.isActive = false;
        this.$el.find('.logo-block').hide();
        this.$el.find('.toggle-notifications').addClass('hide');
        this.$el.find('#notifications').hide();
        this.$el.find('.quiet-time').addClass('hide');
        this.beginGentleAnimation();
    },

    beginGentleAnimation: function() {
        this.$el.find('.mejs-container').addClass('inactive');
    },

    stopGentleAnimation: function() {
        this.$el.find('.mejs-container').removeClass('inactive');
    },

    movePopupsUp: function() {
        this.$el.find('.bottom-bar').addClass('hover');
        this.$el.find('#notifications').addClass('raise');
        this.$el.find('.toggle-open-message').addClass('raise');
        this.$el.find('.toggle-close-message').addClass('dim');
        this.$el.find('.toggle-close').addClass('dim');
    },

    movePopupsDown: function() {
        this.$el.find('.bottom-bar').removeClass('hover');
        this.$el.find('#notifications').removeClass('raise');
        this.$el.find('.toggle-open-message').removeClass('raise');
        this.$el.find('.toggle-close-message').removeClass('dim');
        this.$el.find('.toggle-close').removeClass('dim');
    },

    turnOnPopups: function() {
        this.showingPopups = true;
        this.$el.find('.show-archive').addClass('on');
        Backbone.trigger('showArchive');
    },

    turnOffPopups: function() {
        this.showingPopups = false;
        this.$el.find('.show-archive').removeClass('on');
        Backbone.trigger('hideArchive');

    },

    togglePopups: function() {
        if (this.showingPopups) {
            this.turnOffPopups();
        } else {
            this.turnOnPopups();
        }
    },

    hideControls: function() {
        if (this.inFacebook) {
            return;
        }
        //console.log("Hide controls called.");

        // if the mouse is over the control area...
        if (this.$el.find('.controls .bottom-bar').is(':hover') || this.$el.find('.controls .bottom-bar').hasClass('hover')) {
            //console.log("Not hiding controls because the mouse is over");
            return;
        }

        this.controlsVisible = false;
        this.$el.find('.controls').removeClass('visible');
        this.$el.find('.toggle-controls').removeClass('show');
    },

    showControls: function() {
        //console.log("Showing controls...");
        this.controlsVisible = true;
        this.$el.find('.controls').addClass('visible');
        this.$el.find('.toggle-controls').addClass('show');
    },

    mouseMoved: function(event) {
        if ($('html').hasClass('ipad')) {
            return;
        }

        //console.log("Mouse is moved", event);
        // alert("MOVING");
        //
        // console.log("moving", $('html').attr('class'));
        if (!this.isActive) {
            return;
        }
        if (!this.controlsVisible) {
            this.showControls();
        }
        clearTimeout(this.timeoutReference);
        this.timeoutReference = setTimeout(this.hideControls, 2000);

    },

    updateVideoProgress: function(mediaElement) {

        if (this.scrubbing) {
            return;
        }
        var progressPercent = Math.floor(10000 * mediaElement.currentTime / mediaElement.duration) / 100;


        //console.log("Progress percent is", progressPercent);
        this.lastPosition = progressPercent;

        var currentTime = mediaElement.currentTime;
        this.lastVideoTime = currentTime;

        var startOfCurrentSection, offsetOfCurrentSection, overallPercentage, lengthOfSection, currentPercent;
        overallPercentage = 0;

        // work out current section
        var lastOne = null;


        for (var i = 0; i < 5; i++) {
            if (currentTime > this.videoEndPoints[i]) {
                // if (i + 1 == this.currentSection && i < 4) {
                //     Backbone.history.navigate('/section/' + (i + 2) + '/play', false);
                //     this.setSection(i + 2, true);
                //     //console.log("WE HAVE CHANGED SECTION!!!");
                // }
                overallPercentage += 20;

            } else {

                startOfCurrentSection = this.videoStartPoints[i];
                if (currentTime > startOfCurrentSection) {
                    if (this.isActive && this.currentSection != i + 1) {
                        Backbone.history.navigate('/section/' + (i + 1) + '/play', false);
                        Backbone.trigger('sendAnalytics');
                        this.setSection(i + 1, true);
                    }
                    offsetOfCurrentSection = currentTime - startOfCurrentSection;
                    lengthOfSection = this.videoEndPoints[i] - this.videoStartPoints[i];
                    currentPercent = Math.round((10000 * offsetOfCurrentSection) / lengthOfSection) / 100;
                    //console.log(currentPercent);
                    overallPercentage += currentPercent / 5;

                }

            }
        }



        this.$el.find('.fakeprogress span').css('width', overallPercentage + "%");

        // console.log(this.$el.find('.fakeprogress span').width());



        var widthOfArea = $(window).width() - 160;
        var positionOfScrubber = ((widthOfArea * overallPercentage) / 100) - 18;
        // console.log(overallPercentage, positionOfScrubber);
        this.$el.find('.scrubber').css('left', positionOfScrubber + "px");
        Backbone.trigger('syncProgress', overallPercentage);

    },

    setSection: function(sectionId, suppressEvent) {


        this.currentSection = sectionId;

        this.sortMobileArchive();

        // remove the 'complete' class from all items, and hide and reset the progress bars
        // this.$el.find('nav .item').removeClass('complete').find('.progress').css('width', 0).hide();
        // this.$el.find('.fakeprogress').removeClass('complete').find('span').css('width', 0).hide();
        // for (var i = 1; i < sectionId; i++) {
        //     this.$el.find('nav .chapter' + i).addClass('complete');
        //     this.$el.find('.fakeprogress' + i).addClass('complete');
        // }
        // this.progressTarget = this.$el.find('nav .chapter' + sectionId + ' .progress');
        // this.progressTarget.css('width', 0).show();

        // this.timelineProgressTarget = this.$el.find('.fakeprogress' + sectionId + ' span');
        // this.timelineProgressTarget.css('width', 0).show();

        this.notifications.setSection(sectionId);

        if (!suppressEvent) {

            this.changeVideoSection(parseInt(sectionId));
        }


    },

    getTotalVideoLength: function() {
        var total = 0;
        for (var i = 0; i < config.data.sections.length; i++) {
            total += config.data.sections[i].length;
        }
        return total;
    },

    getStartPoint: function(section) {
        var total = 0;
        for (var i = 0; i < section - 1; i++) {
            total += config.data.sections[i].length;
        }
        return total;
    },

    getEndPoint: function(section) {
        var total = 0;
        for (var i = 0; i < section; i++) {
            total += config.data.sections[i].length;
        }
        return total;
    },

    changeVideoSection: function(sectionId) {
        // we also need to load the video
        Video.player.loadVideo(sectionId);

        var total = this.getTotalVideoLength();
        var start = this.getStartPoint(sectionId);

        total = 1770;

        var url = (Backbone.history.fragment);
        if (url.indexOf('?') > -1) {
            var bits = url.split('?');
            if (bits[1].indexOf('start=') === 0) {
                var secondbits = bits[1].split('=');
                var offset = parseInt(secondbits[1]);
                if (!isNaN(offset)) {
                    start += parseInt(offset);
                }
            }

        }

        // console.log("Start time shoudl be", start, total);

        Backbone.trigger('videoScrub', (100 * start) / total, true);
    },

    viewDot: function(event) {
        var self = this;
        self.notifications.dim();
        var target = $(event.currentTarget).parent();
        var id = parseInt(target.data('id'));
        var section = parseInt(target.data('section'));
        var dotTop = parseInt($(event.currentTarget).css('top'));


        var archiveItem = _.find(config.data.archive[section - 1], function(obj) {
            return obj.id === id;
        });
        archiveItem.section = section;

        target.css('z-index', 1000);
        var markup = ArchiveFactory.getBasicThumbnail(archiveItem);

        //var markup = '<div class="notify notify' + id + '"><img src="/assets/images/notify.png"/></a></div>';
        var $newElement = $(markup);
        self.rolloverItem = $newElement;

        target.append($newElement);

        $newElement.hide().fadeIn();
        $newElement.find('.line').css('height', (dotTop + 16) + 'px');
        var gutter = 10,
            offset,
            headingWidth = $newElement.find('.heading-medium').width();

        if ($newElement.offset().left + ($newElement.width() - headingWidth) / 2 < gutter) {

            var offset = $newElement.offset().left + ($newElement.width() - headingWidth) / 2 - gutter;
            $newElement.find('.heading-medium').css('transform', 'translate3d(' + (-offset) + 'px,0px,0px)').css('text-align', 'left');
        }

        var windowWidth = $(window).width();

        if ($newElement.offset().left + headingWidth + ($newElement.width() - headingWidth) / 2 > windowWidth - gutter) {
            var offset = windowWidth - gutter - gutter - $newElement.find('.heading-medium').width() - $newElement.offset().left - ($newElement.width() - headingWidth) / 2;
            $newElement.find('.heading-medium').css('transform', 'translate3d(' + (offset) + 'px,0px,0px)');

        }

        // console.log($newElement.offset().left, $newElement.find('.heading-medium').width(), windowWidth);
        //  $newElement.css('margin-top', -215 + dotTop - 35 + "px");
        // add the down-arrow
        // Initially, I was generating this automatically with a :after CSS rule
        // However, I need to be able to target the arrow with JS to offset its position
        // so I changed this back to a DOM element
        //  $newElement.find('.notify-wrap').append("<span class='downarrow'></span>");

        // $newElement.find('img').on('load', function() {
        //     // see if we need to nudge the rollover in from the edge a bit
        //     var leftOffset = $newElement.offset().left;
        //     var keepGutter = 10;
        //     if (leftOffset < keepGutter) {
        //         $newElement.css('margin-left', -leftOffset + keepGutter + "px");
        //         $newElement.find('.downarrow').css('left', (2 * (leftOffset - keepGutter)) + "px");
        //         // $newElement.find('.downarrow').css('right', leftOffset - keepGutter + "px");
        //     }
        // })

        //        console.log($newElement.position().left, $newElement.offset().left);
        // $newElement.on ('click', function () {
        //     $(event.currentTarget).trigger ('click');
        // })


    },

    isInArchive: function(inArchive) {
        if (inArchive) {
            this.$el.addClass('in-archive');
        } else {
            this.$el.removeClass('in-archive');
        }
    },

    clearDot: function(event) {
        this.notifications.undim();
        clearTimeout(this.rolloverTimeout);
        $(event.currentTarget).parent().css('z-index', 1);
        if (this.rolloverItem) {
            this.rolloverItem.remove();
        }
        //        $(event.currentTarget).find('.notify').remove();
        // clearTimeout (this.dotTimeoutReference);
        // Backbone.trigger ('dotOut');
    },

    dotClicked: function(event) {

        this.lastSection = this.currentSection;
        this.returnToPosition = this.lastPosition;
        this.returnToPlaying = this.$el.find('.controls').hasClass('playing');
        // alert("STORING TO RETURN TO PLAYING " + this.returnToPlaying);
        var id = $(event.currentTarget).data('id');
        var section = $(event.currentTarget).data('section');

        Backbone.history.navigate('/section/' + section + '/archive/' + id, true);
        event.preventDefault();
        event.stopPropagation();

    },

    returnToVideo: function() {
        if (this.lastSection > -1) {
            this.setSection(this.lastSection);
            Backbone.history.navigate('/section/' + this.lastSection + '/play', true);
            if (this.returnToPosition > -1) {
                Backbone.trigger('videoScrub', this.returnToPosition);
                if (!this.returnToPlaying) {
                    // alert("RETURN TO PLAYING IS FALSE");
                    setTimeout(function() {
                        Backbone.trigger('videoPause');
                    }, 500);


                }
            }
            this.returnToPosition = -1;
            this.lastSection = -1;


        } else {
            var currentUrl = Backbone.history.fragment;

            var urlBits = currentUrl.split("/");
            var newUrl = "/section/" + urlBits[1] + "/play";
            Backbone.history.navigate(newUrl, true);
        }
    },

    popupClicked: function(event) {
        //alert("CLICKED");

    },

    sortMobileArchive: function() {
        var $archiveHolder = this.$el.find('.archive-holder ul');
        $archiveHolder.empty();

        var data = this.notifications.archiveData[this.currentSection - 1];
        if (!data) {
            return;
        }
        for (var i = 0; i < data.length; i++) {
            $archiveHolder.append(mobileArchiveTemplate(data[i]));
        }

        var facebooks = config.data.fb;

        for (i = 0; i < config.data.fb.length; i++) {
            var currFB = config.data.fb[i];
            if (parseInt(currFB.section) == this.currentSection && currFB.show) {
                var $newFB = $(mobileFacebookArchiveTemplate(data[i]));
                $newFB.data('item', currFB);
                $archiveHolder.append($newFB);

                $newFB.on('click', function(event) {
                    Backbone.trigger('showFacebook', $(this).data('item'));

                    // alert($(this).data('item').title);
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                })
            }
        }

        //        _.

        this.$el.find('.video-section-nav em').text(config.data.sections[this.currentSection - 1].title);
        this.$el.find('.video-section-nav').removeClass('first').removeClass('last');

        if (this.currentSection == 1) {
            this.$el.find('.video-section-nav').addClass('first');
        } else if (this.currentSection == 5) {
            this.$el.find('.video-section-nav').addClass('last');
        }

        if ($(window).width() < 600) {
            this.$el.find('video').attr('poster', '/assets/media/landing-pages/foreground/section-' + this.currentSection + '.jpg');
        } else {
            this.$el.find('video').removeAttr('poster');
        }
        //
    },



    renderTimelineDots: function() {

        var data = this.notifications.archiveData;

        var $container = this.$el.find('.timeline .dots');

        var output = "";

        var startPercent, sectionLength, start, currentPercent;

        var tops = [5, 20, 35, 50, 65];
        var tops = [20, 65, 5, 50, 35];
        var topIndex = 0;

        // var $archiveHolder = $('<ul>');
        // this.$el.find('.archive-holder').append($archiveHolder);
        for (var i = 0; i < data.length; i++) {
            startPercent = i * 20;
            sectionLength = config.data.sections[i].length;
            for (var j = 0; j < data[i].length; j++) {

                data[i][j].section = i + 1;
                // add an item to the archive holder...
                //$archiveHolder.append(mobileArchiveTemplate(data[i][j]));

                for (var k = 0; k < data[i][j].timecode.length; k++) {
                    start = data[i][j].timecode[k].start;
                    currentPercent = (Math.floor(2000 * (start / sectionLength)) / 100) + startPercent;
                    var curTop = tops[topIndex];
                    curTop += Math.round(3 - (Math.random() * 6));
                    output += "<li data-id='" + data[i][j].id + "' data-section='" + (i + 1) + "' style='left:" + currentPercent + "%'><span style='top:" + curTop + "px;' class='dot " + data[i][j].media.typeSlug + "'></span></li>";
                    topIndex++;
                    if (topIndex == tops.length) {
                        topIndex = 0;
                    }
                }

            }
        }

        $container.html(output);
    },

    show: function(callback) {
        this.$el.show();
        this.$el.velocity({
            'opacity': 1
        }, 500, callback);
    },

    hide: function(callback) {
        this.$el.velocity({
            'opacity': 0
        }, 500, callback);

    },

    isVisible: function() {
        return this.$el.css('opacity') == 1;
    },


    render: function() {
        this.$el.html(template(config.data));
        var self = this;

        this.$el.swipe({
            //Generic swipe handler for all directions
            swipe: function(event, direction, distance, duration, fingerCount, fingerData) {
                if (direction == 'right') {
                    self.previousSection();
                } else if (direction == 'left') {
                    self.nextSection();
                }
            }
        });
    },

    windowResized: function() {
        this.setVideoPosition();

    },

    setVideoPosition: function(callback) {
        // return;
        // work out the positioning for the video - we want to maintain 16:9, without any video overspilling
        var viewportHeight = Math.min(document.documentElement.clientHeight, window.innerHeight || 0),
            viewportWidth = Math.min(document.documentElement.clientWidth, window.innerWidth || 0);


        // start by assuming video can fill width of browser
        var videoWidth = viewportWidth,
            videoHeight = Math.floor(viewportWidth * 9 / 16);


        //alert(viewportHeight);
        // setTimeout(function() {
        //     $archiveHolder.css('height', (viewportHeight - $archiveHolder.position().top) + "px").show();
        // }, 1000);
        // if the height of the video is greater than the height of the viewport, we need to recalculate the video size
        // and show black bars to the left and right of the video

        if (videoHeight > viewportHeight) {
            videoHeight = viewportHeight;
            videoWidth = Math.floor(videoHeight * 16 / 9);
        }

        var $archiveHolder = this.$el.find('.archive-holder');

        $archiveHolder.css('top', (videoHeight + 90) + "px").css("bottom", 0);

        this.$('#main-player, .mejs-container').css("width", videoWidth + "px");
        this.$('#main-player, .mejs-container').css("height", videoHeight + "px");



        // so now we know the width and height of the video, and can adjust position
        var marginLeft = Math.floor((viewportWidth - videoWidth) / 2),
            marginTop = Math.floor((viewportHeight - videoHeight) / 2);

        //  alert(videoHeight + "-" + marginTop);

        this.$('.mejs-container').css('margin-top', marginTop);
        this.$('#main-player').css('margin-left', marginLeft);
        this.$('.mejs-mediaelement').css('width', videoWidth + "px");


        if (callback) {
            callback.apply();
        }


        var leftCrossPosition = 8 + marginLeft + (videoWidth * 0.69);
        var topCrossPosition = 8 + marginTop + (videoHeight * 0.68);

        $('.toggle-close').css({
            top: topCrossPosition + "px",
            right: leftCrossPosition + "px"
        });

        $(".toggle-close-message").css({
            top: (topCrossPosition - 35) + "px",
            left: (marginLeft + 20) + "px"
        });

        $(".toggle-open-message").css({
            left: (marginLeft + 20) + "px"
        });

        // velocity({
        //     'margin-top': marginTop
        // }, 600, callback);
    },

    getPositionForNav: function() {

        return $(window).height() - 80;
    },


    videoCoverOn: function(callback) {
        this.$('.video-fade').fadeIn(callback);
    },

    videoCoverOff: function(callback) {
        this.$('.video-fade').fadeOut(callback);
    },

    toggleVideo: function(event) {
        if (event && $(event.target).hasClass('toggle-open-message') || $(event.target).parent().hasClass('toggle-open-message')) {
            return;
        }

        //alert("TOGGLE VIDEO YEAH");
        if (this.$el.find('.controls').hasClass('playing')) {
            Backbone.trigger('videoPause');
        } else {
            Backbone.trigger('videoPlay');
        }

    },



    videoPlaying: function() {
        this.stopGentleAnimation();
        if (this.inFacebook) {
            Backbone.trigger('hideFacebook');
        }
        this.$el.find('.controls').addClass('playing');
        // annoying bug - needs this to force the browser to redraw it on iPad
        this.$el.find('.controls-wrap').css('position', 'relative').css('position', 'absolute');

        this.$el.find('.toggle-controls').addClass('playing');
        this.$el.find('#notifications').removeClass('paused');
        this.$el.find('.toggle-open-message ').removeClass('paused');

        if (!this.scrubbing) {
            //console.log("Video playing and now hiding controls");
            this.hideControls();
        } else {
            // console.log("Scrubbing so not hiding controls");
        }
    },

    videoPaused: function() {
        this.$el.find('.controls').removeClass('playing');
        this.$el.find('.toggle-controls').removeClass('playing');
        this.$el.find('#notifications').addClass('paused');
        this.$el.find('.toggle-open-message').addClass('paused');

        // annoying bug - needs this to force the browser to redraw it on iPad
        this.$el.find('.controls-wrap').css('position', 'relative');
        var self = this;
        setTimeout(function() {
            self.$el.find('.controls-wrap').css('position', 'absolute');
        }, 1);

    },

    videoStarts: function() {
        var self = this;

        //   this.setVideoPosition ();

    },

    videoStops: function() {
        var self = this;


    },

    navClicked: function(event) {
        event.preventDefault();

        var trigger = $(event.currentTarget);
        var progressNumber = trigger.data('progress');

        Backbone.trigger('nav-clicked', progressNumber);
    }


});


// ----------------------------------------------------------------------------
// exports
//
module.exports = VideoView;