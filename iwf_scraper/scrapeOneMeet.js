//may need some refactoring to move thru quickly
const puppeteer = require('puppeteer')
const { createCSVfromArray, writeCSV } = require('../utils/csv_utils');
const {handleTotalAthleteString, getAmountMeetsOnPage} = require('../utils/string_utils')
const {getAthletesOnPage} = require('../utils/scraping_utils')

//TODOS
//get guys and girls results
//main function to get Athletes should be the same

//click men's sn,cj
//getAthletes

//click women's sn,cj
//getAthletes

//getAthletes
//find weightclass
//find sn -> scrape table
//find cj -> scrape table
//find total -> scrape table
//remove overlapping data



async function scrapeOneMeet(meetUrl, filePath){
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({width:1500, height:1000})
    await page.goto(meetUrl, {
        waitUntil: 'networkidle0'
    })
    
    //clicks men's snatch/cj/total btn
    await page.click('#results_mens_snatch', {
        waitUntil: 'networkidle0'
    }) 

    //clicks women's sn/cj/total btn
    // await page.click('#results_womens_snatch', {
        // waitUntil: 'networkidle0'
    // })

    async function getWeightClasses(selector){
        return await page.evaluate((selector)=>{
            let elArr = Array.from(document.querySelectorAll(selector))
            elArr = elArr.map((x)=>{
                return  x.textContent
            })
            return elArr
        },selector)
    }
    
    //get weightclass
    let menSelector = '#men_snatchjerk div.results__title div.container div.row div.col-12 h3'
    let mensWeightClasses = await getWeightClasses(menSelector)
   
    let womenSelector = '#women_snatchjerk div.results__title div.container div.row div.col-12 h3'
    let womenWeightClasses = await getWeightClasses(womenSelector)

    console.log(mensWeightClasses)
    console.log(womenWeightClasses)

    await page.screenshot({path: 'foo.png', fullPage: true})

    console.log('done')
    await browser.close();
}

scrapeOneMeet('https://iwf.sport/results/results-by-events/?event_id=576','./data/foo.csv')


module.exports = {
    scrapeOneMeet:scrapeOneMeet
}

