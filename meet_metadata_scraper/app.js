const puppeteer = require('puppeteer')
const { createCSVfromArray, writeCSV } = require('../utils/csv_utils');
const { write } = require('fs');

async function getAllMeetMetaData(csvName){
    console.log('running metadata scraper')
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
   
    async function moveBackMonth(){
        await page.click("div.v-date-picker-header button.v-btn.v-btn--icon.v-btn--round.theme--light.v-size--default")
    }

    async function clickDate(){
        console.log('getting the date')
        page.click("div.v-date-picker-table table tbody tr td:nth-of-type(1) button.v-btn div.v-btn__content")  
    }

    //apply should always be there. after clicking the date so we might not need to 
    async function clickApply(){
        console.log('clicking apply')
        //we need to wait for network idel
        await Promise.all([
            page.waitForNetworkIdle(),
            page.click("div.v-card__actions.justify-end button.primary.my-2.v-btn.v-btn--is-elevated")  
        ]);
    
    }

    async function clickFilter(){
        console.log('clicking filter button')
        await page.click('.data-table div.container.pb-0 div.s80-filter div.row.no-gutters .v-badge button.v-btn');      
    }
    
    await clickFilter()

    //waits for the date picker to be available and then clicks it
    await page.waitForSelector('#date_range_start', {visible:true})
    await page.click('#date_range_start')
    
    //waits for the < button to be visible and clickable
    await page.waitForSelector('div.v-date-picker-header__value div.accent--text', { visible:true })
    
    let month = '';
    //it finds the month name being January 2011
    while(month != 'January 2011'){
        // console.log('in loop')
        await moveBackMonth();
        month = await page.evaluate(()=>{
            return document.querySelector('div.v-date-picker-header__value div.accent--text button').textContent.trim()
        })
        // console.log(month)
    }
    console.log('got to', month)
    
    await clickDate()
    await clickApply() 


    const tableHeaderData = await page.evaluate(()=>{
        let elArr = Array.from(document.querySelectorAll(".data-table div div.v-data-table div.v-data-table__wrapper table thead tr th > span"))
        elArr = elArr.map((x)=>{
            return  x.textContent
        })
        return elArr
    })
    let headerCSV = tableHeaderData.join(', ');
    headerCSV += '\n'
    writeCSV('meet-metadata',csvName, headerCSV);

    
    await getMeetsOnPage(30, page, csvName);

    while(await handleTotalAthleteString(await getPageData())){
        console.log('getting meet metadata...')
        console.log(await getPageData())
        await Promise.all([
            page.waitForNetworkIdle(),
            page.click('.data-table div div.v-data-table div.v-data-footer div.v-data-footer__icons-after'),
        ]);
        await getMeetsOnPage(30, page, csvName)
    }

    console.log('getting resourses...')
    console.log(await getPageData())
    console.log('done scraping')


    await browser.close();
}

async function getMeetsOnPage(athletesOnPage, page , csvName){
    let allAthleteData =[];
    for(let i = 1; i <= athletesOnPage; i++){
        let athleteData = await page.evaluate((index)=>{
            let selector = ".data-table div div.v-data-table div.v-data-table__wrapper table tbody tr:nth-of-type("+ index +") td > div"
            let elArr = Array.from(document.querySelectorAll(`${selector}`))
            elArr = elArr.map((x)=>{
                return  x.textContent
            })
            return elArr
        },i)
        athleteData = athleteData.map(x=> x.replace(',',' ').trim())
        allAthleteData.push(athleteData)
    }

    let weightliftingCSV = createCSVfromArray(allAthleteData);
    writeCSV('meet-metadata',csvName, weightliftingCSV)    
}


function handleTotalAthleteString(str){
    let [curr, max] = str.split(' of ')
    curr = curr.split('-')[1]
    curr = parseInt(curr)
    max = parseInt(max)
    return curr < max;
}


module.exports = {
    getAllMeetMetaData: getAllMeetMetaData
}

   
//all-meets-MM-DD-YYYYY

//getAllMeetMetaData('foo-'+ getDateMMDDYYYY())
// getAllMeetMetaData('foo-7-28-2023')
