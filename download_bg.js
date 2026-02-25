const https = require('https');
const fs = require('fs');
const path = require('path');

const url = "https://w.wallhaven.cc/full/y8/wallhaven-y898gd.jpg";
const dest = path.join(__dirname, 'landing', 'stranger_things_bg.jpg');

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    if (res.statusCode === 200) {
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log("Download successful!");
        });
    } else {
        console.log("Download failed: " + res.statusCode);
        // Fallback image source if first fails
        const fallbackUrl = "https://wallpapercave.com/wp/wp2263435.jpg";
        https.get(fallbackUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (fallbackRes) => {
            const file = fs.createWriteStream(dest);
            fallbackRes.pipe(file);
        });
    }
});
