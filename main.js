const fs = require('fs');
const { makeNewMeetMetaData} = require('./scrapers/meetMetadataCsv')
const {scrapeOneMeet: getOneMeetCsv} = require('./scrapers/scrapeOneMeet')
const {readCsv, appendToCsv,betterWriteCSV, filterAlreadyScrapedMeets, addtoCSV} = require('./utils/csv_utils')
const {getAllMeetMetaData, getCurrentYearMetadata} = require('./scrapers/getAllMeetMetaData');
const { fileExists,checkFile, deleteFile, createFolder} = require('./utils/fs_utils')

async function run (maxRetries, folderName){
    let totalRetries = 0;
    let successMeets = [];

    await fs.promises.mkdir(folderName,{recursive:true})

    let allMetadataPath = `${folderName}/all_year_metadata.csv`;
    let metadataPath = `${folderName}/metadata.csv`;
    let successPath = `${folderName}/success.csv`
    let errorPath = `${folderName}/error.csv`

    await createFolder(`${folderName}`)
    await createFolder(`${folderName}/data`)
    await appendToCsv(successPath, ['Meet','Level','Date','Results','Meet Url'])
    await appendToCsv(errorPath, ['Meet','Level','Date','Results','Meet Url'])

    while(totalRetries < maxRetries){
        const alreadyScrapedPath = 'already_scraped.csv';   
        try{    
            if(await checkFile(metadataPath)){
                console.log('metadata file exists')
                meetsArray = await readCsv(metadataPath, '|')
                
            }else{
                try{
                    //get all metadata
                    try{
                        if((await checkFile(allMetadataPath)) === false){
                            await getCurrentYearMetadata(allMetadataPath);
                        }
                    }catch(e){
                        await deleteFile(allMetadataPath)
                        throw new Error('failed to get all metadata')
                    }
                    //compare to already scraped
                    try{
                        meetsArray = await filterAlreadyScrapedMeets(allMetadataPath, alreadyScrapedPath);
                        await betterWriteCSV(metadataPath, meetsArray, ['Meet','Level','Date','Results','Meet Url'], "|");
                        await addtoCSV(alreadyScrapedPath, meetsArray, '|');
                    }catch(e){
                        await deleteFile(metadataPath);
                        throw new Error('failed to filter already scraped meets')
                    }
                }catch(e){
                    throw new Error(e)
                }
            }

            //reads the success file so we can skip meets already scraped if there was an error scraping
            if(await fileExists(successPath)){
                successMeets = await readCsv(successPath, ',')
            }
        
            // for(meet of meetsArray){
            //     let successUrls = successMeets.map(el=> el['Meet Url'])
            //     let url = meet['Meet Url']
            //     console.log('scraping meet:', meet['Meet Url']);
            //     let path = `${folderName}/data/meet_${url}.csv`
                
            //     if(!successUrls.includes(url)){
            //         console.log('this is a new meet')
            //         let specificMeetRetries = 0;
            //         while(specificMeetRetries < 5){
            //             try{
            //                 await getOneMeetCsv(url, path)
            //                 await appendToCsv(successPath, Object.values(meet))
            //                 break;
            //             }catch(e){
            //                 await deleteFile(path)
            //                 if(specificMeetRetries > 4){
            //                     await appendToCsv(errorPath, Object.values(meet))
            //                     break;
            //                 }else{
            //                     specificMeetRetries++;
            //                 }
            //             }
            //         }
            //     }
            // }

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

run(5, './data/backfill')