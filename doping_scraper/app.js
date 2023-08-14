//may need some refactoring to move thru quickly
const puppeteer = require('puppeteer')
const { createCSVfromArray, writeCSV } = require('../utils/csv_utils');

async function scrapeDopers(){
    const url = 'https://ita.sport/sanction/international-weightlifting-federation-iwf/'
   
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({width:1500, height:1000})
    await page.goto(url, {
        waitUntil: 'networkidle0'
    })

    console.log('scraping dopers')

    const tableHeaderData = await page.evaluate(()=>{
        let elArr = Array.from(document.querySelectorAll("table thead.pl-thead tr td"))
        elArr = elArr.map((x)=>{
            return  x.textContent
        })
        return elArr
    })
    let headerCSV = tableHeaderData.join('|');
    headerCSV += '\n'
    writeCSV('dopers.csv', headerCSV);
    
    

    async function getDopersOnPage(athletesOnPage, page){
        let allAthleteData =[];
        for(let i = 1; i <= athletesOnPage; i++){
            let athleteData = await page.evaluate((index)=>{
                let selector = `table tbody.pl-tbody tr:nth-of-type(${index}) td`
                // let selector = ".data-table div div.v-data-table div.v-data-table__wrapper table tbody tr:nth-of-type("+ index +") td > div"
                let elArr = Array.from(document.querySelectorAll(`${selector}`))
                elArr = elArr.map((x)=>{
                    return  x.textContent.trim()
                })
                return elArr
            },i)
            allAthleteData.push(athleteData)
        }
    
        let weightliftingCSV = createCSVfromArray(allAthleteData);
        writeCSV('dopers.csv', weightliftingCSV)    
    }
    const numberOfDopers = await page.$$(`table tbody.pl-tbody tr`)
    await getDopersOnPage(numberOfDopers.length,page)

  
    console.log('done scraping')

    await browser.close();
}

// scrapeDopers();