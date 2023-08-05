const puppeteer = require('puppeteer')
const { createCSVfromArray, writeCSV } = require('../utils/csv_utils');
const {getDateMMDDYYYY} = require('../utils/date_utils');
const { write } = require('fs');

async function getAllMeetMetaData(csvName){
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
    //good to here

    async function getPageData(){
        return await page.$eval(
            ".data-table div div.v-data-table div.v-data-footer div.v-data-footer__pagination",
            x =>  x.textContent
        )
    }

    //adjust the date situation
    //get filter button  
    // click filter button
    //take screenshot
    //get date start range button
    //click date start range button
    //move backwards in time
    
    async function moveBackMonth(){
        // get the date range inner text
        console.log('working our way back')
        await page.waitForTimeout(2000)
        page.click("div.v-date-picker-header button.v-btn.v-btn--icon.v-btn--round.theme--light.v-size--default")
        // selector 'div.v-dialog div.v-card div.v-card__text div.s80-date-picker div.v-input div.v-input__control div.v-input__Slot div.v-text-field label  '
        // text should say Date Range Start
    }
    async function clickDate(){
        console.log('getting the date')
        await page.waitForTimeout(2000)
        const bar = await page.$eval("div.v-date-picker-table table tbody tr td:nth-of-type(1) button.v-btn div.v-btn__content", el => el.textContent)
        // console.log(bar)
        page.click("div.v-date-picker-table table tbody tr td:nth-of-type(1) button.v-btn div.v-btn__content")  
    }

    async function clickApply(){
        console.log('clicking apply')
        await page.waitForTimeout(2000)
        page.click("div.v-card__actions.justify-end button.primary.my-2.v-btn.v-btn--is-elevated")  
    
    }

    async function clickFilter(){
        console.log('clicking filter button')
        await Promise.all([
            page.waitForNetworkIdle(),
            page.click('.data-table div.container.pb-0 div.s80-filter div.row.no-gutters .v-badge button.v-btn'),
        ]);

        await page.waitForTimeout(2000)
        
        const bar = await page.$eval("#date_range_start", el => el.value)
        // console.log(bar)
        
        page.screenshot({path: 'filter.png', fullPage: true})
        
        //this clicks and opens the date selector
        await page.click('#date_range_start')

        for(let i=0; i<3; i++){
            console.log(i)
            await moveBackMonth()
        }
        
        await clickDate()
        await clickApply()
        await page.waitForTimeout(5000)         
    }


    
    await clickFilter()
    // console.log('taking screenshot')
    // await page.screenshot({path: 'meet.png', fullPage: true})



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



console.log(getDateMMDDYYYY())
   
//all-meets-MM-DD-YYYYY

//getAllMeetMetaData('foo-'+ getDateMMDDYYYY())
// getAllMeetMetaData('foo-7-28-2023')
