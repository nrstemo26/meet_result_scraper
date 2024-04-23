//just uncomment run and call this file from command line
const fs = require('fs');
const path = require('path');
const { makeNewMeetMetaData} = require('./scrapers/meetMetadataCsv')
const {scrapeOneMeet: getOneMeetCsv} = require('./scrapers/scrapeOneMeet')
const { getWeeksAndYears } = require('./utils/date_utils')
const {readCsv,appendToCsv, extractMeetUrls, clearCsvFolder,clearCsvFile, sanitizeData, compareCsvs, checkData} = require('./utils/csv_utils')
const {getAllMeetMetaData, getCurrentYearMetadata} = require('./scrapers/getAllMeetMetaData');

const { fileExists, deleteFile} = require('./utils/fs_utils')



async function run (maxRetries, folderPath){
    let totalRetries = 0;
    let meetRetries = 0;
    let newMeetUrls = [];

    let newMeets =[]
    let errorMeets = [];
    let i = 0;
    let meetUrl;

    let metadataPath = `${folderPath}/metadata.csv`;
    
    while(totalRetries < maxRetries){
        try{
            if(await fileExists(metadataPath)){
                //issues with the delimiter for reading csv
                console.log('file exists')
                //so the metadata file exists already
                meetsArray = await readCsv(metadataPath)
            }else{
                try{
                    console.log('file does not exist')
                    //no metadata file or there was an error getting it
                    await getCurrentYearMetadata(metadataPath);
                    meetsArray = await readCsv(metadataPath)
                }catch(e){
                    await deleteFile(metadataPath);
                    throw new Error('')
                }
            }

            
            // so we have a meet url and we need to 
            for(meet of meetsArray){
                
                let url = meet['Meet Url']
                console.log(meet)
                let path = `${folderPath}/meet_${url}.csv`
                
                let specificMeetRetries = 0;
    
                while(specificMeetRetries < 5){
                    try{
                        console.log('trying to scrape')
                        await getOneMeetCsv(url, path)
                        console.log('scraped that hoe')
                        await appendToCsv(`${folderPath}/success.csv`,Object.values(meet))
                
                        break;
                    }catch(e){
                        console.log(specificMeetRetries)
                        await deleteFile(path)
                        if(specificMeetRetries > 4){
                        
                            await appendToCsv(`${folderPath}/error.csv`, Object.values(meet))
                            break;
                        }else{
                            specificMeetRetries++;
                        }
                    }
                }
            }


            

            // while(i < newMeetUrls.length){
            //     try{
            //         meetUrl = newMeetUrls[i]
            //         console.log(`checking ${meetUrl}`)
            //         if(!newMeets.includes(meetUrl)){
            //             console.log(`${i+1} of ${newMeetUrls.length}`)
            //             await getOneMeetCsv(meetUrl, `${folderPath}/meet_${meetUrl}.csv`)
            //             i++
            //             newMeets.push(meetUrl);
            //         }else{
            //             i++;
            //         }
                    
                    
            //     }catch(e){
            //         if(meetRetries > 4){
            //             errorMeets.push(newMeetUrls[i])
            //             i++;
            //             meetRetries = 0;
            //         }else{
            //             meetRetries++
            //         }

            //     }

            console.log('scraping successful')
                
            // }
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
run(5, './backfill')