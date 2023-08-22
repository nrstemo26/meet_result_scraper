const puppeteer = require('puppeteer')

async function getYearMetadata(url, filePath){
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({width:1500, height:1000})
    await page.goto(url, {
        waitUntil: 'networkidle0'
    })

    console.log('starting')

 
    const allMeetEls = await page.$('.cards')
    let meetUrlIds = await allMeetEls.$$eval('a.card',el=> el.map(x=> x.getAttribute('href')))
   
   
    let {titles,
        dates,
        locations} = await allMeetEls.evaluate((document)=>{
            let titles = Array.from(document.querySelectorAll('a.card p.title'))
            titles = titles.map(el=> el.textContent)
            let dates = []
            let locations = []
            let data = Array.from(document.querySelectorAll('a.card p.normal__text'))
            data = data.map(el=>{
              return el.textContent.trim()
            })
            for (let i = 0; i < data.length; i++) {
                if (i % 2 === 0) dates.push(data[i]);
                else locations.push(data[i]);
            }
            return {
                titles,
                dates,
                locations                
            }
        },allMeetEls)
    let combinedObjs = [];

    for (let i = 0; i < titles.length; i++) {
        const obj = {
            title: titles[i],
            date: dates[i],
            location: locations[i],
            'meet url id': meetUrlIds[i]
        };
        combinedObjs.push(obj);
    }
    // console.log(combinedObjs)
    
    console.log('done')
    browser.close()
    return {
        yearMetadata:combinedObjs,
        urls: meetUrlIds
    }
}

module.exports = {
    getYearMetadata: getYearMetadata
}