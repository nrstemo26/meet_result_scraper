const fs = require('fs');
const csv = require('csv-parser');
const { makeNewMeetMetaData } = require('./meetMetadataCsv')

// Specify the input CSV file path

async function getNewMeetArray (inputCsvPath, callback){
    // const inputCsvPath = 'input.csv';
    const meetColumn = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(inputCsvPath)
        .pipe(csv({separator: "|"}))
        .on('data', (row) => {
            meetColumn.push(row['Meet']);
        })
        .on('end', () => {
            // console.log('Meet column extracted:', meetColumn);
            resolve(meetColumn)
        })
        .on('error',(error)=>{
            reject(error)
        });

    });
}
// Array to store the "Meet" column values

//now this needs to read that csv get the meet name and have that as an array

async function run (){
    console.log('getting new meet metadata')
    const fileName = await makeNewMeetMetaData()
    const newMeetNames = await getNewMeetArray(fileName)
    console.log('we have new meets:', newMeetNames)
    console.log('done')
}

run()

//what are the main processes we need to do for this

//have function that scrapes 1 meet off of urlID

//get all meet meta-data
//compare to previous week's metadata
//filter out all overlapping metadata

// take that list/array/csv and loop thru the 
// https://usaweightlifting.sport80.com/public/rankings/results/ 
// click to open(preferably in a new tab)
// get url#? of meet and add to metadata

