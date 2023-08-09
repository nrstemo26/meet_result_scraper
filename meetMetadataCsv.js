// todos:
// make this dynamic off of files of chosing for csvFiles var

const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const {getDateMMDDYYYY: getDate } = require('./utils/date_utils')

const csvFiles = ['./data/meet-metadata/111.csv', './data/meet-metadata/222.csv', ]; // List of your CSV files

const outputCsvPath = 'weekly_update'
const outputFile = getDate() + '-metadata.csv'
const outputfileName = outputCsvPath + '/' + outputFile

async function writeCSVHeaders(inputCsv){
    const headers = [];
    fs.createReadStream(inputCsv)
    .pipe(csv())
    .on('headers', (headerList) => {
        headerList.forEach((header) => {
        headers.push(header);
        });

        //removes action column
        headers.pop()
        
        // Write headers to the output CSV
        const outputCsvContent = headers.join('|') + '\n';
        fs.writeFile(outputfileName, outputCsvContent, 'utf8', (err) => {
        if (err) {
            console.error(err);
            return err;
        }
        
        });
    });
    return outputfileName;
}

//Read the CSV files and store rows in the rowsMap
async function readCSV(file) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(file)
      .pipe(csv())
      .on('headers',(headers)=>{
        //do something with the headers??
      })
      .on('data', (row) => {
        rows.push(row);
      })
      //so we hit end of the file and we resolve(successful promise) all of the rows
      .on('end', () => {
        resolve(rows);
      })
      .on('error', (error) => {
        reject(error);
    });
 });
}

async function saveCSV(file, data, headers) {
    return new Promise((resolve, reject) => {
        const ws = fs.createWriteStream(file, {flags: 'a'});

        // Write rows without quotes
        for (const row of data) {
            const rowValues = headers.map(header => row[header].toString());
            ws.write(rowValues.join(",") + "\n");
        }

        ws.end();
        ws.on('finish', () => resolve());
        ws.on('error', (error) => reject(error));
    });
}
 
//Compare rows and find unmatched rows
async function findUnmatchedRows() {
    const allRows = {};

    // Read and store rows from all CSV files
    for (const file of csvFiles) {
        const fileRows = await readCSV(file);
        allRows[file] = fileRows;
    }

    // Find unmatched rows in each file
    const unmatchedRows = {};
    const headers = Object.keys(allRows[csvFiles[0]][0]); // Get headers from the first file
    for (const [file, rows] of Object.entries(allRows)) {
        unmatchedRows[file] = rows.filter((row) => {
            const rowString = JSON.stringify(row);
            return !csvFiles.some(otherFile => {
                if (otherFile !== file) {
                    return allRows[otherFile].some(otherRow => JSON.stringify(otherRow) === rowString);
                }
                return false;
            });
        });
    }

    return { headers, unmatchedRows };
}

//makes the file if it doesn't exist
const unmatchedOutputDir = path.join(outputCsvPath);
if (!fs.existsSync(unmatchedOutputDir)) {
  fs.mkdirSync(unmatchedOutputDir, { recursive: true, });
}

//Write unmatched rows to separate CSV files
async function writeUnmatchedRows() {
    const { headers, unmatchedRows } = await findUnmatchedRows();
    for (const [file, rows] of Object.entries(unmatchedRows)) {
        if (rows.length > 0) {
            const outputPath = path.join(unmatchedOutputDir, outputFile);
            await saveCSV(outputPath, rows, headers);
        }
    }
}

async function makeNewMeetMetaData(){
    await writeCSVHeaders(csvFiles[1])
    .then((res) => {
        console.log('Headers written to CSV files successfully.')
    })
    .catch((error) => console.error('Error:', error))
    
    await writeUnmatchedRows()
    .then(() => console.log('Unmatched rows written to CSV files successfully.'))
    .catch((error) => console.error('Error:', error))

    return outputfileName
}


async function addUrlToMeetCsv(inputCsv, outputCsv, meetUrlData){
    let meets = [
        [ '2023 Mavrik Summer Classic', '5955' ],
        [ 'MO Valley Camp Competition', '5958' ],
        [ 'Heroic mid summer showdown', '5952' ],
        [ 'Intrepid Athletics Summer Open', '5951' ],
        [ "2023 Max's Gym Open", '5940' ]
      ]
    // console.log('in here')
    // console.log(meets)
    let headersWritten = false;

    const outputStream = fs.createWriteStream(outputCsv, { flags: 'a' });
    outputStream.write('Meet|Level|Date|Results|Meet Url\n')
    fs.createReadStream(inputCsv)
        .pipe(csv({ separator: '|' }))
        .on('data', (data) => {
            // Find the corresponding meetUrl from the meets array            
            const meetName = data['Meet'];
            const meetUrlInfo = meets.find(item => item[0] === meetName);

            // Add the meetUrl value if found, or an empty string if not
            const meetUrl = meetUrlInfo ? meetUrlInfo[1] : '';

            // Remove the last value (last column)
            const rowValues = Object.values(data);
            const modifiedRow = [...rowValues.slice(0, -1), meetUrl];

            // Write the modified row to the output CSV
            outputStream.write(modifiedRow.join('|') + '\n');
        })
        .on('end', () => {
            outputStream.end();
            console.log('CSV processing complete.');
        });
}





    // add column of meetURl
    // read csv col 1 and
    // if meetMame matches the csv meetName
    // add meetUrl to the column



module.exports = {
    makeNewMeetMetaData: makeNewMeetMetaData,
    addUrlToMeetCsv: addUrlToMeetCsv,
}





