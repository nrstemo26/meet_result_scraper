const puppeteer = require('puppeteer')
const {writeCsv} = require('./csv_utils');

async function scrapeOneMeet(meetUrl, filePath){
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({width:1500, height:1000})
    await page.goto(meetUrl, {
        waitUntil: 'networkidle0'
    })
    
    let meetNumber = meetUrl.split('?event_id=')[1]
    const fullPath = `${filePath}meet_${meetNumber}.csv`

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
  ``}
    
    function sanitizeResults(data){
        const athletes = [];
        let currentAthlete = {};          
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
        if (item.startsWith('Rank:')) {
            if (Object.keys(currentAthlete).length > 0) {
                athletes.push(currentAthlete);
                currentAthlete = {};
            }
            currentAthlete['rank'] = item.split(' ')[1];
            
            // Assume the athlete's name and nation are the next two items
            currentAthlete['name'] = data[i + 1];
            currentAthlete['nation'] = data[i + 2];
            
            // Skip the next two items in the loop
            i += 2;
            } else {
                const [key, value] = item.split(':');
                currentAthlete[key.trim().toLowerCase()] = value.trim();
            }

        }

        athletes.push(currentAthlete);
        return athletes;
    }

    function delete123(dataArray){
        return dataArray.map(obj => {
            delete obj['1'];
            delete obj['2'];
            delete obj['3'];
            delete obj['rank']
            delete obj['total']
            return obj;
          });
        
    }

    function sanitizeTotals(data){ 
        // Initialize an array to store athlete objects
        const athletes = [];
        let currentAthlete = null; // Initialize an empty object to store current athlete data    
        
        // Iterate through the data
        for (let i = 0; i < data.length; i++) {
            const key = data[i];
        
            // Check if the key contains a colon (':'), indicating it's a field with a value
            if (key.includes(':')) {
            const [field, value] = key.split(':');
            if (field.trim() === 'Rank') {
                // If the field is 'Rank', create a new athlete object
                if (currentAthlete) {
                athletes.push(currentAthlete);
                }
                currentAthlete = { 'total rank': value.trim() };
            }else if(field.trim() === 'CI&Jerk'){
                currentAthlete['cj'] = value.trim().toLowerCase()
            } else {
                // Otherwise, add the field and value to the current athlete object
                currentAthlete[field.trim().toLowerCase()] = value.trim().toLowerCase();
            }
            } else {
            // If it doesn't contain a colon, it's likely an athlete name
            // Extract Name and Nation
                currentAthlete.name = data[i];
                currentAthlete.nation = data[i + 1];
                // Move the index ahead by 1 to skip the nation
                i++;
            }
        }
        
        // Push the last athlete object to the array
        if (currentAthlete) {
            athletes.push(currentAthlete);
        }
        return athletes
    }

    function combineObjs(array1, array2, liftType){
          const combinedArray = [];
          
          for (let i = 0; i < array1.length; i++) {
            const obj1 = array1[i];
            const obj2 = array2[i];
            let combinedObj = {}
            if(liftType == 'sn'){
                combinedObj = {
                  ...obj1,
                  'sn rank': obj1['rank'], // Copy properties from the first array
                  'sn 1': obj2['sn 1'],
                  'sn 2': obj2['sn 2'],
                  'sn 3': obj2['sn 3'],
                  //'best sn': obj2['best sn']
                };
            }if(liftType =='cj'){
                combinedObj = {
                    ...obj1,
                    'cj rank': obj1['rank'], // Copy properties from the first array
                    'cj 1': obj2['sn 1'],
                    'cj 2': obj2['sn 2'],
                    'cj 3': obj2['sn 3'],
                   // 'best cj': obj2['best sn']
                  };
            }
          
            combinedArray.push(combinedObj);
          }      
          return combinedArray
    }

    function flattenArray(array){
        const flattenedArray = [].concat(...array);
        return flattenedArray
    }
 
    const meetNameEl = await page.$('.title__event .row .col-12 h2')
    const meetName = await (await meetNameEl.getProperty('textContent')).jsonValue()
   
    async function getGenderData (genderSelector,weightClassArr){
        let allCards = await page.$$(genderSelector)
        let snatches = [];
        let cjs = []
        let totals = [];
        let allResults = []
        for (let i = 0; i < allCards.length; i++) {
            
            let weightClassRes = await allCards[i].evaluate((document) => {
                let results = Array.from(document.querySelectorAll('p'))
                results = results.map(x=> x.textContent.trim())
                return results
            }, allCards[i])
            
            let makeMiss = await page.evaluate((document)=>{
                let lifts = Array.from(document.querySelectorAll('div.col-md-3 div.row.no-gutters p'))
                let makes = lifts.map(div => {
                    if(div.childNodes[2]){
                        return div.childNodes[2].innerHTML
                    }
                    return ''
                });
                
                let cleanedMakes = makes.map((item, index)=>{
                    if (item === null) {
                        return null; // Preserve null values
                      }
                      if (item && item.includes('<strike>')) {
                        // Remove <strike> tags and convert to a negative number
                        const numberValue = parseInt(item.replace(/<\/?strike>/g, ''), 10);
                        return -numberValue;
                      }
                      // Convert regular numbers to integers
                      return parseInt(item, 10);
                })

                let cleanedArr = [];
                for (let i = 4; i < cleanedMakes.length; i += 4) {
                    cleanedArr.push(cleanedMakes.slice(i, i + 4));
                }
    
                cleanedArr = cleanedArr.map(el=>{
                        let bestSn = Math.max(el[0],el[1],el[2])
                        return {
                        'sn 1': el[0],
                        'sn 2': el[1],
                        'sn 3': el[2],
                        'best sn': bestSn > 0 ? bestSn: '---',
                        }
                })
                return cleanedArr    
            }, allCards[i])

            if (i % 3 === 0) {
                let weightClassSn = weightClassRes 
                let snObj = delete123(combineObjs(sanitizeResults(weightClassSn).slice(1), makeMiss, 'sn'))
                snObj = snObj.map(el=>{
                    return {
                        ...el,
                        'weight class':weightClassArr[snatches.length],
                        'meet name': `'${meetName}'`
                    }
                })
                snatches.push(snObj);
            } else if (i % 3 === 1) {
                let weightClassCj = weightClassRes;
                let cjObj = delete123(combineObjs(sanitizeResults(weightClassCj).slice(1), makeMiss, 'cj'))
                cjs.push(cjObj);
            } else {
                let weightClassTotals = await allCards[i].evaluate((document) => {
                    let results = Array.from(document.querySelectorAll('p'))
                    results = results.map(x=> x.textContent.trim())
                    return results
                }, allCards[i])
                weightClassTotals = sanitizeTotals(weightClassTotals.slice(9))
                totals.push(weightClassTotals);
            }
        }
        //combines objs from sn total cj from each weight class
        for(let i = 0; i< snatches.length; i++){
            let weightClassRes = combineObjsByName(snatches[i],cjs[i],totals[i])
            allResults.push(weightClassRes)
        }
        return allResults
    }

    let menSelector = 'div#men_snatchjerk div.cards'
    let menWeightClasses = await getWeightClasses('#men_snatchjerk div.results__title div.container div.row div.col-12 h3')

    let womenSelector = 'div#women_snatchjerk div.cards'
    let womenWeightClasses = await getWeightClasses('#women_snatchjerk div.results__title div.container div.row div.col-12 h3')

    let allMensAttempts = await getGenderData(menSelector, menWeightClasses);
    let allFemaleAttempts = await getGenderData(womenSelector, womenWeightClasses);


    
    writeCsv(flattenArray([...allMensAttempts,...allFemaleAttempts]),fullPath)
    
    console.log('done')
    await browser.close();
}

