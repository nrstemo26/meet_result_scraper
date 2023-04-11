const puppeteer = require('puppeteer')
const fs = require('fs/promises')

async function start(meetNumber, csvName){
    let baseUrl = 'https://usaweightlifting.sport80.com/public/rankings/results/'
    let url = baseUrl + meetNumber;
   
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({width:1500, height:1000})
    await page.goto(url, {
        waitUntil: 'networkidle0'
    })
    //good to here except for url handling


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

    writeCSV(csvName, headerCSV);


    
    getAthletesOnPage(30, page)


    await browser.close();
}

async function getAthletesOnPage(athletesOnPage, page){
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
    console.log(allAthleteData)  

    
}

function createCSVfromArray(arr){
    let newCSV = arr.map( (el)=> {
        return el.join(', ')
    }).join('\n')
    newCSV += '\n'
    return newCSV;
}
async function writeCSV(meetPath, data){
    let fullPath = './data/' + meetPath + '.csv';
    await fs.writeFile(fullPath, data, {flag:"a+"}, err =>{
        if(err){
            console.error(err);
        }
    })
}

function handleTotalAthleteString(str){
    let [curr, max] = str.split(' of ')
    curr = curr.split('-')[1]
    curr = parseInt(curr)
    max = parseInt(max)
    return curr < max;
}

async function getPageData(page){
    return await page.$eval(
        ".data-table div div.v-data-table div.v-data-footer div.v-data-footer__pagination",
        x =>  x.textContent
    )
}


start('5738', 'university2023')