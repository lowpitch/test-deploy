

    // Imports
    // ----------------
    var express    = require( 'express' ),
        morgan     = require( 'morgan' ),
        request    = require( 'request' ),
        localPath  = __dirname + '/dist/local/',
        devPath    = __dirname + '/dist/dev/',
        mediaPath  = 'http://pals-shared-media.s3-eu-west-1.amazonaws.com/media';


    var mediaProxy = function( req, res ) {
        // all request that go through /media proxy to aws
        var url = mediaPath + req.url;
        req.pipe( request(url) ).pipe( res );
    };


    // local server
    var localServer = express();

    localServer.use( morgan('dev') );
    localServer.use( express.static(localPath) );
    localServer.use( '/media', mediaProxy );
    localServer.listen( 3000 );

    console.log( 'Started Server on: http://localhost:3000' );


    // dev local server
    var devServer = express();

    devServer.use( morgan('dev') );
    devServer.use( express.static(devPath) );
    devServer.use( '/media', mediaProxy );
    devServer.listen( 3333 );

    console.log( 'Started Server on: http://localhost:3333' );

