const fs = require('fs');
const { makeNewMeetMetaData} = require('./scrapers/meetMetadataCsv')
const {scrapeOneMeet: getOneMeetCsv} = require('./scrapers/scrapeOneMeet')
const {readCsv,appendToCsv} = require('./utils/csv_utils')
const {getAllMeetMetaData, getCurrentYearMetadata} = require('./scrapers/getAllMeetMetaData');
const { fileExists, deleteFile, createFolder} = require('./utils/fs_utils')


async function run (maxRetries, folderName){
    let totalRetries = 0;
    let successMeets = [];

    
    await fs.promises.mkdir(folderName,{recursive:true})

    let metadataPath = `${folderName}/metadata.csv`;
    let successPath = `${folderName}/success.csv`
    let errorPath = `${folderName}/error.csv`

    await createFolder(`${folderName}`)
    await createFolder(`${folderName}data`)
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
                let path = `${folderName}/data/meet_${url}.csv`
                
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

    //email new data// that turns into database writes
    //if that's successfull delete the folder and contents
    //set up everything to cron
    
}



module.exports = {
    run: run
}


// run(5, './data/backfill')


// so i need to get this to work weekly
// what do i need to do weekly?
// have an update of the upcoming national meets
// have an update of the meet results(current iteration works)


