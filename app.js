//may need some refactoring to move thru quickly
const puppeteer = require('puppeteer')
const { createCSVfromArray, writeCSV } = require('./utils/csv_utils');
const {handleTotalAthleteString, getAmountMeetsOnPage} = require('./utils/string_utils')
const {getAthletesOnPage} = require('./utils/scraping_utils')

async function start(meetNumber, filePath){
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
        let headerCSV = tableHeaderData.join('|');
        headerCSV += '\n'
        writeCSV(filePath, headerCSV);
    }else{
        await browser.close()
        throw new Error('no meet available')
    }


    await getAthletesOnPage(getAmountMeetsOnPage(await getPageData()), page, filePath);
    console.log(await getPageData())

    while(await handleTotalAthleteString(await getPageData())){
        console.log('getting resourses...')
        await Promise.all([
            page.waitForNetworkIdle(),
            page.click('.data-table div div.v-data-table div.v-data-footer div.v-data-footer__icons-after'),
        ]);
        console.log(await getPageData())
        await getAthletesOnPage(getAmountMeetsOnPage(await getPageData()), page, filePath)
    }

    console.log('getting resourses...')
    console.log(await getPageData())
    console.log('done scraping')

    await browser.close();
}


async function getMultipleMeetResults(start, end){
    let noMeet = [];
    for(let i=start; i< end; i++){
        console.log('getting results for meet ' + i);
        let meetName = 'meet_' + i;
        try{
            await start(i, meetName);
        }catch(e){
            noMeet.push(i);
            console.error(e);
        }
    }

    console.log('no meets at ids \n' + noMeet);
}

async function multipleMissingMeets(missingArr){
    let noMeet = [];

    for(let meetUrl of missingArr){
        console.log('getting results for meet ' + meetUrl);
        let meetName = 'meet_' + meetUrl;
        try{
            await start(meetUrl, meetName);
        }catch(e){
            noMeet.push(meetUrl);
            console.error(e);
        }
    }
    console.log('no meets at ids \n' + noMeet);
}


module.exports = {
    start:start
}