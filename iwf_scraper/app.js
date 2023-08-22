const {getYearMetadata} = require('./getYearMetadata')

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
let allMeetMetadata = [];
let urls = []

let yearMetadataUrl = `https://iwf.sport/results/results-by-events/?event_year=${2023}`
getYearMetadata(yearMetadataUrl)

//scrapes new weightclasses
for (let i = 2018; i < 2024; i++){
    let yearMetadataUrl = `https://iwf.sport/results/results-by-events/?event_year=${i}`
    //scrape this year's metadata
    //push to all meet metadata
    //push urls to urls
}

let oldUrls = []
//scrapes old weightclasses
// for (let i = 1998; i < 2019; i++){
    //     let yearMetadataUrl = `https://iwf.sport/results/results-by-events/results-by-events-old-bw/?event_year=${i}` 
    //     //add an old weightclass: true
    //     //scrape this year's metadata
//     //push to all meet metadata
//     //push urls to oldUrls
// }



//loop thru new meets w/ urls
//scrape 1 meet(url,)
//loop thru old meets w/ urls




// get meet metadata
// have it return an array of  ?event_id=562
// use array to loop and scrape 1 meet with id
//