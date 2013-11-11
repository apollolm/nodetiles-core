var fs = require('fs'),
    Map = require('./projector'),
    Projector = require('./projector');

/** 
 * Map tile routing 
 * :zoom/:col/:row.png routing
 */
module.exports.tilePng = function tilePng(options){
  var options = options || {},
      map = options.map;
      
  if (!options.map) {
    throw new Error("You must set options.map equal to your map");
  }
  
  return function tilePng(req, res, next){
    var tileCoordinate, bounds;
    // verify arguments
    tileCoordinate = req.path.match(/(\d+)\/(\d+)\/(\d+)\.png$/);
    if (!tileCoordinate) {
      return next();
    }
    // slice the regexp down to usable size      
    tileCoordinate = tileCoordinate.slice(1, 4).map(Number);

    if(!options.ignoreCached){
        body = cache.read(self, coord, format);
        tile_from = 'cache';
    }
    else{
        //Get from recently created tiles
        body = _getRecentTile(self, coord, format)
        tile_from = 'recent tiles'
    }

      //check to see if the tile exists in the cache already
    if (existsInCache(tileCoordinate) == true) {

    }
  
    // set the bounds and render
    bounds = Projector.util.tileToMeters(tileCoordinate[1], tileCoordinate[2], tileCoordinate[0]);
    map.render({
      bounds: {minX: bounds[0], minY: bounds[1], maxX: bounds[2], maxY: bounds[3]},
      width: 256,
      height: 256,
      zoom: tileCoordinate[0],
      callback: function(err, canvas) {
          // TODO: catche the error
        var stream = canvas.createPNGStream();
        stream.pipe(res);
      }
    });
  };
};



/** 
 * Map tile routing 
 * :zoom/:col/:row.png routing
 */
module.exports.tilePng2Disk = function tilePng(options) {
    //options.cachePath must be specified.
    var options = options || {},
        map = options.map;

    if (!options.map) {
        throw new Error("You must set options.map equal to your map");
    }

    if (!options.cachePath) {
        throw new Error("You must set options.cachePath equal to a valid folder to dump tiles into.  To stream only, use tilePng instead.");
    }

    return function tilePng(req, res, next) {
        var tileCoordinate, bounds;
        // verify arguments
        tileCoordinate = req.path.match(/(\d+)\/(\d+)\/(\d+)\.png$/);
        if (!tileCoordinate) {
            return next();
        }
        // slice the regexp down to usable size      
        tileCoordinate = tileCoordinate.slice(1, 4).map(Number);

        var tileName = req.path.split("/").join("-");

        //See if file exists on disk.  If so, then use it, otherwise, render it and respond.
        fs.stat(options.cachePath + tileName, function (err, stat) {
            if (!err) {
                fs.readFile(options.cachePath + '/' + tileName, function (err, contents) {
                    //serve file from disk
                    console.log("Serving " + tileName + " from disk.");
                    res.writeHead(200, { 'Content-Type': 'image/png' });
                    res.end(contents, 'binary');
                });
            } else {
                //either pull data from mongo or serve 404 error


                // set the bounds and render
                bounds = Projector.util.tileToMeters(tileCoordinate[1], tileCoordinate[2], tileCoordinate[0]);
                map.render({
                    bounds: { minX: bounds[0], minY: bounds[1], maxX: bounds[2], maxY: bounds[3] },
                    width: 256,
                    height: 256,
                    zoom: tileCoordinate[0],
                    callback: function (err, canvas) {
                        // TODO: catche the error
                        var stream = canvas.createPNGStream();
                        stream.pipe(res);

                        var out = fs.createWriteStream(options.cachePath + '/' + tileName)

                        stream.on('data', function (chunk) {
                            out.write(chunk);
                        });

                        stream.on('end', function () {
                            out.end();
                            console.log('saved png - ' + tileName);
                        });
                    }
                });

            }
        });
    };
};

 /** 
 * UTFGrid routing 
 * :zoom/:col/:row.jsonp routing
 */
module.exports.utfGrid = function utfGrid(options){
  var options = options || {},
      map = options.map,
      format;
      
  if (!options.map) {
    throw new Error("You must set options.map equal to your map");
  }
  
  
  return function tilePng(req, res, next){
    var tileCoordinate, format, bounds;
    
    // verify arguments (don't forget jsonp!)
    tileCoordinate = req.path.match(/(\d+)\/(\d+)\/(\d+)\.(png|json|jsonp)$/);
    if (!tileCoordinate) {
      return next();
    }

    // slice the regexp down to usable size 
    console.log(tileCoordinate[4]);
    format = tileCoordinate[4];     
    tileCoordinate = tileCoordinate.slice(1,4).map(Number);
 
    // Show the rasterized utfgrid for debugging 
    respondWithImage = format === 'png';
    if (respondWithImage) {
      renderHandler = function(err, canvas) {
        var stream = canvas.createPNGStream();
        stream.pipe(res);
      };
    }
    else {
      renderHandler = function(err, grid) {
        res.jsonp(grid);
      };
    }
    bounds = Projector.util.tileToMeters(tileCoordinate[1], tileCoordinate[2], tileCoordinate[0], 64);
    map.renderGrid({
      bounds: {minX: bounds[0], minY: bounds[1], maxX: bounds[2], maxY: bounds[3]},
      width: 64,
      height: 64,
      zoom: tileCoordinate[0],
      drawImage: respondWithImage,
      callback: renderHandler
    }); 
  };
};

module.exports.tileJson = function tileJson(options) {
  var options = options || {},
      path = options.path;
    
  if (!options.path) {
    throw new Error("You must set options.path to point to your tile.json file");
  }
  
  return function tileJson(req, res, next){
    fs.readFile(path, 'utf8', function(err, file){
      if (err) return next(err);
      var tileJson;
      
      // don't let JSON.parse barf all over everything
      try {
        tileJson = JSON.parse(file);
      }
      catch(err) {
        return next(err);
      }
      
      return res.jsonp(tileJson);
    });
  }
};