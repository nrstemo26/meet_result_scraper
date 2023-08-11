const fsPromise = require('fs/promises')
const fs = require('fs');
const csv = require('csv-parser');

async function extractMeetUrls(csvFilePath) {
    return new Promise((resolve, reject) => {
        const meetUrls = [];
      
        fs.createReadStream(csvFilePath)
          .pipe(csv({ separator: '|' }))
          .on('data', (row) => {
            meetUrls.push(row[' Meet Url'].trim());
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


async function writeCSV(folderName, fileName, data){
    let fullPath = `./data/${folderName}/${fileName}.csv`;
    await fsPromise.writeFile(fullPath, data, {flag:"a+"}, err =>{
        if(err){
            console.error(err);
        }
    })
}

module.exports={
    createCSVfromArray,
    writeCSV,
    extractMeetUrls
}