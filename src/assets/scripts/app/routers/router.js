'use strict';

// ----------------------------------------------------------------------------
// Imports
//
var _ = require('underscore'),
    Backbone = require('backbone'),
    NavView = require('../views/NavView'),
    MobileNavView = require('../views/MobileNavView'),
    HomeView = require('../views/HomeView'),
    AboutView = require('../views/AboutView'),
    GalleryView = require('../views/GalleryView'),
    HeaderView = require('../views/HeaderView'),
    VideoView = require('../views/VideoView'),
    SectionView = require('../views/SectionView'),
    FacebookView = require('../views/FacebookView'),
    ArchiveView = require('../views/ArchiveView');


var timeoutHolder;

var firstRoute = true;


// ----------------------------------------------------------------------------
// Main App router
//
var Router = Backbone.Router.extend({

    routes: {
        '/': 'home',
        'section': 'home',
        'about': 'about',
        'section/:id': 'section',
        'section/:id/play': 'play',
        'section/:id/archive/:id': 'archive',
        '*actions': 'home', // Default - catch all
    },

    initialize: function() {

        // keep track of the section we're currently within...
        this.currentSection = -1;

        this.listenTo(this, 'route', this.afterRouteChange);
        Backbone.on('enterVideoMode', this.enterVideoMode, this);
        Backbone.on('exitVideoMode', this.exitVideoMode, this);
        Backbone.on('nav-clicked', this.navItemClicked, this);
        Backbone.on('sendAnalytics', this.sendAnalytics, this);
        Backbone.on('mobile-nav-clicked', this.mobileNavItemClicked, this);
        // setup all the main views
        this.headerView = new HeaderView();
        this.nav = new NavView();
        this.mobileNav = new MobileNavView();
        this.homeView = new HomeView();
        this.aboutView = new AboutView();
        this.videoView = new VideoView();
        this.archiveView = new ArchiveView();
        this.facebookView = new FacebookView();
        this.sectionView = new SectionView();
        this.galleryView = new GalleryView();


        // lookup table

        this.views = {
            home: this.homeView,
            video: this.videoView,
            archive: this.archiveView,
            section: this.sectionView,
            about: this.aboutView,
        };

        this.initialView = true;
    },

    home: function() {
        var self = this;

        self.changeView('home', -1, function() {
            firstRoute = false;
            document.title = "Homepage - Footballers United";
            Backbone.trigger('sendAnalytics');
        });
    },

    about: function() {
        var self = this;

        self.changeView('about', -1, function() {
            firstRoute = false;
            document.title = "About the project - Footballers United";
            document.getElementById('pals-app').scrollTop = 0;
            Backbone.trigger('sendAnalytics');
        });
    },


    section: function(id) {
        var self = this;

        self.changeView('section', id, function(isNewRoute) {
            //console.log("Showing section route for the first time?", isNewRoute);

            document.title = "Chapter " + id + " - Footballers United";
            Backbone.trigger('sendAnalytics');
            if (!isNewRoute) {

                self.sectionView.options = {
                    sectionId: id
                };
                self.sectionView.forceUpdate();
                // self.sectionView.hide(function() {
                //     self.sectionView.options = {
                //         sectionId: id
                //     };
                //     self.sectionView.render();
                //     self.sectionView.show();
                // })
            } else {
                self.sectionView.options = {
                    sectionId: id
                };
                self.sectionView.render();
            }
            firstRoute = false;

        });
    },

    play: function(id) {
        var self = this;
        self.changeView('video', id, function() {
            firstRoute = false;
            document.title = "Chapter " + id + " - Footballers United";
            Backbone.trigger('sendAnalytics');
            Backbone.trigger('activeViewUpdated', self.videoView, self.currentView);
            Backbone.trigger('videoPlayNonMobile');
        });

        this.nav.hide();
    },

    archive: function(sectionId, id) {
        var self = this;


        self.changeView('archive', sectionId, function() {
            Backbone.trigger('sendAnalytics');
            self.archiveView.scrollTo(id);
            document.title = "Chapter " + sectionId + " Archive - Footballers United";


            if (firstRoute) {
                self.archiveView.firstRoute(true);
                firstRoute = false;
            } else {
                self.archiveView.firstRoute(false);
            }

        });
    },

    sendAnalytics: function() {
        clearTimeout(timeoutHolder);
        timeoutHolder = setTimeout(function() {
            ga('send', 'pageview', {
                'page': window.location,
                'title': document.title
            });
        }, 300);

    },

    afterRouteChange: function(callback, args) {
        // this is called AFTER each route change



        // Scroll page to the top on all route changes
        Backbone.$('html, body').animate({
            scrollTop: 0
        });
    },

    navItemClicked: function(which_nav) {
        switch (this.currentView) {
            case 'home':
            case 'section':
            default:
                Backbone.history.navigate('/section/' + which_nav, true);
                break;
                // case 'video':
                //     Backbone.history.navigate('/section/' + which_nav + "/play", true);
                //     break;
        }
    },

    mobileNavItemClicked: function(which_nav) {
        Backbone.history.navigate('/section/' + which_nav, true);
    },

    enterVideoMode: function() {
        //console.log("enterVideoMode");
        // this.videoView.show ();
        //  // hide all views apart from the video
        // this.homeView.hide ();
        // this.sectionView.hide ();
        // this.archiveView.hide ();

        //  this.initialView = true;
    },

    exitVideoMode: function() {
        this.videoView.resetVideoPosition();
    },

    changeView: function(route, sectionId, callback) {
        var callbackOnce = _.once(callback);
        var viewToShow = null;
        var isNewRoute = (this.currentView != route);
        var self = this;

        Backbone.trigger('closeFacebook');
        Backbone.trigger('hideGallery');
        // hide the mobile nav
        this.mobileNav.navigating();

        var overwrittenCallback = _.once(function() {
            if (viewToShow) {
                viewToShow.show();
                Backbone.trigger('activeViewUpdated', viewToShow, route);
            }
            callback.apply(self, [isNewRoute]);
        });

        // see if we are moving to a new section - if so, we need to update the nav
        if (sectionId != this.currentSection) {
            this.currentSection = sectionId;
            this.nav.sectionChanged(sectionId);

            Backbone.trigger('sectionChanged', sectionId);
        }

        this.currentView = route;

        // see if we need to pause the video
        if (route != 'video') {
            Backbone.trigger('videoPause');
            Backbone.trigger('videoInactive');
        } else {
            Backbone.trigger('videoActive');
        }


        var hidAnyViews = false;

        this.videoView.isInArchive(route == "archive");

        for (var each in this.views) {
            if (each == route) {
                viewToShow = this.views[each];
            } else {
                if (route == "archive" && each == "video") {
                    // skip this case
                    // show the video video
                    this.views[each].show();
                } else {

                    if (this.views[each].isVisible()) {
                        this.views[each].hide(overwrittenCallback);
                        hidAnyViews = true;
                    }
                }

            }
        }

        // if we didn't hide any views, call the callback anyway...
        if (!hidAnyViews) {
            overwrittenCallback.apply(self, [isNewRoute]);
        }



    },

    // changeView: function (route, callback) {
    //     // clear old views and calls back when everything has finished animating

    //     // TODO: Refactor this its very verbose
    //     var callbackOnce = _.once(callback);

    //     console.log ("Changing route", route);

    //     if (route === 'home') {

    //         Backbone.trigger('videoPause');

    //         if (this.sectionView.isVisible()) {
    //             this.sectionView.hide(callbackOnce);
    //         }

    //         if (this.archiveView.isVisible()) {
    //             this.archiveView.hide(callbackOnce);
    //         }

    //         if (this.videoView.isVisible()) {
    //             this.videoView.hide(callbackOnce);
    //         }


    //     }

    //     if (route === 'section') {

    //         Backbone.trigger('videoPause');

    //         if (this.homeView.isVisible()) {
    //             console.log ("YEP1");
    //             this.homeView.hide(callbackOnce);
    //         }

    //         if (this.archiveView.isVisible()) {
    //             console.log ("YEP2");
    //             this.archiveView.hide(callbackOnce);
    //         }

    //         if (this.videoView.isVisible()) {
    //             console.log ("YEP3");
    //             this.videoView.hide(callbackOnce);
    //         }


    //     }

    //     if (route === 'archive') {
    //         if (this.homeView.isVisible()) {
    //             this.homeView.hide(callbackOnce);
    //         }

    //         if (this.sectionView.isVisible()) {
    //             this.sectionView.hide(callbackOnce);
    //         }
    //     }

    //     if (route == 'video') {
    //         if (this.homeView.isVisible()) {
    //             this.homeView.hide(callbackOnce);
    //         }

    //         if (this.sectionView.isVisible()) {
    //             this.sectionView.hide(callbackOnce);
    //         }

    //         if (this.archiveView.isVisible()) {
    //             this.archiveView.hide(callbackOnce);
    //         }

    //     }

    //     // When app first loads no view is visible
    //     // kick start the app
    //     if (this.initialView) {
    //         callbackOnce();
    //         this.initialView = false;
    //     }
    // }

});


// ----------------------------------------------------------------------------
// exports
//
module.exports = Router;