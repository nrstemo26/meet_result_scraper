const fsPromise = require('fs/promises')
const fs = require('fs');
const csv = require('csv-parser');
const fastcsv = require('fast-csv')
const util = require('util');
const readdir = util.promisify(fs.readdir);
const unlink = util.promisify(fs.unlink);

function mapToString(map){
  let str = 'Meet|Level|Date|Results|Meet Url\n';
  map.forEach((value,key,map)=>{
      let meetStr = `${value.Meet}|${value.Level}|${value.Date}|${value.Results}|${value["Meet Url"]}`    
      return str += meetStr +"\n"
  })
  return str;
}

//this is going to need to change i believe
async function extractMeetUrls(csvFilePath) {
    return new Promise((resolve, reject) => {
        const meetUrls = [];
      
        fs.createReadStream(csvFilePath)
          .pipe(csv({ separator: '|' }))
          // .pipe(csv({ separator: '|' }))
          .on('data', (row) => {
            //needs to remove leading whitespace becasue future scrapers wont have whitespace between pipes
            // meetUrls.push(row[' Meet Url'].trim());
            
            meetUrls.push(row['Meet Url'].trim());
          })
          .on('end', () => {
            // console.log('Meet URLs extracted:', meetUrls);
            resolve(meetUrls)
          })
          .on('error',(err)=>{
            console.log(err)
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

async function sanitizeData(){
  console.log('sanitizing')
  return new Promise((resolve, reject) => {
      fs.createReadStream('current_metadata.csv')
        .pipe(csv(csvOptions))
        .on('data',(data)=>{
          let meetData;
          if(!data.Level){
              let [meet,level,date,resultsNo,url] = data.Meet.split('|')
              meet = meet.replaceAll('"','')

              meetData = {
                  Meet:meet,
                  Level:level,
                  Date: date,
                  Results: resultsNo,
                  "Meet Url": url
              }
          }else{
              meetData = data
          }
          if(!results.has(meetData["Meet Url"])){
              newMeets++;
              results.set(meetData["Meet Url"], meetData)
          }else{  
              duplicateArr.push(meetData['Meet Url'])
              duplicates++;
          }
        })
        .on('end',()=>{
          // console.log(`new meets: ${newMeets}`);
          // console.log(`duplicate meets: ${duplicates}`);
          // console.log(results.size)
          //write new file here

          fs.writeFile('foo.csv', mapToString(results), "utf-8",(err)=>{
              if(err) console.log(err);
              else {
                  console.log('data saved')
                  resolve(results)
              }
          })
      
          // resolve(results)
          // console.log(duplicateArr.join(' '))
        })
        .on('error',(err)=>{
          console.log(err)
          reject(err);
        })
      
  })
}



module.exports={
    createCSVfromArray,
    writeCSV,
    extractMeetUrls,
    clearCsvFolder,
    clearCsvFile,
    sanitizeData,
}