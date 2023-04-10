const puppeteer = require('puppeteer')

async function start(){
    let url = 'https://usaweightlifting.sport80.com/public/rankings/results/5738'
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, {
        waitUntil: 'networkidle0'
    })

    // await page.screenshot({path: 'meet.png', fullPage: true})

    const tableHeaderData = await page.evaluate(()=>{
        let elArr = Array.from(document.querySelectorAll(".data-table div div.v-data-table div.v-data-table__wrapper table thead tr th > span"))
        elArr = elArr.map((x)=>{
            return  x.textContent
        })
        return elArr
    })
    
    // let athleteData = await page.evaluate((index)=>{
    //     let selector = ".data-table div div.v-data-table div.v-data-table__wrapper table tbody tr:nth-of-type("+ index +") td > div"
    //     let elArr = Array.from(document.querySelectorAll(`${selector}`))
    //     elArr = elArr.map((x)=>{
    //         return  x.textContent
    //     })
    //     return elArr
    // },1)

    getAllAthletes(30, page)
    // console.log(athleteData)

}

async function getAllAthletes(athletesOnPage, page){
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


start()