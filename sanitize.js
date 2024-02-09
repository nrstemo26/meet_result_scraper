const csv = require('csv-parser')
const fs = require('fs')
//what is a map


function sanitize(meetPath){
    const results = new Map();
    let duplicates = 0;
    let newMeets = 0;
    let duplicateArr = []

    const csvOptions = {
        separator: "|",
    }


    fs.createReadStream('current_metadata.csv')
        .pipe(csv(csvOptions))
        .on('data',(data)=>{
            let meetData;
            if(!data.Level){
                let [meet,level,date,resultsNo,url] = data.Meet.split('|')
                meet = meet.replaceAll('"','')

                meetData = {
                    Meet:meet,
                    Level:level,
                    Date: date,
                    Results: resultsNo,
                    "Meet Url": url
                }
            }else{
                meetData = data
            }
            if(!results.has(meetData["Meet Url"])){
                newMeets++;
                results.set(meetData["Meet Url"], meetData)
            }else{  
                // console.log(data.Level)
                // console.log(data)
                duplicateArr.push(meetData['Meet Url'])
                duplicates++;
            }
        })
        .on('end',()=>{
            console.log(`new meets: ${newMeets}`);
            console.log(`duplicate meets: ${duplicates}`);
            console.log(results.size)
            console.log(duplicateArr.join(' '))
        })
}

// sanitize('current_metadata.csv')