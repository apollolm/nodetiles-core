//Caching mechanism



var diskCacher = exports.diskCacher = function(options) {
    //self, path, umask=0022, dirs='safe', gzip='txt text json xml'.split()
    var cachepath = options.cachepath;
    var umask = options.umask;
    var dirs = options.dirs;
    var gzip = options.gzip;

    function _is_compressed(format){
        if(gzip.indexOf(format.toLowerCase()) > -1){
            return true;
        }
        else{
            return false;
        }
    }

    function _filepath(layer, coord, format){

        var l = layer.name;
        var z = coord.zoom;
        var e = format.toLowerCase();
        //e += _is_compressed(format) and '.gz' or ''
        
        if (dirs == 'safe'){
            x = parseFloat(coord.column).toPrecision(6);
        
        y = parseFloat(coord.row).toPrecision(6);

        x1 = x.slice(0,3);
        x2 = x.slice(3, x.length - 1)];

        y1 = y.slice(0,3);
        y2 = y.slice(3, y.length - 1)];

        filepath = pathjoin( (l, z, x1, x2, y1, y2 + '.' + e) )
        }
        else if(dirs == 'portable'){
            x = '%d' % coord.column
            y = '%d' % coord.row

            filepath = os.sep.join( (l, z, x, y + '.' + e) )
        }
        else if(dirs == 'quadtile'){
            //Need to convert for now
            //pad, length = 1 << 31, 1 + coord.zoom

            //two binary strings, one per dimension
            //xs = bin(pad + int(coord.column))[-length:]
            //ys = bin(pad + int(coord.row))[-length:]
            
            //interleave binary bits into plain digits, 0-3.
            //adapted from ModestMaps.Tiles.toMicrosoft()
            //dirpath = ''.join([str(int(y+x, 2)) for (x, y) in zip(xs, ys)])
            
            //built a list of nested directory names and a file basename
            //bparts = [dirpath[i:i+3] for i in range(0, len(dirpath), 3)]
            
            //filepath = os.sep.join([l] + parts[:-1] + [parts[-1] + '.' + e])
        }
        else{
            throw 'Please provide a valid "dirs" parameter to the Disk cache, either "safe", "portable" or "quadtile" but not ' + dirs;
        }

        return filepath
    }


    function _fullpath(self, layer, coord, format){

        filepath = _filepath(layer, coord, format);
        fullpath = path.join(self.cachepath, filepath);

        return fullpath
    }

    function _lockpath(self, layer, coord, format){

        return _fullpath(layer, coord, format) + '.lock';
    }

    function lock(self, layer, coord, format){
        //Acquire a cache lock for this tile.
        
        //Returns nothing, but blocks until the lock has been acquired.
        //Lock is implemented as an empty directory next to the tile file.
        //
        //lockpath = _lockpath(layer, coord, format)
        //due = new Date().getTime() + layer.stal e_lock_timeout
        
        //while True:
        //    //try to acquire a directory lock, repeating if necessary.
        //        try:
        //            umask_old = os.umask(self.umask)
                
        //if (time.time() > due){
        //    //someone left the door locked.
        //try:
        //    os.rmdir(lockpath)
        //except OSError:
        //                # Oh - no they didn't.
        //pass
                
        //os.makedirs(lockpath, 0777&~self.umask)
        //break
        //except OSError, e:
        //if e.errno != 17:
        //    raise
        //time.sleep(.2)
        //    finally:
        //    os.umask(umask_old)
    }

    function unlock(self, layer, coord, format){
        //Release a cache lock for this tile.
        //Lock is implemented as an empty directory next to the tile file.
        //
        //lockpath = _lockpath(layer, coord, format)

        //try:
        //    os.rmdir(lockpath)
        //except OSError:
        //    # Ok, someone else deleted it already
        //pass
    }


    function remove(self, layer, coord, format){
        //Remove a cached tile.
        //
        fullpath = _fullpath(layer, coord, format)
        
        try{
            os.remove(fullpath)
        }
        catch(e){
            //errno=2 means that the file does not exist, which is fine
            if(e.errno != 2){
                throw e;
            }
        }
    }

    function read(self, layer, coord, format){
        //read a cached tile
        //
        fullpath = _fullpath(layer, coord, format)
        
        if(!fullpath){
            return null;
        }

        fs.stat(fullpath, function(result){
            var age = new Date().getTime()- result.mtime;
            
            if(layer.cache_lifespan && (age > layer.cache_lifespan)){
                return null;
            }
            else if(_is_compressed(format)){
                return gzip.open(fullpath, 'r').read()
            }
            else{
                body = open(fullpath, 'rb').read()
                return body
            }
        });

    }
        
    function save(self, body, layer, coord, format){
        //Save a cached tile.
        //
        fullpath = _fullpath(layer, coord, format)
        
        try{
            umask_old = process.umask(umask);
            fs.makedirs(dirname(fullpath), 0777&~self.umask)
        }
        catch(e){
            if (e.errno != 17){
                throw e;
            }
        }
        finally{
            fs.umask(umask_old);
        }

        var suffix = '.' + format.toLowerCase();
        suffix += (_is_compressed(format) ? '.gz' : '');

        fh, tmp_path = mkstemp(dir=self.cachepath, suffix=suffix)
        
        if (_is_compressed(format)){
            os.close(fh);
            tmp_file = gzip.open(tmp_path, 'w');
            tmp_file.write(body);
            tmp_file.close();
        }
        else{
            os.write(fh, body);
            os.close(fh);
        }
        
        try{
            os.rename(tmp_path, fullpath);
        }
        catch(e){
            os.unlink(fullpath)
            os.rename(tmp_path, fullpath)
        }

        os.chmod(fullpath, 0666&~self.umask)
    }
};



    

    



        

        

    
