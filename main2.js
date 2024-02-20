//just uncomment run and call this file from command line
const fs = require('fs');
const path = require('path');
const { makeNewMeetMetaData} = require('./scrapers/meetMetadataCsv')
const {scrapeOneMeet: getOneMeetCsv} = require('./scrapers/scrapeOneMeet')
const { getWeeksAndYears } = require('./utils/date_utils')
const {extractMeetUrls, clearCsvFolder,clearCsvFile, sanitizeData, compareCsvs, checkData} = require('./utils/csv_utils')
const {getAllMeetMetaData} = require('./scrapers/getAllMeetMetaData');


async function run (maxRetries){
    let totalRetries = 0;
    let meetRetries = 0;
    let newMeetUrls = [];

    let newMeets =[]
    let errorMeets = [];
    let i = 247;
    let meetUrl;
    
    while(totalRetries < maxRetries){
        try{
            // let newFile = './scraped_data/new_metadata.csv'
            // let oldFile = './scraped_data/previous_metadata.csv'
            if(newMeetUrls.length === 0){
                // await getAllMeetMetaData(`./backfill/metadata.csv`, 'October 2023');
                newMeetUrls = await sanitizeData(`./backfill/metadata.csv`) 
            }

            

           
            // let newMeetUrls = await compareCsvs(newFile, oldFile,'./scraped_data/newMeets.csv');
            // console.log(newMeetUrls)
            // let meets = [1,2,3,4,56,7,7]
            while(i < newMeetUrls.length){
                try{
                    meetUrl = newMeetUrls[i]
                    console.log(`checking ${meetUrl}`)
                    if(!newMeets.includes(meetUrl)){
                        console.log(`${i+1} of ${newMeetUrls.length}`)
                        await getOneMeetCsv(meetUrl, `./backfill/meet_${meetUrl}.csv`)
                        i++
                        newMeets.push(meetUrl);
                    }else{
                        i++;
                    }
                    
                    
                }catch(e){
                    if(meetRetries > 4){
                        errorMeets.push(newMeetUrls[i])
                        i++;
                        meetRetries = 0;
                    }else{
                        meetRetries++
                    }

                }

            console.log('scraping successful')
                
            }
            break;
        }catch(error){
            console.error(`Attempt ${totalRetries + 1} failed: ${error}`)
            totalRetries++;

        }

    }

    if(totalRetries === maxRetries){
        console.error(`Exceeded max retries (${maxRetries}). Scraping failed.`)
    }
    console.log('done')
    console.log(errorMeets)
}



module.exports = {
    run: run
}

//param is amount of retries
run(5)