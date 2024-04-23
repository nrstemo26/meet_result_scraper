const fs = require('fs');
const fsPromise = require('fs').promises;


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

async function createFolder(folderName){
    try {
        // Check if folder exists
        const folderExists = await fsPromise.access(folderName)
          .then(() => true)
          .catch(() => false);
    
        if (folderExists) {
          console.log(`Folder "${folderName}" already exists.`);
          return;
        }
    
        // Folder doesn't exist, create it
        await fsPromise.mkdir(folderName);
        console.log(`Folder "${folderName}" created successfully.`);
      } catch (error) {
        console.error(`Error creating folder: ${error}`);
      }
}

async function fileExists(path){
    try {
        // Using fs.promises.stat() for asynchronous file existence checking
        await fsPromise.stat(path);
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
    createFolder:createFolder,
}