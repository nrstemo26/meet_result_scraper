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


    //this gets the weight class name
    async function getWeightClasses(selector){
        return await page.evaluate((selector)=>{
            let elArr = Array.from(document.querySelectorAll(selector))
            elArr = elArr.map((x)=>{
                return  x.textContent
            })
            return elArr
        },selector)
    }

    //lets just get the first set of results
    //the snatches then see if we can extrapolate that to get the cjs and then the totals
    //probaby going to need some nth of type situations
    //maybe we need a loop that's total weight classes on page
    // that creates one nth of type and then there may be some more of them?
    
    //get weightclass
    let menSelector = '#men_snatchjerk div.results__title div.container div.row div.col-12 h3'
    let mensWeightClasses = await getWeightClasses(menSelector)
    console.log(mensWeightClasses)

    let womenSelector = '#women_snatchjerk div.results__title div.container div.row div.col-12 h3'
    let womenWeightClasses = await getWeightClasses(womenSelector)

    
    for(let i=0; i<mensWeightClasses.length; i++ ){
        let weightClass = mensWeightClasses[i]
        let nthOfType = i+1;
        // console.log(i)

    }
    // this gets the rank column
    // let selector = 'div.results__title + div.results__title + div.cards div.card div.container div.row div.col-md-5 div.row div.col-2 p'

    //get the table headers
    //we don't need to scrape the total except for the total placing?

    //this gets all the snatches
    // let selector = 'div.results__title + div.results__title div.container div.row div.col-12 p + div.cards div.card div.container div.row div.col-md-5 div.row div.col-2 p'
    
    //this selector gets name rank nation
    let selector = 'div.results__title + div.results__title + div.cards div.card div.container'
    let snResults = await page.evaluate((selector)=>{
        console.log('getting sn results')
        let elArr = Array.from(document.querySelectorAll(selector))
        elArr = elArr.map((x)=>{
            return  x.textContent.trim()
        })

        const resultArray = elArr.map(x=> {
            const cleanedData = x.replace(/\n/g, '');
            const splitData = cleanedData.split(':').map(item => item.trim());
            return splitData.filter(item => item !== ''); 
        }); 
        
        
        console.log(resultArray);
        //needs to remove [0]
        return resultArray[0]
    }, selector)

    console.log(snResults)

    //the selector situation is going to be tricky for this guy

    //div.results__title === weightclass title
    //div.results__title === snatch
    //div.cards === all sn results
    //div.results__title === cj
    //div.cards === all cj results
    //div.results__title === total
    //div.cards === all total results

    //div.results_title == new weight class


    await page.screenshot({path: 'foo.png', fullPage: true})

    console.log('done')
    await browser.close();
}

scrapeOneMeet('https://iwf.sport/results/results-by-events/?event_id=576','./data/foo.csv')


module.exports = {
    scrapeOneMeet:scrapeOneMeet
}

