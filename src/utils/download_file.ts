import fs from "fs";
import https from "https";

export default async function download_file(url: string, path: string) {
    console.log(url);
    const file = fs.createWriteStream(path);
    return new Promise((resolve, reject) => {

        const options = {
            headers: {
                'User-Agent': 'curl/7.64.1'
            }
        };

        https.get(url, options, function (response) {
            // Check if request was successful
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Follow redirect and call the function again
                return download_file(response.headers.location!, path);

            } else if (response.statusCode !== 200) {
                console.error('Failed to download file, status code: ' + response.statusCode);
                reject(response.statusCode);
            }

            response.pipe(file);

            file.on('finish', function () {
                file.close();  // close() is async, call cb after close completes.
                console.log('Download to ' + path + ' completed');
                resolve(null);
            });
        }).on('error', function (error) { // Handle errors
            fs.unlink(path, function () { }); // Delete the file async. (But we don't check the result)
            console.error('Error downloading file: ' + error.message);
            reject(error);
        });
    });
}
