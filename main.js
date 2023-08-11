const fs = require('fs');
const csv = require('csv-parser');
const { makeNewMeetMetaData} = require('./meetMetadataCsv')
const {start:getOneMeetCsv} = require('./app')
const { getWeeksAndYears } = require('./utils/date_utils')
const path = require('path');
const {extractMeetUrls} = require('./utils/csv_utils')

async function run (){
    const { currentYear, currentWeek, previousYear, previousWeek} = getWeeksAndYears();
    const currentFile = `./data/meet_metadata/${currentYear}_week_${currentWeek}.csv`;
    const previousFile = `./data/meet_metadata/${previousYear}_week_${previousWeek}.csv`;
    console.log(currentFile)
    console.log(previousFile)
    const csvFiles = [previousFile, currentFile];
    
    //new meets will go in the same folder as this
    const outputCsvPath = `./data/weekly_updates/weekly_update_${currentYear}_week_${currentWeek}`
    const outputFile = 'new_meet_metadata.csv'
    const outputFileName = outputCsvPath + '/' + outputFile
    
    //makes the file if it doesn't exist
    const unmatchedOutputDir = path.join(outputCsvPath);
    if (!fs.existsSync(unmatchedOutputDir)) {
        fs.mkdirSync(unmatchedOutputDir, { recursive: true, });
    }
    
    console.log('getting new meet metadata')
    console.log(getWeeksAndYears())
    
    //gets unmatched meets versus previous weeks scraping
    await makeNewMeetMetaData(csvFiles, outputFileName, outputFile, unmatchedOutputDir)
    
    // after that we need to get the url's from the meet
    // scrape meets off of
    
   
    // function to read CSV and get the meetUrls in an array or something
    const newMeetUrls = await extractMeetUrls(outputFileName)
    // console.log('new meet urls: ', newMeetUrls)
    for(let i = 0; i < newMeetUrls.length; i++){
        console.log('in here')
        const meetUrl = newMeetUrls[i]
        console.log('meeturl: ',meetUrl)

        //                   meetnumber //csvName
        // await getOneMeetCsv(meetUrl, `${outputCsvPath}meet_${meetUrl}`)
    }

    console.log('done')
}

run()


//getAllMeetMetaData(getDateMMDDYYYY())

//what are the main processes we need to do for this

//have function that scrapes 1 meet off of urlID

//DONE//get all meet meta-data
//DONE//compare to previous week's metadata
//DONE//filter out all overlapping metadata

// take that list/array/csv and loop thru the 
// https://usaweightlifting.sport80.com/public/rankings/results/ 
// click to open(preferably in a new tab)
// get url#? of meet and add to metadata



// const { addUrlToMeetCsv} = require('./meetMetadataCsv')
// const {getAllMeetMetaData} = require('./meet_metadata_scraper/getAllMeetMetaData')
// const {searchForNewMeets } = require('./searchForNewMeets')

// async function getNewMeetArray (inputCsvPath, callback){
//     // const inputCsvPath = 'input.csv';
//     const meetColumn = [];
//     return new Promise((resolve, reject) => {
//         fs.createReadStream(inputCsvPath)
//         .pipe(csv({separator: "|"}))
//         .on('data', (row) => {
//             meetColumn.push(row['Meet']);
//         })
//         .on('end', () => {
//             // console.log('Meet column extracted:', meetColumn);
//             resolve(meetColumn)
//         })
//         .on('error',(error)=>{
//             reject(error)
//         });

//     });
// }

// const newMeetNamesUrl = await searchForNewMeets(await getNewMeetArray(fileName))
// console.log(newMeetNamesUrl.length)

    //write url to new metadata csv   
    //needs a better url route
   
    // await addUrlToMeetCsv(fileName,'foo.csv', newMeetNamesUrl)
    // .then(() => {
    //     console.log('Modified CSV saved as output.csv');
    // })
    // .catch((err) => {
    //     console.error('An error occurred:', err);
    // });
    
    //now wee need to use the csv or the array i have 
    //to scrape the the meet data off of the meet url
    
    // for(let i=0; i < newMeetNamesUrl.length; i++){
    //     let meetUrl = newMeetNamesUrl[i][1]
    //     await getOneMeetCSV(meetUrl, `meet-${meetUrl}`)
    //     console.log('meeturl', meetUrl )
    // }