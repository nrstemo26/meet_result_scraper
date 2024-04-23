//may need some refactoring to move thru quickly
const puppeteer = require('puppeteer')
const { createCSVfromArray, writeCSV } = require('../utils/csv_utils');
const {handleTotalAthleteString, getAmountMeetsOnPage} = require('../utils/string_utils')
const {getAthletesOnPage} = require('../utils/scraping_utils')

async function scrapeOneMeet(meetNumber, filePath){
    let baseUrl = 'https://usaweightlifting.sport80.com/public/rankings/results/'
    let url = baseUrl + meetNumber;
    
    
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
    
        
    const tableHeaderData = await page.evaluate(()=>{
        let elArr = Array.from(document.querySelectorAll(".data-table div div.v-data-table div.v-data-table__wrapper table thead tr th > span"))
        elArr = elArr.map((x)=>{
            return  x.textContent
        })
        return elArr
    })

    if(tableHeaderData.length > 0){
        // console.log('we got a meet')
        let headerCSV = tableHeaderData.join('|');
        headerCSV += '\n'
        writeCSV(filePath, headerCSV);
    }else{
        await browser.close()
        throw new Error('no meet available')
    }


    ///hunting in here
    await getAthletesOnPage(getAmountMeetsOnPage(await getPageData()), page, filePath);
    // console.log(await getPageData())

    while(await handleTotalAthleteString(await getPageData())){
        // console.log('getting resourses...')
        await Promise.all([
            page.waitForNetworkIdle(),
            page.click('.data-table div div.v-data-table div.v-data-footer div.v-data-footer__icons-after'),
        ]);
        // console.log(await getPageData())
        await getAthletesOnPage(getAmountMeetsOnPage(await getPageData()), page, filePath)
    }

    // console.log('getting resourses...')
    // console.log(await getPageData())
    // console.log('done scraping')

    await browser.close();
}


// scrapeOneMeet(444,'./meet_1.csv')
module.exports = {
    scrapeOneMeet:scrapeOneMeet
}