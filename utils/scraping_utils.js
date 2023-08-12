const { createCSVfromArray, writeCSV } = require("./csv_utils");


//gets all athletes on the page
async function getAthletesOnPage(athletesOnPage, page , filePath){
    let allAthleteData =[];
    for(let i = 1; i <= athletesOnPage; i++){
        let athleteData = await page.evaluate((index)=>{
            let selector = ".data-table div div.v-data-table div.v-data-table__wrapper table tbody tr:nth-of-type("+ index +") td > div"
            let elArr = Array.from(document.querySelectorAll(`${selector}`))
            elArr = elArr.map((x)=>{
                return  x.textContent.trim()
            })
            return elArr
        },i)
        // athleteData = athleteData.map(x=> x.replace(',',' ').trim())

        allAthleteData.push(athleteData)
    }

    let weightliftingCSV = createCSVfromArray(allAthleteData);
    writeCSV(filePath, weightliftingCSV)    
}

//clicks button for metadata to access the meet urls
//helps with later scraping
async function getMeetUrl(index, page){
    //click on a random element first
    await page.click('h2.flex-shrink-0.align-self-end.subtitle-1', {waitUntil:'visible'})
    
    //click the elipses button on the specific element
    await page.click(`tbody tr:nth-of-type(${index}) td.text-end button.v-btn.v-btn--icon`)        
    
    //wait for the view button to pop up
    let viewBtnSelector = 'div.v-menu__content.menuable__content__active div.v-list.v-sheet div a div.v-list-item__content div.v-list-item__title';
    await page.waitForSelector(viewBtnSelector, {waitUntil:'visible'})
    
    //get the href value of the view button
    let viewBtn = 'div.v-menu__content.menuable__content__active div.v-list.v-sheet div a';
    const meetHref = await page.$eval(viewBtn, anchor => anchor.getAttribute('href'));
    const meetHrefNum = meetHref.split('/')[4]
    return meetHrefNum;
}

//gets you 1-30 of total entries
//this gets used to track progress of meet/athlete scrapers
async function getPageData(page){
    return await page.$eval(
        ".data-table div div.v-data-table div.v-data-footer div.v-data-footer__pagination",
        x =>  x.textContent
    )
}

async function getTableHeaderData (page){
    return await page.evaluate(()=>{
        let elArr = Array.from(document.querySelectorAll(".data-table div div.v-data-table div.v-data-table__wrapper table thead tr th > span"))
        elArr = elArr.map((x)=>{
            return  x.textContent
        })
        return elArr
    })
}

//used for meet metadata
async function getTableWriteCsv(filePath, page){
    let tableHeaderData = await getTableHeaderData(page)
    tableHeaderData[4]= 'Meet Url'
    console.log(tableHeaderData)
    let headerCSV = tableHeaderData.join('|');
    headerCSV += '\n'
    writeCSV(filePath, headerCSV);
}


async function getMeetsOnPage(athletesOnPage, page , filePath){
    let allAthleteData =[];
    for(let i = 1; i <= athletesOnPage+1; i++){
        //can remove to have the scraper move quicker
        let meetUrl = await getMeetUrl(i, page);
        let athleteData = await page.evaluate((index)=>{
            let selector = ".data-table div div.v-data-table div.v-data-table__wrapper table tbody tr:nth-of-type("+ index +") td > div"
            let elArr = Array.from(document.querySelectorAll(`${selector}`))
            elArr = elArr.map((x)=>{
                return  x.textContent.trim()
            })
            return elArr
        },i)
        //needs to change too
        athleteData[athleteData.length-1] = meetUrl
        //removes last element the non used action empty guy?
        //athleteData.pop()
        // console.log(athleteData)
        allAthleteData.push(athleteData)
    }

    let weightliftingCSV = createCSVfromArray(allAthleteData);
    writeCSV(filePath, weightliftingCSV)    
}

async function clickFilter(page){
    console.log('clicking filter button')
    await page.click('.data-table div.container.pb-0 div.s80-filter div.row.no-gutters .v-badge button.v-btn');      
}

async function clickApply(page){
    console.log('clicking apply')
    await page.waitForSelector("div.v-card__actions.justify-end button.primary.my-2.v-btn.v-btn--is-elevated")
    await page.click("div.v-card__actions.justify-end button.primary.my-2.v-btn.v-btn--is-elevated", {
        waitUntil: 'networkidle0'
    })     
}
async function clickDate(page){
    console.log('getting the date')
    await page.waitForSelector('div.v-date-picker-table table tbody tr td:nth-of-type(1) button.v-btn div.v-btn__content')
    await page.click("div.v-date-picker-table table tbody tr td:nth-of-type(1) button.v-btn div.v-btn__content")  
}
async function moveBackMonth(page){
    await page.click("div.v-date-picker-header button.v-btn.v-btn--icon.v-btn--round.theme--light.v-size--default")
}


module.exports = {
    getAthletesOnPage,
    getMeetUrl,
    getPageData,
    getTableHeaderData,
    getMeetsOnPage,
    moveBackMonth,
    clickApply,
    clickDate,
    clickFilter,
    getTableWriteCsv,

}