// scrapeOneMeet('https://iwf.sport/results/results-by-events/?event_id=576', './iwf_scraper/data/')


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


// async function getSnResults(classIndex){
//     //could add   
//     let snSelector = 'div#men_snatchjerk div.results__title:nth-of-type(' + classIndex + ') + div.results__title + div.cards div.card div.container'
//     //needs to get the strike
//     return await page.evaluate((selector)=>{
//     let snatches = Array.from(document.querySelectorAll(selector))
//     snatches = snatches.map((x)=>{
//         return  x.textContent.trim()
//     })
    
//     let cleanedSnatches = snatches.map(x=> {
//         const cleanedData = x.replace(/\n/g, '&');
//         const splitData = cleanedData.split(/[:&]/).map(item => item.trim());
//         return splitData.filter(item => item !== ''); 
        
//     }); 
//     let headersRemoved = cleanedSnatches.map(x=>{
//         x[0] = '';
//         x[4] = '';
//         x[6] = '';
//         x[8] = '';
//         x[10] = '';
//         x[12] = '';
//         x[14] = '';
//         x[16] = '';
//         return x.filter(item => item !== '').slice(0,-4)
//     }).map((el)=>{
//         return {
//             "sn rank": el[0],
//             'name': el[1],
//             'country': el[2],
//             'birthday': el[3],
//             'bw': el[4],
//             'session': el[5],
//         }
        
//     })
//     //headers need to be removed
//     return headersRemoved.slice(1)
// }, snSelector)
// }

