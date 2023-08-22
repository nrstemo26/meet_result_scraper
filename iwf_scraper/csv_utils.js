const createCsvWriter = require('csv-writer').createObjectCsvWriter;

function writeCsv(data, filePath){
   const header = Object.keys(data[0])

    const csvWriter = createCsvWriter({
    path: filePath, 
    //fieldDelimiter: "|", // doesn't work
    header: header.map(key=> {
        return {id: key, title: key}
        })
    });

    csvWriter.writeRecords(data)
    .then(() => {
        console.log('CSV file has been written successfully');
    })
    .catch(err => {
        console.error('Error writing CSV file:', err);
    });
}

module.exports = {
    writeCsv:writeCsv
}