const fs = require('fs');
const csv = require('csv-parser')
const fastcsv = require('fast-csv')

// const oldfile = './foo1.csv';
// const newfile = './foo2.csv';
const oldfile = './new-meta.csv'; //first file 6123 entries
const newfile = './old-meta-less.csv'
// const oldfile = './old-meta.csv'; //first file 6123 entries

// below needs to be bigger
const output = './unique_rows.csv';

// I can make a set of all of the data from the first file and then compare
// the second file's data to the set and if a row isn't there it goes in a unique rows variable

//file 2 needs to be the bigger one or the same size
function run(file1, file2, outputFilePath){
    let newMeetCount = 1;
    let count = 1;
    const uniqueRows = [];
    const nonUniqueRowsSet = new Set();

    console.log('reading file')
    // const readStream1 = fs.createReadStream(file1)
    // const readStream2 = fs.createReadStream(file2)
    // const writeStream = fs.createWriteStream(output)

    fs.createReadStream(file1)
    //pipe(csv({separator:'one ch separator'}))
    .pipe(csv({separator: '|'}))
    .on('data',(row)=> {
        let meetUrl= row['Meet Url']
        let rowString = JSON.stringify(row);
        let meetRow = {
            [meetUrl]: rowString
        }

        let meetRowString = JSON.stringify(meetRow)
        // console.log(meetUrl)
        nonUniqueRowsSet.add(meetUrl)
        // nonUniqueRowsSet.add("fuck yeah")

        count++
        //does that mean there are 300 meets that are already not unique???
    })
    .on('end',()=>{
        
        //reads 2nd file and adds any new meets to unique rows function
        // console.log('total meets in the set', nonUniqueRowsSet)
        console.log('total meets in the set', nonUniqueRowsSet.size)
        // console.log('total meets gone thru', count)
        fs.createReadStream(file2)
        .pipe(csv())
        .on('data',(row)=>{
            let meetUrl = row['Meet Url']

            let rowString = JSON.stringify(row)
            if(!nonUniqueRowsSet.has(meetUrl)){
                //should prevent double adding of meets
                nonUniqueRowsSet.add(meetUrl)

                uniqueRows.push(row);
            }
        })
        .on('end',()=>{
            console.log('new meets?', uniqueRows.length)
            console.log(nonUniqueRowsSet.has('1019'))
            // console.log(uniqueRows)
            fastcsv.writeToPath(outputFilePath, uniqueRows,{headers: true})
            .on('finish', () => console.log('done writing'))
        }) 
    })

}

run(oldfile, newfile, output);