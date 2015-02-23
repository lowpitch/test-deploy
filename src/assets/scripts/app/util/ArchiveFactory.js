'use strict';

// ----------------------------------------------------------------------------
// Imports
//
var $ = window.jQuery = require('jquery'),
    Backbone = require('backbone'),
    itemTemplate = require('../templates/archive-item.html'),
    galleryTemplate = require('../templates/archive-gallery-item.html'),
    videoTemplate = require('../templates/archive-video-item.html'),
    thumbnailTemplate = require('../templates/archive-item-thumbnail.html'),
    facebookThumbnailTemplate = require('../templates/facebook-item-thumbnail.html'),
    basicThumbnailTemplate = require('../templates/archive-item-basic-thumbnail.html');



// ----------------------------------------------------------------------------
// ArchiveFactory
//
var ArchiveFactory = {
    getThumbnail: function(data) {
        var itemType = data.media.typeSlug;
        switch (itemType) {
            default: return thumbnailTemplate(data);
            break;
        }
    },

    getFacebookThumbnail: function(data) {
        return facebookThumbnailTemplate(data);
    },

    getBasicThumbnail: function(data) {
        var itemType = data.media.typeSlug;
        switch (itemType) {
            default: return basicThumbnailTemplate(data);
            break;
        }
    },

    getFullContent: function(data) {
        var itemType = data.media.typeSlug;
        switch (itemType) {
            case 'gallery':
                return galleryTemplate(data);
                break;
            case 'video':
                return videoTemplate(data);
                break;
            default:
                return itemTemplate(data);
                break;
        }
    }
};


// ----------------------------------------------------------------------------
// exports
//
module.exports = ArchiveFactory;