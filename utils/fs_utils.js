const fs = require('fs');

async function deleteFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.unlink(filePath, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

async function fileExists(path){
    try {
        // Using fs.promises.stat() for asynchronous file existence checking
        await fs.promises.stat(path);
        return true; // File exists
    } catch (error) {
        if (error.code === 'ENOENT') {
            return false; // File doesn't exist
        }
        // Re-throw other errors
        throw error;
    }
}

module.exports = {
    fileExists:fileExists,
    deleteFile:deleteFile,

}