//NOT USED!!!!!!!!!!!!!!!!!
//this could be repurposed if its really slow to scrape with 
//getting every url every

// I need some function to go thru all the other 
// pages if necessary if the meet isnt found on the first page
// currently scrapes page one. returns an array with meetName and url

const puppeteer = require('puppeteer')
const {scrapeOneMeet: getOneMeetCSV} = require('./scrapeOneMeet')
const { createCSVfromArray, writeCSV } = require('../utils/csv_utils');
const {getDateMMDDYYYY} = require('../utils/date_utils');
const { write } = require('fs');


async function getAllMeetMetaData(csvName, meetsArr){
    //we dont need a meet number
    //the baseurl should preload some shit
    
    let url = 'https://usaweightlifting.sport80.com/public/rankings/results/'
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
    
    let allMeetsOnPage = await getMeetsOnPage(30, page);
    let matchedMeets = allMeetsOnPage.filter((meetName)=>{
        return meetsArr.includes(meetName)
    })
    
    //this doesn't need to be called
    async function newBrowserFindUrl(meetName){
        let url = 'https://usaweightlifting.sport80.com/public/rankings/results/'
        // let url = baseUrl + meetNumber;
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setViewport({width:1500, height:1000})
        await page.goto(url, {
            waitUntil: 'networkidle0'
        })

        const meetIndex = await getIndexFromMeetName(30, page, meetName)

        await page.click(`tbody tr:nth-of-type(${meetIndex}) td.text-end button.v-btn.v-btn--icon`)
                
                
        let viewBtnSelector = 'div.v-list.v-sheet div a div.v-list-item__content div.v-list-item__title';
        let viewBtn = 'div.v-list.v-sheet div a';
        await page.waitForSelector(viewBtnSelector)
        
        const meetHref = await page.$eval(viewBtn, anchor => anchor.getAttribute('href'));
        
        const meetHrefNum = meetHref.split('/')[4]
        // console.log(meetIndex) 
        // console.log('heres my new link,', meetHrefNum)
        await browser.close()
        return meetHrefNum;
        
    }

    //dont need this
    async function getMeetNameAndUrl(matchedMeets, page){
        let matchedMeetsUrl = []
        for(let i=0; i<matchedMeets.length; i++){
            let meet = matchedMeets[i]
            let meetUrl = await newBrowserFindUrl(meet)
            matchedMeetsUrl.push([meet,meetUrl])
        }
        return matchedMeetsUrl
    }
    //dont need this
    let meetArrWithUrl = await getMeetNameAndUrl(matchedMeets, page)

    console.log('getting resourses...')
    console.log(await getPageData())
    console.log('done scraping')


    await browser.close();
    return meetArrWithUrl
}


async function getMeetsOnPage(athletesOnPage, page){
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
        
        allAthleteData.push([...athleteData, i])
    }
    const allMeetData = allAthleteData.map(array => array[0])
    return allMeetData
}

async function getIndexFromMeetName(athletesOnPage, page, meetName){
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
        
        allAthleteData.push([...athleteData, i])
    }
   
    const allMeetData = allAthleteData.map(array =>[array[0], array[5]])
    //[0][1] gets the where athlete is on page
    const oneAthleteIndex = allMeetData.filter((meet)=> meet[0] == meetName)[0][1]
    return oneAthleteIndex;
}


function handleTotalAthleteString(str){
    let [curr, max] = str.split(' of ')
    curr = curr.split('-')[1]
    curr = parseInt(curr)
    max = parseInt(max)
    return curr < max;
}


//i need to do some shit if there isn't a new meet on the 
//first page and we need to search in a few layers

async function searchForNewMeets(meetsArr){
    const meetsArrWithUrl = await getAllMeetMetaData('dingus', meetsArr)
    return meetsArrWithUrl;
}

module.exports ={
    searchForNewMeets: searchForNewMeets,
    getAllMeetMetaData:getAllMeetMetaData,
}

