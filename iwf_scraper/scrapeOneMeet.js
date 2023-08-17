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

//todos
//i get an object of athlete results for one weightclass
//i need to write that to csv before going to the next loop
//then hook up to loop thru each weight class
//then click female button then do the same thing again
//no total in there yet either
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

    
    //get weightclass
    let menSelector = '#men_snatchjerk div.results__title div.container div.row div.col-12 h3'
    let mensWeightClasses = await getWeightClasses(menSelector)
    // console.log(mensWeightClasses)

    let womenSelector = '#women_snatchjerk div.results__title div.container div.row div.col-12 h3'
    let womenWeightClasses = await getWeightClasses(womenSelector)

    for(let i=0; i<mensWeightClasses.length; i++ ){
        //needs to get added to one of the evaluates to add the weight class in for the athletes
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
    let snHeaderSelector = 'div.results__title + div.results__title + div.cards div.card.card__legend div.container'
    let snHeaders = await page.evaluate((selector)=>{
        let headers = Array.from(document.querySelectorAll(selector))
        headers = headers.map((x)=>{
            return  x.textContent.trim()
        })

        let cleanedHeaders = headers.map(x=> {
            const cleanedData = x.replace(/\n/g, '');
            const splitData = cleanedData.split(':').map(item => item.trim());
            return splitData.filter(item => item !== ''); 
        }); 
        cleanedHeaders = cleanedHeaders.map(x=>{
            x[0] = 'sn ' + x[0]
            x[6] = 'sn ' + x[6]
            x[7] = 'sn ' + x[7]
            x[8] = 'sn ' + x[8]
            x[9] = 'best sn'
            return x

        })
        
        
        //needs to remove [0]
        return cleanedHeaders[0]
        // return headerArr[0]
    }, snHeaderSelector)

    // should return
    //                                     change to BW
    // [  'Sn Rank', 'Name', 'Nation','Born', 'B.weight', 'Group','Sn 1', 'Sn 2', 'Sn 3', 'Best Sn' ]
    console.log(snHeaders)


    let snSelector = 'div.result__container.active div.results__title:nth-of-type(1) + div.results__title + div.cards div.card div.container'
    //needs to get the strike
    let snatches = await page.evaluate((selector)=>{
        let snatches = Array.from(document.querySelectorAll(selector))
        snatches = snatches.map((x)=>{
            return  x.textContent.trim()
        })
        
        let cleanedSnatches = snatches.map(x=> {
            const cleanedData = x.replace(/\n/g, '&');
            const splitData = cleanedData.split(/[:&]/).map(item => item.trim());
            return splitData.filter(item => item !== ''); 
            
        }); 
        let headersRemoved = cleanedSnatches.map(x=>{
            x[0] = '';
            x[4] = '';
            x[6] = '';
            x[8] = '';
            x[10] = '';
            x[12] = '';
            x[14] = '';
            x[16] = '';
            return x.filter(item => item !== '').slice(0,-4)
        }).map((el)=>{
            return {
                "sn rank": el[0],
                'name': el[1],
                'country': el[2],
                'birthday': el[3],
                'bw': el[4],
                'session': el[5],
            }

        })
        //headers need to be removed
        return headersRemoved.slice(1)
    }, snSelector)
    // console.log(snatches)
    
    //gets all the snatches with make or miss indications(- before number is a miss)
    async function getMakeMisses (classIndex, snatch=true){
        //first nth of type is weight class 2nd nth of type is 
        let missSelector;
        if(snatch){
            missSelector = 'div.result__container.active div.results__title:nth-of-type('+ classIndex +') + div.results__title + div.cards div.card div.container div.col-md-3 div.row.no-gutters p'
        }else{
            missSelector = 'div.result__container.active div.results__title:nth-of-type('+ classIndex +') + div.results__title + div.cards + div.results__title + div.cards div.card div.container div.col-md-3 div.row.no-gutters p'
        }
        return await page.evaluate((selector, snatch)=>{
            let snatches = Array.from(document.querySelectorAll(selector))
            //this is getting the inner html of if there is a strike or not!!!
            snMakes = snatches.map(div => {
                if(div.childNodes[2]){
                    return div.childNodes[2].innerHTML
                }
                return ''
            });
            snatches = snatches.map((x)=>{
                return  x.textContent.trim()
            })
        
            // return snatch [1, 2, 3, total]
            let cleanedSnatches = snatches.map(x=> x.split(/[:]/).map((x)=> x.trim())).map((x)=>x[1]);
            snMakes.map((element, index)=>{
                if(element && element.includes('<strike>')){
                   cleanedSnatches[index] = '-'+ cleanedSnatches[index]
                }
                return element
            })
    
            let cleanedArr = [];
            for (let i = 4; i < cleanedSnatches.length; i += 4) {
                cleanedArr.push(cleanedSnatches.slice(i, i + 4));
            }
    
            cleanedArr = cleanedArr.map(el=>{
                if(snatch){
                    return {
                    'sn 1': el[0],
                    'sn 2': el[1],
                    'sn 3': el[2],
                    'best sn': el[3],
                    }
                }else{
                    return {
                        'cj 1': el[0],
                        'cj 2': el[1],
                        'cj 3': el[2],
                        'best cj': el[3],
                    }
                }
            })
            return cleanedArr    
            return headersRemoved[1]
        }, missSelector, snatch)
    }
    let snMakes = await getMakeMisses(1)

    function combineArrofObjs(arr1,arr2){
        let combinedArr = []
        for(let i = 0; i < arr1.length; i++){
            combinedArr[i] = { ...arr1[i], ...arr2[i] }
        }
        return combinedArr;
    }
    let combinedSn = combineArrofObjs(snatches,snMakes)
    console.log(combinedSn)

    

    let cjMakes = await getMakeMisses(1,false)
    console.log(cjMakes)


    //need something to grab just the name and place for cjs
    //name and place for total too
    async function getNameAndPlace(classIndex, isCj=true){
        let selector;
        let cjSelector = 'div.result__container.active div.results__title:nth-of-type('+ classIndex +') + div.results__title + div.cards + div.results__title + div.cards div.card div.container div.row.no-gutters a.col-md-5 div.row.no-gutters';
        let totalSelector = 'div.result__container.active div.results__title:nth-of-type('+ classIndex +') + div.results__title + div.cards + div.results__title + div.cards + div.results__title + div.cards div.card div.container div.row.no-gutters a.col-md-5 div.row.no-gutters';
        if(isCj){
            selector = cjSelector;
        }else{
            selector = totalSelector
        }
        
        return await page.evaluate((selector,isCj)=>{
            let ranks = Array.from(document.querySelectorAll(selector))
            ranks = ranks.map( x => x.textContent.trim() )
            
            let cleanedRanks = ranks.map((x)=>{
                const cleanedData = x.replace(/\n/g, '&');
                const splitData = cleanedData.split(/[:&]/).map(item => item.trim());
                return splitData.filter(item => item !== ''); 
            }).map(el=>{
                if(isCj){
                    return {
                        "cj rank": el[1],
                        "name": el[2]
                    }
                }else{
                    return{
                        "total rank": el[1],
                        "name": el[2]
                    }
                }
            })
            
            
        
            return cleanedRanks
        }, selector,isCj)
    }

    let cjRanks = await getNameAndPlace(1);
    // console.log(cjRanks)

    let combineCjs = combineArrofObjs(cjRanks,cjMakes)
    console.log(combineCjs)
    let totalRanks = await getNameAndPlace(1,false);
    console.log('totals', totalRanks)

    function combineObjArrs(arr1,arr2,arr3){       
          const combinedArray = [];
          
          arr1.forEach(obj => {
            const matchingObj = arr2.find(item => item.name === obj.name) || {};
            combinedArray.push({ ...obj, ...matchingObj });
          
            const matchingObj3 = arr3.find(item => item.name === obj.name) || {};
            combinedArray[combinedArray.length - 1] = { ...combinedArray[combinedArray.length - 1], ...matchingObj3 };
          });
          
          arr2.forEach(obj => {
            if (!combinedArray.some(item => item.name === obj.name)) {
              const matchingObj = arr3.find(item => item.name === obj.name) || {};
              combinedArray.push({ ...obj, ...matchingObj });
            }
          });
          
          arr3.forEach(obj => {
            if (!combinedArray.some(item => item.name === obj.name)) {
              combinedArray.push(obj);
            }
          });
          
          console.log(combinedArray);
          return combinedArray;
    }
    let combinedObj = combineObjArrs(combineCjs,combinedSn,totalRanks)
    console.log(combinedObj)
    //combine sn obj with, cjs obj and total obj

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