// //gets all the snatches with make or miss indications(- before number is a miss)
// async function getMakeMisses (classIndex, snatch=true){
//     //first nth of type is weight class 2nd nth of type is 
//     let missSelector;
//     if(snatch){
//         missSelector = 'div#men_snatchjerk div.results__title:nth-of-type('+ classIndex +') + div.results__title + div.cards div.card div.container div.col-md-3 div.row.no-gutters p'
//     }else{
//         missSelector = 'div#men_snatchjerk div.results__title:nth-of-type('+ classIndex +') + div.results__title + div.cards + div.results__title + div.cards div.card div.container div.col-md-3 div.row.no-gutters p'
//     }
//     return await page.evaluate((selector, snatch)=>{
//         let snatches = Array.from(document.querySelectorAll(selector))
//         //this is getting the inner html of if there is a strike or not!!!
//         snMakes = snatches.map(div => {
//             if(div.childNodes[2]){
//                 return div.childNodes[2].innerHTML
//             }
//             return ''
//         });
//         snatches = snatches.map((x)=>{
//             return  x.textContent.trim()
//         })
    
//         // return snatch [1, 2, 3, total]
//         let cleanedSnatches = snatches.map(x=> x.split(/[:]/).map((x)=> x.trim())).map((x)=>x[1]);
//         snMakes.map((element, index)=>{
//             if(element && element.includes('<strike>')){
//             cleanedSnatches[index] = '-'+ cleanedSnatches[index]
//             }
//             return element
//         })

//         let cleanedArr = [];
//         for (let i = 4; i < cleanedSnatches.length; i += 4) {
//             cleanedArr.push(cleanedSnatches.slice(i, i + 4));
//         }

//         cleanedArr = cleanedArr.map(el=>{
//             if(snatch){
//                 return {
//                 'sn 1': el[0],
//                 'sn 2': el[1],
//                 'sn 3': el[2],
//                 'best sn': el[3],
//                 }
//             }else{
//                 return {
//                     'cj 1': el[0],
//                     'cj 2': el[1],
//                     'cj 3': el[2],
//                     'best cj': el[3],
//                 }
//             }
//         })
//         return cleanedArr    
//         return headersRemoved[1]
//     }, missSelector, snatch)
// }

// function combineAttemptsAndRankObjs(arr1,arr2){
//     let combinedArr = []
//     for(let i = 0; i < arr1.length; i++){
//         combinedArr[i] = { ...arr1[i], ...arr2[i] }
//     }
//     return combinedArr;
// }

// //can grab cj and total placing with name
// //name and place for total too
// async function getNameAndPlace(classIndex, isCj=true){
//     let selector;
//     let cjSelector = 'div.result__container.active div.results__title:nth-of-type('+ classIndex +') + div.results__title + div.cards + div.results__title + div.cards div.card div.container div.row.no-gutters a.col-md-5 div.row.no-gutters';
//     let totalSelector = 'div.result__container.active div.results__title:nth-of-type('+ classIndex +') + div.results__title + div.cards + div.results__title + div.cards + div.results__title + div.cards div.card div.container div.row.no-gutters a.col-md-5 div.row.no-gutters';
//     if(isCj){
//         selector = cjSelector;
//     }else{
//         selector = totalSelector
//     }
    
//     return await page.evaluate((selector,isCj)=>{
//         let ranks = Array.from(document.querySelectorAll(selector))
//         ranks = ranks.map( x => x.textContent.trim() )
        
//         let cleanedRanks = ranks.map((x)=>{
//             const cleanedData = x.replace(/\n/g, '&');
//             const splitData = cleanedData.split(/[:&]/).map(item => item.trim());
//             return splitData.filter(item => item !== ''); 
//         }).map(el=>{
//             if(isCj){
//                 return {
//                     "cj rank": el[1],
//                     "name": el[2]
//                 }
//             }else{
//                 return{
//                     "total rank": el[1],
//                     "name": el[2]
//                 }
//             }
//         })
        
        
    
//         return cleanedRanks
//     }, selector,isCj)
// }
// function addWeightClassToObjArr(className, arr){
//     return arr.map((el)=>{
//         return {...el, 'weight class': className}
//     })
// }
    
    // let meetData = []
    // for(let i=0; i < mensWeightClasses.length; i++ ){
    //     //needs to get added to one of the evaluates to add the weight class in for the athletes
    //     // let weightClass = mensWeightClasses[i]
    //     // console.log(weightClass)
    //     // let nthOfType = i+1;
        
    //     // let snRankAndAthleteData = await getSnResults(i+1)
    //     // let snAttempts = await getMakeMisses(i+1)
    //     // let allSnData = combineAttemptsAndRankObjs(snRankAndAthleteData, snAttempts)
        
    //     // let cjAttempts = await getMakeMisses(i+1,false)
    //     // let cjRanking = await getNameAndPlace(i+1);
    //     // let allCjData = combineAttemptsAndRankObjs(cjAttempts,cjRanking)
    
    //     // let totalRanks = await getNameAndPlace(i+1,false);
        
    //     // let weightClassData = combineObjsByName(allCjData,totalRanks,allSnData)
    //     // weightClassData = addWeightClassToObjArr(weightClass, weightClassData)
    //     // console.log(weightClassData)
    //     // meetData.push(weightClassData)
    // }
    
    // writeCsv(meetData)
    