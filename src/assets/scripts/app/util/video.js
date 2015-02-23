'use strict';

// ----------------------------------------------------------------------------
// Imports
//
var $ = window.jQuery = require('jquery'),
    Backbone = require('backbone'),
    mejs = require('mejs'),
    config = require('../data-store/Config');



// ----------------------------------------------------------------------------
// Video
//
var Video = {
    initialize: function(args) {
        this.player = new VideoModule(args);
    },
    loadVideo: function(data) {

    }
};

var VideoModule = function(args) {

    var files = {
        vo: {
            stream: "http://player.vimeo.com/external/112518312.m3u8?p=high,standard,mobile&s=315487ae75a55dbbcddfc3c2112ad76f",
            small: "http://player.vimeo.com/external/112518312.mobile.mp4?s=187f852624e3695436848ace7c9735e1",
            medium: "http://player.vimeo.com/external/112518312.sd.mp4?s=66a6c1dec8715406c9755671e33b0060",
            large: "http://player.vimeo.com/external/112518312.hd.mp4?s=eb39eb20a0dc076b26c58ad409dadc8a"
        },

        novo: {
            stream: "http://player.vimeo.com/external/112569331.m3u8?p=high,standard,mobile&s=227003c8844b28922d6b65d8da101f09",
            small: "http://player.vimeo.com/external/112569331.mobile.mp4?s=e16efebf3f66242a2b8fe6a56f1a0c0e",
            medium: "http://player.vimeo.com/external/112569331.sd.mp4?s=f996c27362b30190a21c946389a7e6c6",
            large: "http://player.vimeo.com/external/112569331.hd.mp4?s=ed7f9c3bd5e400c0be97b091e5a4bb94"
        }
    }

    var whichVideo = "vo";

    // ::: Private
    var self = this,
        ready = false,
        pendingPlay = false,
        mejsPlayer = false,
        forcePosition = -1,
        theElement = null,
        pendingPercent = -1,
        switchTime = -1,
        iOSPercent = -1,
        iOSDoneOnce = false,

        init = function() {
            setupVideo();
            setupEvents();


        },

        setupVideo = function() {
            //console.log("Setting up video");
            // MediaElementJS - http://mediaelementjs.com/#api
            mejs.MediaFeatures.init();
            var mode = "auto";
            if (mejs.MediaFeatures.isIE || !!navigator.userAgent.match(/Trident.*rv[ :]*11\./)) {
                mode = "auto_plugin";
            }
            window.player = mejsPlayer = new mejs.MediaElementPlayer('#main-player', {

                // "auto_plugin" means it defaults to flash/silverlight even if html5 is available
                // mode: 'auto_plugin',

                mode: mode,

                pluginPath: '/assets/plugins/',

                defaultVideoWidth: '100%',

                defaultVideoHeight: '100%',

                enableAutosize: false,

                autoRewind: false,

                timerRate: 150,
                keyActions: [],

                features: [], // default set ['playpause','progress','current','duration','tracks','volume','fullscreen'],

                success: function(mediaElement, domObject) {

                    theElement = mediaElement;

                    ready = true;

                    //console.log('Video plugin:', mediaElement.pluginType);

                    self.loadVideo(1);

                    Backbone.trigger('videoReady');

                    mediaElement.pause();



                    Backbone.on('toggleVideo', function(showVO) {
                        switchTime = theElement.currentTime;
                        whichVideo = showVO ? "vo" : "novo";
                        self.loadVideo(1);
                    })

                    Backbone.on('muteAudio', function() {
                        mediaElement.setVolume(0);
                        Backbone.trigger('audioMuted');
                    })

                    Backbone.on('unmuteAudio', function() {
                        mediaElement.setVolume(1);
                        Backbone.trigger('audioUnmuted');
                    })


                    mediaElement.addEventListener('timeupdate', function(e, f, g) {
                        //  console.log(mediaElement.currentTime);
                        Backbone.trigger('videoTime', mediaElement);
                        // TODO: debug only - remove
                        // $('#current-time').html(mediaElement.currentTime);
                    }, false);


                    mediaElement.addEventListener('play', function(a, b, c) {
                        // console.log("Play received");
                        Backbone.trigger('mediaPlay');
                    }, false);

                    mediaElement.addEventListener('pause', function(a, b, c) {
                        // console.log("Pause received");
                        Backbone.trigger('mediaPause');
                        Backbone.trigger('mediaBuffered');
                    }, false);

                    mediaElement.addEventListener('waiting', function(a, b, c) {
                        //alert("STARTING TO BUFFER!");
                        // console.log("Starting to buffer", mediaElement.currentTime);
                        Backbone.trigger('mediaBuffering');
                    }, false);

                    mediaElement.addEventListener('canplay', function(a, b, c) {
                        // console.log("CAN PLAY!");
                        if (switchTime > -1) {
                            if (theElement.pluginType == 'native') {

                                theElement.currentTime = (switchTime);
                                switchTime = -1;
                            } else {
                                //  mejsPlayer.setCurrentTime(forcePosition);
                            }


                        }
                    }, false);



                    mediaElement.addEventListener('playing', function(a, b, c) {
                        //   console.log("Playing", switchTime, forcePosition, mediaElement.currentTime);
                        // alert("PLAYING " + iOSPercent + "," + switchTime + "," + forcePosition + "," + mediaElement.currentTime + "," + mediaElement.duration);
                        //
                        if (iOSPercent > -1) {
                            Backbone.trigger('videoScrub', iOSPercent);
                            iOSPercent = -1;

                            return;
                        }
                        if (mediaElement.currentTime == 0 && forcePosition > -1) {
                            if (theElement.pluginType === 'native') {
                                //alert("SETTING CURRENT TIME TO" + forcePosition);
                                theElement.currentTime = (forcePosition);
                                //console.log("Setting current time to ", (theElement.duration * (percent / 100)));
                            } else {
                                mejsPlayer.setCurrentTime(forcePosition);
                                // console.log("Setting flash current time to ", (mejsPlayer.media.duration * (percent / 100)));
                            }
                            forcePosition = -1;
                        }

                        if (switchTime > -1) {
                            if (theElement.pluginType != 'native') {


                                mejsPlayer.setCurrentTime(switchTime);
                                switchTime = -1;
                            }


                        }


                        Backbone.trigger('mediaBuffered');
                    }, false);

                    if (pendingPlay) {
                        pendingPlay = false;
                        Backbone.trigger('videoPlay');
                    }

                    if (pendingPercent > -1) {
                        // console.log("Pending percent is big so doing stuff");
                        var percent = pendingPercent;
                        pendingPercent = -1;
                        Backbone.trigger('videoScrub', percent);

                    }

                    mediaElement.addEventListener('loadedmetadata', function(a, b, c) {
                        // console.log("LOaded metadata!", pendingPercent);
                        if (pendingPercent > -1) {
                            var percent = pendingPercent;
                            pendingPercent = -1;
                            Backbone.trigger('videoScrub', percent, true);
                        }
                    }, false);

                }
            });
            // mejsPlayer.media.onwaiting = function() {
            //     alert("YEAH");
            // }
            // console.log(mejsPlayer);

        },



        getDeviceSize = function() {

            var size = 'medium'; // default

            // We are only using matchMedia to check for device width when offereing
            // progressive download files. If the browser doesn't support matchMedia
            // it's likely to be an older browser and more likley have flash where we
            // use HLS streaming

            // This is why I didn't add Paul Irish's matchMedia pollyfill

            if (window.matchMedia) {

                var isSmall = window.matchMedia('(max-width: 767px)').matches,
                    isMedium = window.matchMedia('(min-width: 768px)').matches,
                    isLarge = window.matchMedia('(min-width: 1000px)').matches;

                if (isSmall) {
                    size = 'small'
                } else if (!isSmall && !isLarge) {
                    size = 'medium'
                } else if (isLarge) {
                    size = 'large'
                }

            }

            return size;
        },

        setupEvents = function() {

            Backbone.on('videoPlay videoPlayOnly', function() {
                if (!ready) {
                    // console.log("Not ready, so set pending");
                    pendingPlay = true;
                } else {
                    // console.log("Video is ready, so call play!");
                    forcePosition = theElement.currentTime;

                    mejsPlayer.play();
                }
            });

            Backbone.on('videoPlayNonMobile', function() {
                if (getDeviceSize() != 'small') {
                    // console.log("Playing because not on mobile");
                    Backbone.trigger('videoPlay');
                } else {
                    // console.log("Not playing because on mobile");
                }
            });

            Backbone.on('videoPause videoPauseOnly', function() {
                // console.log("Pausing video");
                mejsPlayer.pause();
            });

            Backbone.on('videoScrub', function(percent, forcePercent) {

                //console.log("Video scrum received", percent, theElement);
                if (!ready || isNaN(theElement.duration) || theElement.duration == 0) {
                    // alert("RETURNING SO NOT READY, SETTING PENDING TO " + percent);
                    //console.log("Returning for some reason", ready, theElement, theElement ? theElement.duration : null);
                    pendingPercent = percent;
                } else {
                    //console.log("The duration is", theElement.duration, mejsPlayer.media.duration);
                    //    //console.log("Setting current time to ", (theElement.duration * (percent / 100)));
                    //mejsPlayer.setCurrentTime (mejsPlayer.media.duration * (percent / 100));
                    //alert("NOW READY, WITH VALUES " + percent + "," + forcePercent);

                    if (mejs.MediaFeatures.isiPhone && !iOSDoneOnce) {
                        // iOSDoneOnce = true;
                        iOSPercent = percent;
                    }
                    //console.log("Trying to set percent to ", percent, theElement.duration);
                    if (percent > 0 || forcePercent) {
                        if (theElement.pluginType === 'native') {
                            // console.log("Setting time to", (theElement.duration * (percent / 100)));
                            theElement.currentTime = (theElement.duration * (percent / 100));
                            // console.log("Setting current time to ", (theElement.duration * (percent / 100)));
                        } else {
                            mejsPlayer.setCurrentTime(mejsPlayer.media.duration * (percent / 100));
                            // console.log("Setting flash current time to ", (mejsPlayer.media.duration * (percent / 100)));
                        }
                    }


                }
            });

        };

    this.loadVideo = function(sectionId) {

        if (sectionId < 0) {
            return;
        }
        if (!theElement) {
            // console.log("Returning because theElement is null1");
            return;
        }

        var currentStream;

        //console.log("Loading video now2", sectionId);
        //http://player.vimeo.com/external/112216167.hd.mp4?s=34d5409c0bbe4b9d04f44c5c09ff63ac
        //
        // We use flash/silverlight by default because it allows us to use
        // HLS streaming from Vimeo which does all the nice bandwidth checking etc

        // When flash or sliverlight is not avaliable we will give them a s/m/l
        // progressive download file depending on the device width
        if (theElement.pluginType === 'native') {

            //      alert("Setting video");
            // TODO: set section dynamically from route
            //var data = config.data.sections[sectionId - 1].video,
            var data = files[whichVideo],
                currentStream = data[getDeviceSize()];

            // video with no VO - http://player.vimeo.com/external/112569331.hd.mp4?s=ed7f9c3bd5e400c0be97b091e5a4bb94
            //   currentStream = "http://player.vimeo.com/external/112518312.hd.mp4?s=eb39eb20a0dc076b26c58ad409dadc8a";
            if (theElement.src != currentStream) {

                // console.log("Setting stream to...", currentStream);
                // Start progressive download stream
                theElement.setSrc(currentStream);



                theElement.play();


            }
        } else {
            var data = files[whichVideo],
                // currentStream = data["stream"];
                currentStream = data["stream"];
            if (theElement.src != currentStream) {

                // console.log("Setting stream to...", currentStream);
                // Start progressive download stream
                theElement.setSrc(currentStream);

                theElement.play();
            }

        }


    };

    init(); //let's begin
};



// ----------------------------------------------------------------------------
// exports
//
module.exports = Video;