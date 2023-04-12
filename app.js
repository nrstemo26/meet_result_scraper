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
        let headerCSV = tableHeaderData.join(', ');
        headerCSV += '\n'
        writeCSV(csvName, headerCSV);
    }else{
        await browser.close()
        throw new Error('no meet available')
    }


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


async function getMultipleMeetResults(start,end){
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

//ex for scraping meets that there were errors on or double checking
//if they exist or not
// let missingArr1 = [ 5216,5217,5787,5788,5789,5790,5791,5792,5793,5794,5795,5796,5797,5798,5799,5800,5801,5802,5803,5804,5805,5806,5807,5808,5809,5810,5811,5812,5813,5814,5815,5816,5817,5818,5819,5820,5821,5822,5823,5824,5825,5826,5827,5828,5829,5830,5831,5832,5833,5834,5835,5836,5837,5838,5839,5840,5841,5842,5843,5844,5845,5846,5847,5848,5849,5850,5851,5852,5853,5854,5855,5856,5857,5858,5859,5860,5861,5862,5863,5864,5865,5866,5867,5868,5869,5870,5871,5872,5873,5874,5875,5876,5877,5878,5879,5880,5881,5882,5883,5884,5885,5886,5887,5888,5889,5890,5891,5892,5893,5894,5895,5896,5897,5898,5899,5900,5901,5902,5903,5904,5905,5906,5907,5908,5909,5910,5911,5912,5913,5914,5915,5916,5917,5918,5919,5920,5921,5922,5923,5924,5925,5926,5927,5928,5929,5930,5931,5932,5933,5934,5935,5936,5937,5938,5939,5940,5941,5942,5943,5944,5945,5946,5947,5948,5949,5950,5951,5952,5953,5954,5955,5956,5957,5958,5959,5960,5961,5962,5963,5964,5965,5966,5967,5968,5969,5970,5971,5972,5973,5974,5975,5976,5977,5978,5979,5980,5981,5982,5983,5984,5985,5986,5987,5988,5989,5990,5991,5992,5993,5994,5995,5996,5997,5998,5999 ]
// multipleMissingMeets(missingArr1)



//ex for scraping
//getMultipleMeetResults(6000,7000);