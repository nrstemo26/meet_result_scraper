//just uncomment run and call this file from command line

const fs = require('fs');
const path = require('path');
const { makeNewMeetMetaData} = require('../scrapers/meetMetadataCsv')
const {scrapeOneMeet: getOneMeetCsv} = require('../scrapers/scrapeOneMeet')
const { getWeeksAndYears } = require('../utils/date_utils')
const {extractMeetUrls, clearCsvFolder,clearCsvFile} = require('../utils/csv_utils')
const {getAllMeetMetaData} = require('../scrapers/getAllMeetMetaData');


async function run (maxRetries){
    let retries = 0; 
    const { currentYear, currentWeek, previousYear, previousWeek} = getWeeksAndYears();
    const currentFile = `./data/meet_metadata/${currentYear}_week_${currentWeek}.csv`;
    const previousFile = `./data/meet_metadata/${previousYear}_week_${previousWeek}.csv`;
    // console.log(currentFile)
    // console.log(previousFile)
    const csvFiles = [previousFile, currentFile];
    
    //new meets will go in the same folder as this
    const outputCsvPath = `./data/weekly_updates/weekly_update_${currentYear}_week_${currentWeek}`
    const outputFile = 'new_meet_metadata.csv'
    const outputFileName = outputCsvPath + '/' + outputFile
    


    while(retries < maxRetries){
        try{
            //needs a date now January 2011 should get all meets
            //this should make a new meet metadata in a csv
            await getAllMeetMetaData(`./data/meet_metadata/${currentYear}_week_${currentWeek}.csv`, 'January 2011')

            //we should need to sanitize that data
            //import and use sanitize function here.

            //compare csv to previous week

            
            // ***
            // await getAllMeetMetaData(`./data/backfill/metadata.csv`, 'January 2023')
            
            // // //makes the file/folder structure if it doesn't exist
            //what the fuck does it actually do???????
            const unmatchedOutputDir = path.join(outputCsvPath);
            if (!fs.existsSync(unmatchedOutputDir)) {
                fs.mkdirSync(unmatchedOutputDir, { recursive: true, });
            }
            
            
            console.log('getting new meet metadata')
            // console.log(getWeeksAndYears())


            // const currentFile = `./data/meet_metadata/${currentYear}_week_${currentWeek}.csv`;
            // const previousFile = `./data/meet_metadata/${previousYear}_week_${previousWeek}.csv`;
            // const csvFiles = [previousFile, currentFile];
            
            // const outputCsvPath = `./data/weekly_updates/weekly_update_${currentYear}_week_${currentWeek}`
            // const outputFile = 'new_meet_metadata.csv'
            // const outputFileName = outputCsvPath + '/' + outputFile

            //gets unmatched meets versus previous weeks scraping
            //explain all of these
           
        //    i dont think we need this to run on the
            // await makeNewMeetMetaData(csvFiles, outputFileName, outputFile, unmatchedOutputDir)            
           
            // function to read CSV and get the meetUrls in an array or something
            // const newMeetUrls = await extractMeetUrls(outputFileName)
            
            const newMeetUrls = await extractMeetUrls('./data/backfill/metadata.csv')
            for(let i = 0; i < newMeetUrls.length; i++){
                console.log(`${i+1} of ${newMeetUrls.length}`)
                const meetUrl = newMeetUrls[i]
                console.log('meeturl: ', meetUrl)
                //this is the function that scrapes one meet
                // await getOneMeetCsv(meetUrl, `${outputCsvPath}/meet_${meetUrl}.csv`)
                await getOneMeetCsv(meetUrl, `./data/backfill/meets/meet_${meetUrl}.csv`)
            }
            console.log('scraping successful')
            break;
        }catch(error){
            console.error(`Attempt ${retries + 1} failed: ${error}`)
            retries++;

            //clears the meet metadata file
            // await clearCsvFile(`./data/meet_metadata/${currentYear}_week_${currentWeek}.csv`)
            //clears the meet results and the new meet metadata file
            //doesn't delete the folder
            // await clearCsvFolder(outputCsvPath)
        }

    }

    if(retries === maxRetries){
        console.error(`Exceeded max retries (${maxRetries}). Scraping failed.`)
    }
    console.log('done')
}



module.exports = {
    run: run
}

//param is amount of retries
run(5)