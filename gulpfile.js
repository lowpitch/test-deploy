var gulp = require('gulp');

// Gulp plugins
var nodemon = require('gulp-nodemon'),
    preprocess = require('gulp-preprocess'),
    stylus = require('gulp-stylus'),
    nib = require('nib'),
    rimraf = require('gulp-rimraf'), // like clean
    gutil = require('gulp-util'),
    rename = require('gulp-rename'),
    gitinfo = require('gulp-gitinfo'),
    htmlmin = require('gulp-htmlmin'),
    gulpFilter = require('gulp-filter'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    fs = require('fs'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    es = require('event-stream'),
    runSequence = require('run-sequence');

// Gulp paths
var paths = {
    dist: {
        base: 'dist/',
        local: 'dist/local',
        dev: 'dist/dev/',
        staging: 'dist/staging/',
        production: 'dist/production/',
        css: '/assets/css/',
        js: '/assets/js/',
        plugins: '/assets/plugins/',
        fonts: '/assets/fonts/',
        images: '/assets/images/',
        media: '/assets/media/',
    },
    config: 'config.json',
    html: 'src/*.html',
    plugins: 'src/assets/plugins/*',
    images: 'src/assets/images/*',
    media: 'src/assets/media/**',
    fonts: 'src/assets/fonts/*',
    styles: 'src/assets/styl/*.styl',
    allStyles: 'src/assets/styl/**/*.styl',
    scripts: 'src/assets/scripts/app.js',
    allScripts: 'src/assets/scripts/**/*.js',
    templates: 'src/assets/scripts/app/templates/**/*.html'
};

var ENV = {
    LOCAL: 'local',
    DEV: 'dev',
    STAGING: 'staging',
    PRODUCTION: 'production',
};

var ENVIRONMENT = ENV.LOCAL; // default is local
var GIT_HASH = ''; // storage for the current git short hash



function errorLog(err) {
    console.log(err);
    console.log(err.stack);
}

function getGitHash(callback) {
    gitinfo().pipe(es.map(function(data, cb) {
        GIT_HASH = data['local.branch.current.shortSHA'];
        callback(data['local.branch.current.shortSHA']);
    }));
}

function getConfigAsString(callback) {
    // use fs instead of require so it doesn't chache
    fs.readFile('./config.json', 'utf8', function(err, data) {
        callback(data);
    });
}



// Tasks
gulp.task('preprocess', function() {

    function begin(configData) {

        var isLocal = ENVIRONMENT === 'local',
            config = {
                removeComments: true,
                collapseWhitespace: true,
                minifyJS: true
            },
            context = {
                context: {
                    NODE_ENV: ENVIRONMENT,
                    versionHash: GIT_HASH,
                    configJSON: configData
                }
            },
            filter = ['!*', 'index.html'];

        gulp.src(paths.html)
            .pipe(!isLocal ? gulpFilter(filter) : gutil.noop())
            .pipe(preprocess(context))
            .pipe(!isLocal ? htmlmin(config) : gutil.noop())
            .pipe(gulp.dest(paths.dist[ENVIRONMENT]));
    }

    getConfigAsString(function(data) {
        begin(data);
    });

});

gulp.task('stylus', function() {

    var localConfig = {
            compress: false,
            linenos: true,
            use: [nib()]
        },
        distConfig = {
            compress: true,
            use: [nib()]
        },
        renameConfig = {
            suffix: '.' + GIT_HASH + '.min'
        },
        stylusConfig = ENVIRONMENT === 'local' ? localConfig : distConfig;

    gulp.src(paths.styles)
        .pipe(stylus(stylusConfig))
        .on('error', gutil.beep)
        .on('error', errorLog)
        .pipe(ENVIRONMENT !== 'local' ? rename(renameConfig) : gutil.noop())
        .pipe(gulp.dest(paths.dist[ENVIRONMENT] + paths.dist.css))

});

gulp.task('browserify', function() {

    console.log("Browserify");

    var tplTransform = require('node-underscorify').transform({
        extensions: ['ejs', 'html']
    });

    var mainFilePath = './' + paths.scripts, // path has to be relative
        renameConfig = {
            suffix: '.' + GIT_HASH + '.min'
        },
        isLocal = ENVIRONMENT === 'local';

    browserify({
            entries: [mainFilePath],
            debug: true
        }).transform(tplTransform)
        // .bundle({ debug: true }) // -- Turning off debug because it slows down local dev and it just annoying...
        .bundle({})
        .on('error', gutil.beep)
        .on('error', errorLog)
        .pipe(source('scripts.js'))
        .pipe(buffer())
        .pipe(!isLocal ? uglify() : gutil.noop())
        .pipe(!isLocal ? rename(renameConfig) : gutil.noop())
        .pipe(gulp.dest(paths.dist[ENVIRONMENT] + paths.dist.js));

});

gulp.task('copyAssets', function() {

    // copy plugins
    gulp.src(paths.plugins)
        .pipe(gulp.dest(paths.dist[ENVIRONMENT] + paths.dist.plugins))

    // copy fonts
    gulp.src(paths.fonts)
        .pipe(gulp.dest(paths.dist[ENVIRONMENT] + paths.dist.fonts))

    // copy images
    gulp.src(paths.images)
        .pipe(gulp.dest(paths.dist[ENVIRONMENT] + paths.dist.images))

    // copy media
    gulp.src(paths.media)
        .pipe(gulp.dest(paths.dist[ENVIRONMENT] + paths.dist.media))

});

gulp.task('clean', function() {

    gulp.src(paths.dist[ENVIRONMENT])
        .pipe(rimraf({
            force: true
        }));

});



// run the server
gulp.task('server', function() {
    nodemon({
        script: 'server.js'
    });
});



// Default Task
gulp.task('default', function() {

    ENVIRONMENT = ENV.LOCAL;

    gulp.start('build');

    gulp.watch(paths.allStyles, ['stylus']);
    gulp.watch(paths.allScripts, ['browserify']);
    gulp.watch(paths.templates, ['browserify']);
    gulp.watch(paths.html, ['preprocess']);
    gulp.watch(paths.config, ['preprocess']);
    gulp.watch(paths.plugins, ['copyAssets']);
    gulp.watch(paths.images, ['copyAssets']);
    gulp.watch(paths.media, ['copyAssets']);
    gulp.watch(paths.fonts, ['copyAssets']);

});

gulp.task('test', function() {
    // no-op for jenkins test job
});

gulp.task('dev', function() {
    ENVIRONMENT = ENV.DEV;
    // wait for git hash before we run the build
    getGitHash(function() {
        gulp.start('build');
    });
});

gulp.task('staging', function() {
    ENVIRONMENT = ENV.STAGING;
    getGitHash(function() {
        gulp.start('build');
    });
});

gulp.task('production', function() {
    ENVIRONMENT = ENV.PRODUCTION;
    getGitHash(function() {
        gulp.start('build');
    });
});

gulp.task('build', ['browserify', 'copyAssets', 'stylus', 'preprocess'])