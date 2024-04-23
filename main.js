//just uncomment run and call this file from command line
const fs = require('fs');
const path = require('path');
const { makeNewMeetMetaData} = require('./scrapers/meetMetadataCsv')
const {scrapeOneMeet: getOneMeetCsv} = require('./scrapers/scrapeOneMeet')
const {readCsv,appendToCsv, extractMeetUrls, clearCsvFolder,clearCsvFile, sanitizeData, compareCsvs, checkData} = require('./utils/csv_utils')
const {getAllMeetMetaData, getCurrentYearMetadata} = require('./scrapers/getAllMeetMetaData');
const { fileExists, deleteFile, createFolder} = require('./utils/fs_utils')



async function run (maxRetries, folderName){
    let totalRetries = 0;
    let successMeets = [];

    // what do i need to do now
    // ??
    //i think this shit just works?
    

    let metadataPath = `./data/${folderName}/metadata.csv`;
    let successPath = `./data/${folderName}/success.csv`
    let errorPath = `./data/${folderName}/error.csv`

    await createFolder(`./data/${folderName}`)
    await appendToCsv(successPath, ['Meet','Level','Date','Results','Meet Url'])
    await appendToCsv(errorPath, ['Meet','Level','Date','Results','Meet Url'])


    while(totalRetries < maxRetries){
        try{
            if(await fileExists(metadataPath)){
                meetsArray = await readCsv(metadataPath, '|')
            }else{
                try{
                    await getCurrentYearMetadata(metadataPath);
                    meetsArray = await readCsv(metadataPath, '|')
                }catch(e){
                    await deleteFile(metadataPath);
                    throw new Error('')
                }
            }

            //reads the success file so we can skip meets already scraped if there was an error scraping
            if(await fileExists(successPath)){
                successMeets = await readCsv(successPath, ',')
            }
        
            for(meet of meetsArray){
                let successUrls = successMeets.map(el=> el['Meet Url'])
                let url = meet['Meet Url']
                let path = `./data/${folderName}/meet_${url}.csv`
                
                if(!successUrls.includes(url)){
                    let specificMeetRetries = 0;
                    while(specificMeetRetries < 5){
                        try{
                            await getOneMeetCsv(url, path)
                            await appendToCsv(successPath, Object.values(meet))
                            break;
                        }catch(e){
                            await deleteFile(path)
                            if(specificMeetRetries > 4){
                                await appendToCsv(errorPath, Object.values(meet))
                                break;
                            }else{
                                specificMeetRetries++;
                            }
                        }
                    }
                }
            }

            console.log('scraping successful')
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
}



module.exports = {
    run: run
}

//param is amount of retries
run(5, 'backfill')