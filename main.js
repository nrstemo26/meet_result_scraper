const fs = require('fs');
const csv = require('csv-parser');
const { makeNewMeetMetaData,addUrlToMeetCsv} = require('./meetMetadataCsv')
const {searchForNewMeets} = require('./searchForNewMeets')
const {start:getOneMeetCSV} = require('./app')
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
    // console.log('getting new meet metadata')
    const fileName = await makeNewMeetMetaData()
    const newMeetNamesUrl = await searchForNewMeets(await getNewMeetArray(fileName))
    console.log(newMeetNamesUrl.length)

    //write url to new metadata csv   
    //needs a better url route
    await addUrlToMeetCsv(fileName,'foo.csv', newMeetNamesUrl)
    .then(() => {
        console.log('Modified CSV saved as output.csv');
    })
    .catch((err) => {
        console.error('An error occurred:', err);
    });
    
    //now wee need to use the csv or the array i have 
    //to scrape the the meet data off of the meet url
    for(let i=0; i < newMeetNamesUrl.length; i++){
        let meetUrl = newMeetNamesUrl[i][1]
        await getOneMeetCSV(meetUrl, `meet-${meetUrl}`)
        console.log('meeturl', meetUrl )
    }
    
    console.log('done')
}

run()

//what are the main processes we need to do for this

//have function that scrapes 1 meet off of urlID

//DONE//get all meet meta-data
//DONE//compare to previous week's metadata
//DONE//filter out all overlapping metadata

// take that list/array/csv and loop thru the 
// https://usaweightlifting.sport80.com/public/rankings/results/ 
// click to open(preferably in a new tab)
// get url#? of meet and add to metadata

