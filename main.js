const fs = require('fs');
const csv = require('csv-parser');
const fastcsv = require('fast-csv')
const path = require('path');

const csvFiles = ['./data/meet-metadata/111.csv', './data/meet-metadata/222.csv', ]; // List of your CSV files
const outputCsvPath = 'weekly_update'
const outputFile = 'foo.csv'
//needs to have the file title

// const csvFiles = ['./data/meet-metadata/bar.csv', './data/meet-metadata/baz-small.csv', ]; // List of your CSV files

function writeCSVHeaders(inputCsv){
    const headers = [];

    fs.createReadStream(inputCsv)
    .pipe(csv())
    .on('headers', (headerList) => {
        headerList.forEach((header) => {
        headers.push(header);
        });

        // Write headers to the output CSV
        const outputCsvContent = headers.join(',') + '\n';
        fs.writeFile(outputCsvPath + '/' + outputFile, outputCsvContent, 'utf8', (err) => {
        if (err) {
            console.error(err);
            return;
        }
        
        console.log('Headers copied successfully.');
        });
    });
    return headers;
}


// Step 1: Read the CSV files and store rows in the rowsMap
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
 

// Step 2: Compare rows and find unmatched rows
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


// Step 3: Write unmatched rows to separate CSV files
async function writeUnmatchedRows() {
    const { headers, unmatchedRows } = await findUnmatchedRows();
    for (const [file, rows] of Object.entries(unmatchedRows)) {
        if (rows.length > 0) {
            const outputPath = path.join(unmatchedOutputDir, outputFile);
            await saveCSV(outputPath, rows, headers);
        }
    }
}

writeCSVHeaders(csvFiles[0])
writeUnmatchedRows()
.then(() => console.log('Unmatched rows written to CSV files successfully.'))
.catch((error) => console.error('Error:', error))


//what are the main processes we need to do for this

//have function that scrapes 1 meet off of urlID

//get all meet meta-data
//compare to previous week's metadata
//filter out all overlapping metadata

// take that list/array/csv and loop thru the 
// https://usaweightlifting.sport80.com/public/rankings/results/ 
// click to open(preferably in a new tab)
// get url#? of meet and add to metadata








// Step 2: Compare rows and find unmatched rows
//   async function findUnmatchedRows() {
    //       const allRows = {};
    
    //   // Read and store rows from all CSV files
//   for (const file of csvFiles) {
    //       const fileRows = await readCSV(file);
    //       allRows[file] = fileRows;
    
    //   }
    
//   // Find unmatched rows in each file
//   const unmatchedRows = {};
//   for (const [file, rows] of Object.entries(allRows)) {
//     unmatchedRows[file] = rows.filter((row) => {
    //       const rowString = JSON.stringify(row);
    //       return !csvFiles.some(otherFile => {
//           if (otherFile !== file) {
    //               return allRows[otherFile].some(otherRow => JSON.stringify(otherRow) === rowString);
    //             }
    //         return false;
    //     });
    //     });
    // }
    
    // return unmatchedRows;
// }

    // Step 3: Write unmatched rows to separate CSV files
    // async function writeUnmatchedRows() {
        //   const unmatchedRows = await findUnmatchedRows();
        
        //   for (const [file, rows] of Object.entries(unmatchedRows)) {
            //     if (rows.length > 0) {
                //       const outputPath = path.join(unmatchedOutputDir, `foo.csv`);
                //       await saveCSV(outputPath, rows);
                //     }
                //   }
                // }


//   async function saveCSV(file, data) {
//     return new Promise((resolve, reject) => {
//         const ws = fs.createWriteStream(file);

//         // Write header without quotes
//         if (data.length > 0) {
//             const header = Object.keys(data[0]).join(",");
//             ws.write(header + "\n");
//         }

//         // Write rows without quotes
//         for (const row of data) {
//             const rowValues = Object.values(row).map(value => value.toString());
//             ws.write(rowValues.join(",") + "\n");
//         }

//         ws.end();

//         ws.on('finish', () => resolve());
//         ws.on('error', (error) => reject(error));
//     });
// }