const fs = require('fs/promises')

function createCSVfromArray(arr){
    let newCSV = arr.map( (el)=> {
        return el.join('| ')
    }).join('\n')
    newCSV += '\n'
    return newCSV;
}


async function writeCSV(folderName, fileName, data){
    let fullPath = `./data/${folderName}/${fileName}.csv`;
    await fs.writeFile(fullPath, data, {flag:"a+"}, err =>{
        if(err){
            console.error(err);
        }
    })
}

module.exports={
    createCSVfromArray,
    writeCSV
}