const puppeteer = require('puppeteer')
const { createCSVfromArray, writeCSV } = require('./utils/csv_utils');
const {getDateMMDDYYYY} = require('./utils/date_utils');
const { write } = require('fs');
const {startBrowserAndGetPage} = require('./utils/scraping_utils')

let meetsOnPage = []

async function getAllMeetMetaData(csvName,meetsArr){
    //we dont need a meet number
    //the baseurl should preload some shit
    
    let url = 'https://usaweightlifting.sport80.com/public/rankings/results/'
    // let url = baseUrl + meetNumber;
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({width:1500, height:1000})
    await page.goto(url, {
        waitUntil: 'networkidle0'
    })
    

    async function getPageData(){
        return await page.$eval(
            ".data-table div div.v-data-table div.v-data-footer div.v-data-footer__pagination",
            x =>  x.textContent
        )
    }
  
    // async function clickFilter(){
    //     console.log('clicking filter button')
    //     await Promise.all([
    //         page.waitForNetworkIdle(),
    //         page.click('.data-table div.container.pb-0 div.s80-filter div.row.no-gutters .v-badge button.v-btn'),
    //     ]);

    //     await page.waitForTimeout(2000)
        
    //     // const bar = await page.$eval("#date_range_start", el => el.value)
    //     // console.log(bar)
        
    //     page.screenshot({path: 'filter.png', fullPage: true})
        
    //     //this clicks and opens the date selector
    //     // await page.click('#date_range_start')

    //     // for(let i=0; i<3; i++){
    //     //     console.log(i)
    //     //     await moveBackMonth()
    //     // }
        
    //     // await clickDate()
    //     // await clickApply()
    //     // await page.waitForTimeout(5000)         
    // }


    
    // await clickFilter()
    // console.log('taking screenshot')
    // await page.screenshot({path: 'meet.png', fullPage: true})



    // const tableHeaderData = await page.evaluate(()=>{
    //     let elArr = Array.from(document.querySelectorAll(".data-table div div.v-data-table div.v-data-table__wrapper table thead tr th > span"))
    //     elArr = elArr.map((x)=>{
    //         return  x.textContent
    //     })
    //     return elArr
    // })
    // let headerCSV = tableHeaderData.join(', ');
    // headerCSV += '\n'
    // writeCSV('meet-metadata',csvName, headerCSV);
    
    
    let allMeetsOnPage = await getMeetsOnPage(30, page, csvName);
    let matchedMeets = allMeetsOnPage.filter(([meetName, index])=>{
        return meetsArr.includes(meetName)
    })
    console.log(matchedMeets)
    //do i need to filter the meetsArr???

    //now i need to 
    
     


    //needs to be uncommented
    // while(await handleTotalAthleteString(await getPageData())){
    //     console.log('getting meet metadata...')
    //     console.log(await getPageData())
    //     await Promise.all([
    //         page.waitForNetworkIdle(),
    //         page.click('.data-table div div.v-data-table div.v-data-footer div.v-data-footer__icons-after'),
    //     ]);
    //     await getMeetsOnPage(30, page, csvName)
    // }

    console.log('getting resourses...')
    console.log(await getPageData())
    console.log('done scraping')


    await browser.close();
}

//get meet name
async function getMeetsOnPage(athletesOnPage, page , csvName){
    let allAthleteData =[];
    for(let i = 1; i <= athletesOnPage; i++){
        console.log('attempt ' + i)
        let athleteData = await page.evaluate((index)=>{
            let selector = ".data-table div div.v-data-table div.v-data-table__wrapper table tbody tr:nth-of-type("+ index +") td > div"
            let elArr = Array.from(document.querySelectorAll(`${selector}`))
            elArr = elArr.map((x)=>{
                return  x.textContent
            })
            return elArr
        },i)
        athleteData = athleteData.map((x => x.trim()))
        allAthleteData.push([...athleteData, i])
    }
    const allMeetData = allAthleteData.map(array => [array[0], array[5]])
    return allMeetData
}



function handleTotalAthleteString(str){
    let [curr, max] = str.split(' of ')
    curr = curr.split('-')[1]
    curr = parseInt(curr)
    max = parseInt(max)
    return curr < max;
}


async function searchForNewMeets(meetsArr){
    console.log('jfskd')
    console.log(meetsArr)

    await getAllMeetMetaData('dingus', meetsArr)

    return meetsArr;
}

module.exports ={
    searchForNewMeets: searchForNewMeets,
}