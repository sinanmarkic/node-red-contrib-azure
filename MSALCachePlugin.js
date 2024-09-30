const fs = require('fs');
const path = require('path');

class MSALCachePlugin {
    constructor(cacheFilePath) {
        this.cacheFilePath = cacheFilePath;
    }

    async beforeCacheAccess(cacheContext) {
        if (fs.existsSync(this.cacheFilePath)) {
            const cacheData = fs.readFileSync(this.cacheFilePath, { encoding: 'utf-8' });
            cacheContext.tokenCache.deserialize(cacheData);
        }
    }

    async afterCacheAccess(cacheContext) {
        if (cacheContext.cacheHasChanged) {
            fs.writeFileSync(this.cacheFilePath, cacheContext.tokenCache.serialize());
        }
    }
}

module.exports = MSALCachePlugin;
