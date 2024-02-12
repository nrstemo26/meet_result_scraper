const fs = require('fs');
// const fs = require('fs').promises;
const csv = require('csv-parser');
const fastcsv = require('fast-csv');

console.log('running')
const file2 = './foo1.csv';
const file1 = './foo2.csv';
// const file2 = './all-meet-metadata.csv';
// const file1 = './new-all-meet-metadata.csv';
const outputFilePath = './unique_rows.csv';


// function compareAndWriteUniqueRows(file1, file2, outputFilePath) {
//     const uniqueRows = [];

//     // Read and process CSV file 1
//     fs.createReadStream(file1)
//         .pipe(csv())
//         .on('data', (row1) => {
//             // Read and process CSV file 2
//             const file2Stream = fs.createReadStream(file2)
//                 .pipe(csv())
//                 .on('data', (row2) => {
//                     // Compare rows from both files
//                     const isEqual = JSON.stringify(row1) === JSON.stringify(row2);

//                     // If rows are equal, skip adding to uniqueRows array
//                     if (isEqual) return;

//                     // If reached the end of file2 and no match found, add to uniqueRows
//                     file2Stream.on('end', () => {
//                         uniqueRows.push(row1);
//                     });
//                 })
//                 .on('end', () => {
//                     // Continue processing file1 after file2 is fully processed
//                     // (to avoid asynchronous issues)
//                 });
//         })
//         .on('end', () => {
//             // Write the uniqueRows to the output CSV file
//             const csvStream = fastcsv.writeToPath(outputFilePath, uniqueRows, { headers: true })
//                 .on('finish', () => {
//                     console.log('Unique rows written to', outputFilePath);
//                 });

//             // Trigger the writing process
//             csvStream.end();
//         });
// }

// function compareAndWriteUniqueRows(file1, file2, outputFilePath) {
//     const uniqueRows = [];
//     // Create a set to store unique rows from file2
//     const uniqueRowsSet = new Set();

//     // const stream1 = fs.createReadStream(file1).pipe(csv());


//     fs.createReadStream(file2)
//         .pipe(csv())
//         .on('data', (row) => {
//             // Convert each row to a JSON string for comparison
//             const rowString = JSON.stringify(row);
//             uniqueRowsSet.add(rowString);
//         })
//         .on('end', () => {
//             // Now, read and process file1
//             stream1
//                 .on('data', (row) => {
//                     const rowString = JSON.stringify(row);

//                     // If row from file1 is not in uniqueRowsSet, add it to uniqueRows
//                     if (!uniqueRowsSet.has(rowString)) {
//                         uniqueRows.push(row);
//                     }
//                 })
//                 .on('end', () => {
//                     console.log(uniqueRows)
//                     // Write the uniqueRows to the output CSV file
//                     const csvStream = fastcsv.writeToPath(outputFilePath, uniqueRows, { headers: true })
//                         .on('finish', () => {
//                             console.log('Unique rows written to', outputFilePath);
//                         });

//                     // Trigger the writing process
//                     csvStream.end();
//                 });
//         });
// }



function compareAndWriteUniqueRows(file1, file2, outputFilePath) {
    const uniqueRows = [];
    const uniqueRowsSet = new Set();

    // Read and process file2 to populate uniqueRowsSet
    fs.createReadStream(file2)
        .pipe(csv())
        .on('data', (row) => {
            const rowString = JSON.stringify(row);
            uniqueRowsSet.add(rowString);
        })
        .on('end', () => {
            // Now, read and process file1
            const stream1 = fs.createReadStream(file1)
                .pipe(csv())
                .on('data', (row) => {
                    const rowString = JSON.stringify(row);

                    // If row from file1 is not in uniqueRowsSet, add it to uniqueRows
                    if (!uniqueRowsSet.has(rowString)) {
                        uniqueRows.push(row);
                    }
                })
                .on('end', () => {
                    // console.log(uniqueRows);

                    // // Write the uniqueRows to the output CSV file
                    // const csvStream = fastcsv.writeToPath(outputFilePath, uniqueRows, { headers: true })
                    // ??????? csvStream.on('finish', () => {
                    //     .on('finish', () => {
                    //         console.log('Unique rows written to', outputFilePath);
                    //     });

                    // Trigger the writing process
                    // csvStream.end();
                });
        });
}


// async function compareAndWriteUniqueRows(file1, file2, outputFilePath) {
//     try {
//         const uniqueRowsSet = new Set();

//         // Read and process file2 to populate uniqueRowsSet
//         const stream2 = fs.createReadStream(file2).pipe(csv());
//         for await (const row of stream2) {
//             const rowString = JSON.stringify(row);
//             uniqueRowsSet.add(rowString);
//         }

//         // Read and process file1, collecting unique rows
//         const uniqueRows = [];
//         const stream1 = fs.createReadStream(file1).pipe(csv());
//         for await (const row of stream1) {
//             const rowString = JSON.stringify(row);

//             // If row from file1 is not in uniqueRowsSet, add it to uniqueRows
//             if (!uniqueRowsSet.has(rowString)) {
//                 uniqueRows.push(row);
//             }
//         }

//         console.log(uniqueRows);

//         // Write the uniqueRows to the output CSV file
//         const csvStream = fastcsv.writeToPath(outputFilePath, uniqueRows, { headers: true });
//         await new Promise((resolve) => csvStream.on('finish', resolve));
//         console.log('Unique rows written to', outputFilePath);
//     } catch (error) {
//         console.error('Error:', error.message);
//     }
// }




function foo(file1,file2, outputFilePath){
    const readableStream = fs.createReadStream(file1)
    const writableStream = fs.createWriteStream(outputFilePath)

    readableStream.on('data', (chunk) => {
        console.log('received a chunk', chunk);
    });
    readableStream.on('end',() => {
        console.log('no more data')
    });
}


compareAndWriteUniqueRows(file1, file2, outputFilePath);
// foo(file1, file2, outputFilePath);



