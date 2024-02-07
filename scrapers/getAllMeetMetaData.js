const puppeteer = require('puppeteer')
const { createCSVfromArray, writeCSV } = require('../utils/csv_utils');
const { write } = require('fs');
const {handleTotalAthleteString, getAmountMeetsOnPage} = require('../utils/string_utils')
const {getMeetsOnPage,
    getTableWriteCsv} = require('../utils/scraping_utils')

//this could just grab the meet url?
async function getAllMeetMetaData(filePath, searchDate){
    console.log('running metadata scraper')
    let url = 'https://usaweightlifting.sport80.com/public/rankings/results/'
    
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({width:1500, height:1000})
    await page.goto(url, {
        waitUntil: 'networkidle0'
    })

    async function getMoreResultsOnPage(){
        await page.click('div.v-select__slot div.v-input__append-inner div.v-input__icon')
        await page.waitForSelector('div.v-menu__content')
        await page.click('div.v-menu__content div.v-list.v-select-list.v-sheet div.v-list-item.v-list-item--link:nth-of-type(6)')
        await page.waitForNetworkIdle()
        console.log('got more results on page')
    }

    async function getPageData(){
        return await page.$eval(
            ".data-table div div.v-data-table div.v-data-footer div.v-data-footer__pagination",
            x =>  x.textContent
        )
    }
   
    async function moveBackMonth(){
        await page.click("div.v-date-picker-header button.v-btn.v-btn--icon.v-btn--round.theme--light.v-size--default")
    }

    async function clickDate(){
        console.log('getting the date')
        await page.waitForSelector('div.v-date-picker-table table tbody tr td:nth-of-type(1) button.v-btn div.v-btn__content')
        // await page.screenshot({ path: 'date.png', fullPage: true })
        await page.click("div.v-date-picker-table table tbody tr td:nth-of-type(1) button.v-btn div.v-btn__content")  
    }

    async function clickApply(){
        console.log('clicking apply')
        await page.waitForSelector("div.v-card__actions.justify-end button.primary.my-2.v-btn.v-btn--is-elevated")
        // await page.screenshot({ path: 'apply.png', fullPage: true })
        await page.click("div.v-card__actions.justify-end button.primary.my-2.v-btn.v-btn--is-elevated", {
            waitUntil: 'networkidle0'
        })     
    }

    async function clickFilter(){
        console.log('clicking filter button')
        await page.click('.data-table div.container.pb-0 div.s80-filter div.row.no-gutters .v-badge button.v-btn');      
    }
    
    //takes pagination from 30/page to 50/page
    await getMoreResultsOnPage()

    await clickFilter()

    //waits for the date picker to be available and then clicks it
    await page.waitForSelector('#date_range_start', {visible:true})
    await page.click('#date_range_start')
    
    //waits for the < button to be visible and clickable
    await page.waitForSelector('div.v-date-picker-header__value div.accent--text', { visible:true })
    

    ///************** does month need to change?? ***/
    let month = '';
    //this could change to a certain date?
    //it finds the month name being January 2011 or whatever is declared
    while(month != searchDate){
        await moveBackMonth();
        month = await page.evaluate(()=>{
            return document.querySelector('div.v-date-picker-header__value div.accent--text button').textContent.trim()
        })
        // console.log(month)
    }
    console.log('got to', month)
    
//    await page.screenshot({ path: 'date.png', fullPage: true })
   
   await page.waitForNetworkIdle()
   await clickDate()
   await page.waitForNetworkIdle()
   await clickApply() 
   
   //waits for the data to actually load before we get all of the meet data
   await page.waitForNetworkIdle()
   await page.waitForNetworkIdle()
   
    // await page.screenshot({ path: 'page.png', fullPage: true })
    await getTableWriteCsv(filePath, page)

    console.log('starting scraping')
    
    await getMeetsOnPage(getAmountMeetsOnPage(await getPageData()), page, filePath);
    console.log(await getPageData())

    while(await handleTotalAthleteString(await getPageData())){
        console.log('getting meet metadata...')
        await Promise.all([
            page.waitForNetworkIdle(),
            page.click('.data-table div div.v-data-table div.v-data-footer div.v-data-footer__icons-after'),
        ]);
        console.log(await getPageData())
        
        await getMeetsOnPage(getAmountMeetsOnPage(await getPageData()), page, filePath)
    }

    console.log('getting resourses...')
    console.log(await getPageData())
    console.log('done scraping')

    await browser.close();
}


module.exports = {
    getAllMeetMetaData: getAllMeetMetaData
}
