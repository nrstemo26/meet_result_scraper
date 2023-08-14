const fsPromise = require('fs/promises')
const fs = require('fs');
const csv = require('csv-parser');
const util = require('util');
const readdir = util.promisify(fs.readdir);
const unlink = util.promisify(fs.unlink);

async function extractMeetUrls(csvFilePath) {
    return new Promise((resolve, reject) => {
        const meetUrls = [];
      
        fs.createReadStream(csvFilePath)
          .pipe(csv({ separator: '|' }))
          .on('data', (row) => {
            console.log(row)
            //needs to remove leading whitespace becasue future scrapers wont have whitespace between pipes
            // meetUrls.push(row[' Meet Url'].trim());
            meetUrls.push(row['Meet Url'].trim());
          })
          .on('end', () => {
            console.log('Meet URLs extracted:', meetUrls);
            resolve(meetUrls)
          })
          .on('error',(err)=>{
            reject(err)
          })
    });

}

function createCSVfromArray(arr){
    let newCSV = arr.map( (el)=> {
        return el.join('|')
    }).join('\n')
    newCSV += '\n'
    return newCSV;
}


async function writeCSV(filePath, data){
    // let fullPath = `./data/${folderName}/${fileName}.csv`;
    await fsPromise.writeFile(filePath, data, {flag:"a+"}, err =>{
        if(err){
            console.error(err);
        }
    })
}


//function to delete the one file
async function clearCsvFile(directory){
    try {
        // const file = await readdir(directory);
        await unlink(directory);
        
      } catch(err) {
        console.log(err);
      }

}
//function to delete the folder
async function clearCsvFolder(directory){
    try {
        const files = await readdir(directory);
        const unlinkPromises = files.map(filename => unlink(`${directory}/${filename}`));
        await Promise.all(unlinkPromises);
        //this doesn't work? no permission
        //should delete the directory
        //will investigate if the main function doesn't work if folder already exists
        //await unlink(directory)
      } catch(err) {
        console.log(err);
      }
}


module.exports={
    createCSVfromArray,
    writeCSV,
    extractMeetUrls,
    clearCsvFolder,
    clearCsvFile,
}