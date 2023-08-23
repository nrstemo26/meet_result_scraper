const {getYearMetadata} = require('./getYearMetadata')
const {scrapeOneMeet} = require('./scrapeOneMeet') 
const {writeCsv} = require('./csv_utils')

// lets pseudo code the main project
// build a scrape 1 meet with url
// there are search queries in the url for
// ?event_year=2018 

// url for new weightclasses 2018 2023
// https://iwf.sport/results/results-by-events/?event_year=2018

// url for old weight classes goes from 1998 2018(no meets on 2019)
// https://iwf.sport/results/results-by-events/results-by-events-old-bw/?event_year=2000

//metadata scraper
//needs to scrape 2 urls
//results by events/
//results by events/results-by-events-old-bw/
//if we put the meet url as the whole url then we can go thru that meet metadata 
//doc easily without
async function run(){
    console.log('running')
let allMeetMetadata = [];


let allUrls = []
//scrapes new weightclasses metadata
for (let i = 2018; i < 2024; i++){
    console.log('getting year ' + i)
    let yearMetadataUrl = `https://iwf.sport/results/results-by-events/?event_year=${i}`
    if(i == 2023){
         yearMetadataUrl = `https://iwf.sport/results/results-by-events/`
    }
    let {yearMetadata, urls} = await getYearMetadata(yearMetadataUrl)
    allMeetMetadata.push(...yearMetadata)
    allUrls.push(...urls)
}

 
let oldUrls = []
//scrapes old weightclasses metadata
for (let i = 1998; i < 2019; i++){
    let yearMetadataUrl = `https://iwf.sport/results/results-by-events/results-by-events-old-bw/?event_year=${i}` 
    let {yearMetadata, urls} = await getYearMetadata(yearMetadataUrl, true)
    allMeetMetadata.push(...yearMetadata)
    oldUrls.push(...urls)
}

//write allmeet metadata to csv
writeCsv(allMeetMetadata,'./iwf_scraper/metadata.csv')

//scrape meets off of old urls
for(let i=0; i<oldUrls.length; i++){
    await scrapeOneMeet(`https://iwf.sport/results/results-by-events/results-by-events-old-bw/${oldUrls[i]}`, './iwf_scraper/data/')
}

//scrape meets off new urls
for(let i=0; i<allUrls.length; i++){
    await scrapeOneMeet(`https://iwf.sport/results/results-by-events/${allUrls[i]}`, './iwf_scraper/data/')
}


}

run()