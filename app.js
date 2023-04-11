const puppeteer = require('puppeteer')
const fs = require('fs/promises')
const meet_website_data = require('./meet_website_data/website_data').data
console.log(meet_website_data)


async function start(meetNumber, csvName){
    let baseUrl = 'https://usaweightlifting.sport80.com/public/rankings/results/'
    let url = baseUrl + meetNumber;
   
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

    await getAthletesOnPage(30, page, csvName);

    while(await handleTotalAthleteString(await getPageData())){
        console.log('getting resourses...')
        console.log(await getPageData())
        await Promise.all([
            page.waitForNetworkIdle(),
            page.click('.data-table div div.v-data-table div.v-data-footer div.v-data-footer__icons-after'),
        ]);
        await getAthletesOnPage(30, page, csvName)
    }

    console.log('getting resourses...')
    console.log(await getPageData())
    console.log('done scraping')

    await browser.close();
}

async function getAthletesOnPage(athletesOnPage, page , csvName){
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
    writeCSV(csvName, weightliftingCSV)    
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




//uncomment to scrape an example meet
// start('5738', 'university2023')