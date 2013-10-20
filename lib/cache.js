//Caching mechanism



var diskCacher = exports.diskCacher = function(options) {

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
        var e += _is_compressed(format) and '.gz' or ''
        
        if self.dirs == 'safe':
            x = '%06d' % coord.column
        y = '%06d' % coord.row

        x1, x2 = x[:3], x[3:]
        y1, y2 = y[:3], y[3:]
            
        filepath = os.sep.join( (l, z, x1, x2, y1, y2 + '.' + e) )
            
        elif self.dirs == 'portable':
        x = '%d' % coord.column
        y = '%d' % coord.row

        filepath = os.sep.join( (l, z, x, y + '.' + e) )
            
        elif self.dirs == 'quadtile':
        pad, length = 1 << 31, 1 + coord.zoom

            # two binary strings, one per dimension
        xs = bin(pad + int(coord.column))[-length:]
        ys = bin(pad + int(coord.row))[-length:]
            
            # interleave binary bits into plain digits, 0-3.
            # adapted from ModestMaps.Tiles.toMicrosoft()
        dirpath = ''.join([str(int(y+x, 2)) for (x, y) in zip(xs, ys)])
            
            # built a list of nested directory names and a file basename
        parts = [dirpath[i:i+3] for i in range(0, len(dirpath), 3)]
            
            filepath = os.sep.join([l] + parts[:-1] + [parts[-1] + '.' + e])
        
    else:
        raise KnownUnknown('Please provide a valid "dirs" parameter to the Disk cache, either "safe", "portable" or "quadtile" but not "%s"' % self.dirs)

        return filepath
    }


};


def __init__(self, path, umask=0022, dirs='safe', gzip='txt text json xml'.split()):




def _fullpath(self, layer, coord, format):
"""
"""
filepath = self._filepath(layer, coord, format)
fullpath = pathjoin(self.cachepath, filepath)

return fullpath

def _lockpath(self, layer, coord, format):
"""
"""
return self._fullpath(layer, coord, format) + '.lock'
    
def lock(self, layer, coord, format):
""" Acquire a cache lock for this tile.
        
Returns nothing, but blocks until the lock has been acquired.
Lock is implemented as an empty directory next to the tile file.
"""
lockpath = self._lockpath(layer, coord, format)
due = time.time() + layer.stale_lock_timeout
        
while True:
    # try to acquire a directory lock, repeating if necessary.
        try:
            umask_old = os.umask(self.umask)
                
if time.time() > due:
    # someone left the door locked.
try:
    os.rmdir(lockpath)
except OSError:
                        # Oh - no they didn't.
pass
                
os.makedirs(lockpath, 0777&~self.umask)
break
except OSError, e:
if e.errno != 17:
    raise
time.sleep(.2)
            finally:
    os.umask(umask_old)
    
def unlock(self, layer, coord, format):
""" Release a cache lock for this tile.

Lock is implemented as an empty directory next to the tile file.
"""
lockpath = self._lockpath(layer, coord, format)

try:
    os.rmdir(lockpath)
except OSError:
            # Ok, someone else deleted it already
pass
        
def remove(self, layer, coord, format):
""" Remove a cached tile.
"""
fullpath = self._fullpath(layer, coord, format)
        
try:
    os.remove(fullpath)
except OSError, e:
            # errno=2 means that the file does not exist, which is fine
if e.errno != 2:
    raise
        
def read(self, layer, coord, format):
""" Read a cached tile.
"""
fullpath = self._fullpath(layer, coord, format)
        
if not exists(fullpath):
return None

age = time.time() - os.stat(fullpath).st_mtime
        
if layer.cache_lifespan and age > layer.cache_lifespan:
return None
    
elif self._is_compressed(format):
return gzip.open(fullpath, 'r').read()

else:
    body = open(fullpath, 'rb').read()
return body
    
def save(self, body, layer, coord, format):
""" Save a cached tile.
"""
fullpath = self._fullpath(layer, coord, format)
        
try:
    umask_old = os.umask(self.umask)
os.makedirs(dirname(fullpath), 0777&~self.umask)
except OSError, e:
if e.errno != 17:
    raise
        finally:
    os.umask(umask_old)

suffix = '.' + format.lower()
suffix += self._is_compressed(format) and '.gz' or ''

fh, tmp_path = mkstemp(dir=self.cachepath, suffix=suffix)
        
if self._is_compressed(format):
    os.close(fh)
tmp_file = gzip.open(tmp_path, 'w')
tmp_file.write(body)
tmp_file.close()
else:
    os.write(fh, body)
os.close(fh)
        
try:
    os.rename(tmp_path, fullpath)
except OSError:
    os.unlink(fullpath)
os.rename(tmp_path, fullpath)

os.chmod(fullpath, 0666&~self.umask)