//just uncomment run and call this file from command line

const fs = require('fs');
const path = require('path');
const { makeNewMeetMetaData} = require('./scrapers/meetMetadataCsv')
const {scrapeOneMeet: getOneMeetCsv} = require('./scrapers/scrapeOneMeet')
const { getWeeksAndYears } = require('./utils/date_utils')
const {extractMeetUrls} = require('./utils/csv_utils')
const {getAllMeetMetaData} = require('./scrapers/getAllMeetMetaData')

async function run (){
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
    
    
    //needs a date now January 2011
    await getAllMeetMetaData(`./data/meet_metadata/${currentYear}_week_${currentWeek}.csv`, 'January 2011')
    
    //makes the file if it doesn't exist
    const unmatchedOutputDir = path.join(outputCsvPath);
    if (!fs.existsSync(unmatchedOutputDir)) {
        fs.mkdirSync(unmatchedOutputDir, { recursive: true, });
    }
    
    
    console.log('getting new meet metadata')
    console.log(getWeeksAndYears())
    
    //* */
    //gets unmatched meets versus previous weeks scraping
    await makeNewMeetMetaData(csvFiles, outputFileName, outputFile, unmatchedOutputDir)
    
   
    // function to read CSV and get the meetUrls in an array or something
    // const newMeetUrls = await extractMeetUrls('2023_meets_metadata.csv')
    const newMeetUrls = await extractMeetUrls(outputFileName)
    // console.log('new meet urls: ', newMeetUrls)
    for(let i = 0; i < newMeetUrls.length; i++){
        console.log(`${i+1} of ${newMeetUrls.length}`)
        const meetUrl = newMeetUrls[i]
        console.log('meeturl: ', meetUrl)

        
        // await getOneMeetCsv(meetUrl, `./data/2023_meets/meet_${meetUrl}.csv`)
        await getOneMeetCsv(meetUrl, `${outputCsvPath}/meet_${meetUrl}.csv`)
    }

    console.log('done')
}

module.exports = {
    run: run
}
// run()