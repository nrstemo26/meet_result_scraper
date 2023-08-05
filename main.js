// const {parse} = require('csv-parse/sync')
// const oldCSV = require('./data/meet-metadata/bar.csv')
// const stringify = require('csv-stringify');

const fs = require('fs');
const csv = require('csv-parser');
const fastcsv = require('fast-csv')
const path = require('path');

const csvFiles = ['./data/meet-metadata/111.csv', './data/meet-metadata/222.csv', ]; // List of your CSV files
// const csvFiles = ['./data/meet-metadata/bar.csv', './data/meet-metadata/baz-small.csv', ]; // List of your CSV files

//new example doesn't use a map
const rowsMap = new Map(); // To store rows as keys and their source file as values


// Step 1: Read the CSV files and store rows in the rowsMap
async function readCSV(file) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(file)
      .pipe(csv())
      .on('data', (row) => {
        rows.push(row);
      })
      .on('end', () => {
        resolve(rows);
      })
      .on('error', (error) => {
        reject(error);
    });
    });
}

// Step 2: Compare rows and mark duplicates
async function compareAndMarkDuplicates() {
  for (const file of csvFiles) {
    //file is the csv file path

    const fileRows = await readCSV(file);

    //makes an array of objects for the csv file which is a bunch of meets


    fileRows.forEach((row) => {
      
      const rowString = JSON.stringify(row);
      console.log(rowString)
      if (rowsMap.has(rowString)) {
        rowsMap.get(rowString).push(file);
      } else {
        rowsMap.set(rowString, [file]);
      }
    });
  }
}

// Step 3: Remove identical rows and write unmatched rows to a new CSV
async function removeIdenticalRows() {
  await compareAndMarkDuplicates();
//   console.log(rowsMap)

  for (const [rowString, sources] of rowsMap.entries()) {
    // console.log(rowString)
    // console.log(sources)
    if (sources.length === 1) {
      const source = sources[0];
      const fileRows = await readCSV(source);
      const unmatchedRows = fileRows.filter(row => JSON.stringify(row) === rowString);

    //   const outputPath = path.join('weekly_update', source); // Output directory for unmatched rows
      const outputPath = path.join('weekly_update','foo.csv'); // Output directory for unmatched rows
      await saveCSV(outputPath, unmatchedRows);
    }
  }
}

// Helper function to save CSV data to file
// async function saveCSV(file, data) {
//   return new Promise((resolve, reject) => {
//     stringify(data, { header: true }, (error, output) => {
//       if (error) {
//         reject(error);
//       } else {
//         fs.writeFile(file, output, (err) => {
//           if (err) {
//             reject(err);
//           } else {
//             resolve();
//           }
//         });
//       }
//     });
//   });
// }

// Create the output directory for unmatched rows

// Helper function to save CSV data to file using fast-csv
async function saveCSV(file, data) {
    return new Promise((resolve, reject) => {
      const ws = fs.createWriteStream(file);
      fastcsv.write(data, { headers: true }).pipe(ws);
      ws.on('finish', () => resolve());
      ws.on('error', (error) => reject(error));
    });
  }

const unmatchedOutputDir = path.join('weekly_update');
if (!fs.existsSync(unmatchedOutputDir)) {
  fs.mkdirSync(unmatchedOutputDir, { recursive: true });
}

// Call the function to remove identical rows and write unmatched rows
removeIdenticalRows()
  .then(() => console.log('Unmatched rows written to CSV files successfully.'))
  .catch((error) => console.error('Error:', error));









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
async function findUnmatchedRows() {
  const allRows = {};

  // Read and store rows from all CSV files
  for (const file of csvFiles) {
    const fileRows = await readCSV(file);
    allRows[file] = fileRows;
  }

  // Find unmatched rows in each file
  const unmatchedRows = {};
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

  return unmatchedRows;
}

// Create the output directory for unmatched rows
const unmatchedOutputDirFOO = path.join('output', 'unmatched');
if (!fs.existsSync(unmatchedOutputDirFOO)) {
  fs.mkdirSync(unmatchedOutputDirFOO, { recursive: true });
}

// Step 3: Write unmatched rows to separate CSV files
async function writeUnmatchedRows() {
  const unmatchedRows = await findUnmatchedRows();

  for (const [file, rows] of Object.entries(unmatchedRows)) {
    if (rows.length > 0) {
      const outputPath = path.join(unmatchedOutputDirFOO, `XXX`);
      await saveCSV(outputPath, rows);
    }
  }
}

writeUnmatchedRows()
  .then(() => console.log('Unmatched rows written to CSV files successfully.'))
  .catch((error) => console.error('Error:', error));