var pkg = {
        http: require('http'),
        fs: require('fs'),
        socket_io: require('socket.io')
    };


function Connect( req, res )
{
    var file = pkg.fs.readFileSync( __dirname + '/chat.html' );
    res.writeHead(200);
    res.end(file);
};

function fnMain()
{
    var server = pkg.http.createServer( Connect ),
        sio = pkg.socket_io.listen( server ),
        conn = 0,
        users = {},
        evts = {
            'message': function( chunk )
            {
                if( chunk.usr && chunk.msg )
                {
                    var who = undefined;
                    
                    chunk.date = Date.now();
                    users['@'+chunk.usr] = this.id;
                    if( typeof chunk.msg === 'string' &&
                        ( who = chunk.msg.match( /@[a-z0-9]+/ig ) ) )
                    {
                        var target;
                        chunk.private = 1;
                        who.forEach(function(usr)
                        {
                            target = sio.sockets.sockets[users[usr]];
                            if( target ){
                                target.emit( 'message', chunk );
                            }
                        });
                    }
                    else {
                        this.broadcast.emit( 'message', chunk );
                    }
                    this.emit( 'message', chunk );
                }
            }
        };
    
    server.listen( 8080 );
    sio
    .on('connection',function( sock )
    {
        console.log( 'connected' );
        conn++;
        // console.log( sio );
        // add events
        for( var ev in evts ){
            sock.on( ev, evts[ev] );
        }
        sock.emit( 'connected', { 
            status: 'ok', 
            date: Date.now()
        });
        sock.broadcast.emit( 'who', {
            who: conn
        });
        sock.emit( 'who', {
            who: conn
        });
        
        sock.on( 'disconnect', function()
        {
            console.log( 'disconnect' );
            conn--;
            sio.sockets.emit('who', {
                who: conn
            });
        });
        // console.log( sock );
    })
}

fnMain();