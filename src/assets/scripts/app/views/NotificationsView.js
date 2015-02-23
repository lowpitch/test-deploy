'use strict';

// ----------------------------------------------------------------------------
// Imports
//
var _ = require('underscore'),
    Backbone = require('backbone'),
    $ = require('jquery'),
    quietTemplate = require('../templates/quiet-notification.html'),
    ArchiveFactory = require('../util/ArchiveFactory'),
    config = require('../data-store/Config');



// ----------------------------------------------------------------------------
// NotificationsView
//
var NotificationsView = Backbone.View.extend({

    el: '#notifications',

    // events: {
    //     'click .notify': 'notificationClicked',
    // },
    //
    events: {
        'click .quiet': 'openArchiveOverlay',
        'click .facebooknotify': 'facebookClicked'
    },


    inQuietTime: false,

    showingTogglePrompt: false,


    initialize: function() {
        Backbone.on('videoTime', this.videoProgress, this);
        Backbone.on('notificationOn', this.showNotification, this);
        Backbone.on('notificationOff', this.hideNotification, this);

        // Backbone.on('dotOver', this.dotOver, this);
        // Backbone.on('dotOut', this.dotOut, this);
        Backbone.on('showArchive', this.showArchive, this);
        Backbone.on('hideArchive', this.hideArchive, this);

        // setup the quiet times
        this.quietTimes = this.getQuietTimes();
        this.togglePrompts = this.getTogglePrompts();
        this.archiveData = this.getArchiveData();

        this.showNotifications = false;
        this.render();
    },

    facebookClicked: function(event) {
        var element = $(event.currentTarget);
        var item = element.data('item');

        Backbone.trigger('showFacebook', item);

        element.hide();

        event.preventDefault();
        event.stopPropagation();
        return false;


    },

    openArchiveOverlay: function() {
        Backbone.trigger('openArchiveOverlayAtCurrentTime');
    },

    // notificationClicked: function (event) {
    //   var element = Backbone.$(event.currentTarget);
    //   var section = element.data('section');
    //   var id = element.data('section');
    //   Backbone.history.navigate ('/section/' + section + '/archive/' + id ,true);
    //   event.preventDefault ();
    // },

    dim: function() {
        this.$el.css('opacity', 0);
    },
    undim: function() {
        this.$el.css('opacity', 1);
    },
    showArchive: function() {
        this.$el.find('.holder').fadeIn();
    },

    hideArchive: function() {
        this.$el.find('.holder').fadeOut();
    },

    // dotOver: function(section, id) {

    //     this.$el.find('.holder').velocity({
    //         'opacity': 0
    //     }, {
    //         duration: 50
    //     })

    //     var newElement = Backbone.$(this.getMarkup({
    //         id: id,
    //         section: section
    //     }));
    //     this.$el.find('.over-holder').append(newElement);

    //     newElement.velocity({
    //         'opacity': 1
    //     }, {});
    // },

    // dotOut: function() {
    //     this.$el.find('.holder').velocity({
    //         'opacity': 1
    //     }, {
    //         delay: 300
    //     });
    //     this.$el.find('.over-holder').empty();
    // },

    setSection: function(sectionId) {

        // clear existing notifications
        this.$el.find('.holder').empty();
        this.sectionId = sectionId;
        this.startTimeOfSection = 0;
        for (var i = 1; i < this.sectionId; i++) {
            this.startTimeOfSection += config.data.sections[i - 1].length;
        }
        // console.log("Setting start tie of section to", this.startTimeOfSection);
        this.sectionData = this.getSectionData(sectionId);

        this.clearTogglePrompt();
        this.showingTogglePrompt = false;

    },

    render: function(data) {
        var template = _.template('<div class="holder"></div><div class="over-holder"></div>');

        data = data || {
            title: '',
            url: ''
        };
        this.$el.html(template(data));
    },

    getMarkup: function(info) {
        if (info.isFacebook) {
            return ArchiveFactory.getFacebookThumbnail(info);
        }
        return ArchiveFactory.getThumbnail(info);
    },

    showNotification: function(info) {
        // TODO: Create unique div's for each popup notification
        var data = {
            title: info.title,
            url: info.url
        };
        var $newEl = $(this.getMarkup(info));
        this.$el.find('.holder').append($newEl);

        if (info.isFacebook) {
            $newEl.data('item', info);
        }

        this.positionNotifications();
        $newEl.css('bottom', 0).velocity({
            opacity: 1
        });
    },

    hideNotification: function(info) {
        var self = this;
        this.$el.find('.notify' + info.id).addClass('removing').velocity({
            opacity: 0
                // bottom: -200
        }, function() {
            Backbone.$(this).remove();
            //    self.positionNotifications();
        });
    },

    positionNotifications: function(el) {
        var currentX = -1,
            spacing = 20;

        this.$el.find('.holder .notify').each(function() {

            if (Backbone.$(this).hasClass('quiet') || Backbone.$(this).hasClass('removing')) {
                return;
            }
            if (currentX < 0) {
                currentX = parseInt(Backbone.$(this).css('left'), 10);
                // console.log(currentX);
                currentX = 0;

            }
            //  console.log ("Seting left to ", currentX);
            //Backbone.$(this).css ('left',currentX + "px");
            var animationDuration = Backbone.$(this).index() < Backbone.$(this).parent().children().length - 1 ? 0 : 300;

            animationDuration = 0;

            //  console.log ("Duration will be", animationDuration);
            Backbone.$(this).velocity({
                left: currentX
            }, {
                duration: animationDuration
            });
            var w = Backbone.$(this).width();
            if (w < 200) {
                w = 300;
            }
            currentX += spacing + w;
        })
    },

    getArchiveData: function() {
        return config.data.archive;
    },

    getQuietTimes: function() {
        return config.data.quiet;
    },

    getTogglePrompts: function() {
        return config.data.toggle_prompts;
    },

    getSectionData: function(sectionId) {
        // for timecode events to work the archive data must be in ascending timecode.start order
        return _.sortBy(config.data.archive[sectionId - 1], function(archive) {
            archive.section = sectionId;
            return archive.timecode.start;
        });
    },


    showQuietTime: function(item) {
        Backbone.trigger('showQuietTime', item);
        // this.$el.find('.holder').append(quietTemplate(item));
        // this.$el.find('.quiet').velocity({
        //     opacity: 1
        // });
    },

    clearQuietTime: function() {
        Backbone.trigger('clearQuietTime');
    },

    showTogglePrompt: function(item) {
        Backbone.trigger('showTogglePrompt', item);
    },

    clearTogglePrompt: function() {
        Backbone.trigger('clearTogglePrompt');
    },

    videoProgress: function(video) {
        var state, item, self = this,
            currentQuietTime,
            currentTogglePrompt,
            currentTime = video.currentTime;

        currentTime -= this.startTimeOfSection;

        var nowInQuietTime = false;
        _.each(this.quietTimes, function(time) {
            if (time.section == self.sectionId && currentTime >= time.start && currentTime <= time.end) {
                currentQuietTime = time;
                nowInQuietTime = true;
            }
        });

        // if we were in quiet time, and now we're not...
        if (this.inQuietTime && !nowInQuietTime) {
            this.clearQuietTime();
        }
        // or if we weren't in quiet time, but now we are...
        else if (nowInQuietTime && !this.inQuietTime) {
            this.showQuietTime(currentQuietTime);
        }

        var nowInPromptToggle = false;
        _.each(this.togglePrompts, function(time) {
            if (time.section == self.sectionId && currentTime >= time.start && currentTime <= time.end) {
                currentTogglePrompt = time;
                nowInPromptToggle = true;
            }
        });

        // if we were in quiet time, and now we're not...
        if (this.showingTogglePrompt && !nowInPromptToggle) {
            this.clearTogglePrompt();
        }
        // or if we weren't in quiet time, but now we are...
        else if (nowInPromptToggle && !this.showingTogglePrompt) {
            this.showTogglePrompt(currentTogglePrompt);
        }

        // Check archive config timecodes against current time to see if notifications should be shown
        _.each(this.sectionData, function(archive) {
            state = false;
            item = archive;
            // if (item.showThumbnail) {
            // archive items may have multiple time codes, and so we need to check them all
            for (var i = 0; i < archive.timecode.length; i++) {
                if (archive.timecode[i].showThumb && currentTime > archive.timecode[i].start && currentTime < archive.timecode[i].end) {

                    state = true;
                }
            }
            //  }
            if (video.currentTime > 0) {

                self.notificationState(state, item);
            }

            return currentTime > archive.timecode.start && currentTime < archive.timecode.end !== true;
        });

        var count = 0;
        _.each(config.data.fb, function(fb) {
            count++;
            state = false;
            item = fb;

            if (item.show) {
                item.isFacebook = true;

                item.id = "fb" + count;

                if (self.sectionId == Math.round(fb.section) && currentTime > fb.start && (currentTime < fb.end)) {
                    state = true;
                    //            Backbone.trigger('showFacebook', fb);
                }

                if (video.currentTime > 0) {

                    self.notificationState(state, item);
                }
            }


        });


        // if (Math.abs(this.lastTime - currentTime) < 2) {
        //     _.each(config.data.fb, function(fb) {
        //         if (fb.section == self.sectionId && self.lastTime < fb.start && currentTime > fb.start) {
        // //            Backbone.trigger('showFacebook', fb);
        //         }

        //     });
        // }

        this.inQuietTime = nowInQuietTime;
        this.showingTogglePrompt = nowInPromptToggle;

        this.lastTime = currentTime;

    },

    stateCurrent: {},
    statePrevious: {},
    notificationState: function(state, item) {
        // Fires the on/off event for each notifcation once

        this.stateCurrent[item.id] = state;

        if (this.stateCurrent[item.id] !== this.statePrevious[item.id]) {
            this.statePrevious[item.id] = this.stateCurrent[item.id];

            if (state) {
                Backbone.trigger('notificationOn', item);
            } else {
                Backbone.trigger('notificationOff', item);
            }
        }
    }

});


// ----------------------------------------------------------------------------
// exports
//
module.exports = NotificationsView;