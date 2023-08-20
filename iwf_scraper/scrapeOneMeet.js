//may need some refactoring to move thru quickly
const puppeteer = require('puppeteer')
// const { createCSVfromArray, writeCSV } = require('../utils/csv_utils');
// const {handleTotalAthleteString, getAmountMeetsOnPage} = require('../utils/string_utils')
// const {getAthletesOnPage} = require('../utils/scraping_utils')
const {writeCsv} = require('./csv_utils');
const { writeCSV } = require('../utils/csv_utils');


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

    //['#men_snatchjerk','#women_snatchjerk']
    //so i dont even need to select based on which si
    
    //clicks men's snatch/cj/total btn
    await page.click('#results_mens_snatch', {
        waitUntil: 'networkidle0'
    }) 


    //wont need to click this. its all in the html
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

    async function getSnResults(classIndex){
        //could add   
        let snSelector = 'div#men_snatchjerk div.results__title:nth-of-type(' + classIndex + ') + div.results__title + div.cards div.card div.container'
        //needs to get the strike
        return await page.evaluate((selector)=>{
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
    }

    //gets all the snatches with make or miss indications(- before number is a miss)
    async function getMakeMisses (classIndex, snatch=true){
        //first nth of type is weight class 2nd nth of type is 
        let missSelector;
        if(snatch){
            missSelector = 'div#men_snatchjerk div.results__title:nth-of-type('+ classIndex +') + div.results__title + div.cards div.card div.container div.col-md-3 div.row.no-gutters p'
        }else{
            missSelector = 'div#men_snatchjerk div.results__title:nth-of-type('+ classIndex +') + div.results__title + div.cards + div.results__title + div.cards div.card div.container div.col-md-3 div.row.no-gutters p'
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

    function combineAttemptsAndRankObjs(arr1,arr2){
        let combinedArr = []
        for(let i = 0; i < arr1.length; i++){
            combinedArr[i] = { ...arr1[i], ...arr2[i] }
        }
        return combinedArr;
    }

    //can grab cj and total placing with name
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
    function addWeightClassToObjArr(className, arr){
        return arr.map((el)=>{
            return {...el, 'weight class': className}
        })
    }

    function combineObjsByName(arr1,arr2,arr3){       
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
        return combinedArray;
  }
    
    //get weightclass
    let menSelector = '#men_snatchjerk div.results__title div.container div.row div.col-12 h3'
    let mensWeightClasses = await getWeightClasses(menSelector)
    // console.log(mensWeightClasses)

    let womenSelector = '#women_snatchjerk div.results__title div.container div.row div.col-12 h3'
    let womenWeightClasses = await getWeightClasses(womenSelector)
    
    let meetData = []
    for(let i=0; i <mensWeightClasses.length; i++ ){
        //needs to get added to one of the evaluates to add the weight class in for the athletes
        // let weightClass = mensWeightClasses[i]
        // console.log(weightClass)
        // let nthOfType = i+1;
        
        // let snRankAndAthleteData = await getSnResults(i+1)
        // let snAttempts = await getMakeMisses(i+1)
        // let allSnData = combineAttemptsAndRankObjs(snRankAndAthleteData, snAttempts)
        
        // let cjAttempts = await getMakeMisses(i+1,false)
        // let cjRanking = await getNameAndPlace(i+1);
        // let allCjData = combineAttemptsAndRankObjs(cjAttempts,cjRanking)
    
        // let totalRanks = await getNameAndPlace(i+1,false);
        
        // let weightClassData = combineObjsByName(allCjData,totalRanks,allSnData)
        // weightClassData = addWeightClassToObjArr(weightClass, weightClassData)
        // console.log(weightClassData)
        // meetData.push(weightClassData)
    }
    
    // writeCsv(meetData)
    
    

    async function nthOfTypeIssues (){
        let classIndex = 1;
        // let missSelector = 'div#men_snatchjerk div.cards div.card div.container div.row.now-gutters a'
        let missSelector = 'div#men_snatchjerk div.cards'
        

        return await page.evaluate((selector)=>{
            let allCards = Array.from(document.querySelectorAll(selector))
            //so 0,3,6... i*3     are snatches
            //so 1,4,7... i*3 +1  are cjs
            //so 2,5,8... i*3 + 2 are totals
            let snatches = [];
            let cjs = []
            let totals = [];
            for (let i = 0; i < allCards.length; i++) {
                if (i % 3 === 0) {
                    snatches.push(allCards[i]);
                } else if (i % 3 === 1) {
                    cjs.push(allCards[i]);
                } else {
                    totals.push(allCards[i]);
                }
            }

            
            return snatches

            // let snatches = document.querySelector('div#men_snatchjerk div.cards:nth-of-type(1)')
            return snatches
            snatches = snatches.map((x)=>{
                return  x.textContent.trim()
            })
            return snatches
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
            return snatches

            // this is getting the inner html of if there is a strike or not!!!
            snMakes = snatches.map(div => {
                    if(div.childNodes[2]){
                    return div.childNodes[2].innerHTML
                }
                return ''
            });
            snatches = snatches.map((x)=>{
                return  x.textContent.trim()
            })
            // return snatches
        
            // return snatch [1, 2, 3, total]
            // let cleanedSnatches = snatches.map(x=> x.split(/[:]/).map((x)=> x.trim())).map((x)=>x[1]);
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
                    return {
                    'sn 1': el[0],
                    'sn 2': el[1],
                    'sn 3': el[2],
                    'best sn': el[3],
                    }
            })
            return cleanedArr    
            return headersRemoved[1]
        }, missSelector)
    }
    let foo = await nthOfTypeIssues();
    console.log(foo)
    // console.log(foo.length)
    //idk if htis is needed
    // let snSelector = 'div.result__container.active div.results__title:nth-of-type(1) + div.results__title + div.cards div.card div.container'
    // writeCsv(allWeightClassData)
    

    console.log('done')
    await browser.close();
}

scrapeOneMeet('https://iwf.sport/results/results-by-events/?event_id=576','./data/foo.csv')


module.exports = {
    scrapeOneMeet:scrapeOneMeet
}






//this selector gets name rank nation
// let snHeaderSelector = 'div.results__title + div.results__title + div.cards div.card.card__legend div.container'
// let snHeaders = await page.evaluate((selector)=>{
//     let headers = Array.from(document.querySelectorAll(selector))
//     headers = headers.map((x)=>{
//         return  x.textContent.trim()
//     })

//     let cleanedHeaders = headers.map(x=> {
//         const cleanedData = x.replace(/\n/g, '');
//         const splitData = cleanedData.split(':').map(item => item.trim());
//         return splitData.filter(item => item !== ''); 
//     }); 
//     cleanedHeaders = cleanedHeaders.map(x=>{
//         x[0] = 'sn ' + x[0]
//         x[6] = 'sn ' + x[6]
//         x[7] = 'sn ' + x[7]
//         x[8] = 'sn ' + x[8]
//         x[9] = 'best sn'
//         return x

//     })
    
    
//     //needs to remove [0]
//     return cleanedHeaders[0]
//     // return headerArr[0]
// }, snHeaderSelector)
