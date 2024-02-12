const Stream = require('stream')
const readableStream = new Stream.Readable;
//we can send data to the readble stream
readableStream.push('ping')
readableStream.push('pong')

/////////////
const fs = require('fs');

async function logChunks(readble){
    for await(const chunk of readble){
        console.log(chunk);
    }
}

const readable = fs.createReadStream(
    'tmp/test.txt', {encoding: 'utf-8'});

logChunks(readable)

////
//its possible to collect contents from a 
//readble stream in a string
const readable = require('stream').Readable

async function readableToString2(readable){
    let result = '';
    for await(const chunk of readable){
        result += chunk;
    }
    return result;
}

// const readString = Readable.from('goodmorning', {encoding:'utf-8'})

////
//flowing mode example
////

//fs.createReadStream() gives us a readable stream
//it starts in a static state but as soon as we listen
//for the on 'data' event  it becomes a flowing stream

const fs = require('fs')
let data = '';

//creates a readble
let readerStream = fs.createReadStream('file.txt');

//set endcoding
readerStream.setEncoding('UTF8')

//handle stream events -> data, end, error
readerStream.on('data', function(chunk){
    data += chunk;
})

readerStream.on('end',function(){
    console.log(data);
})

readerStream.on('error', function(err){
    console.log(err.stack)
})
console.log('program ended')

/////

//paused mode example

/////
//need to call stream.read() every time we want a new chunk

const fs = require('fs');
const readableStreamPaused = fs.createReadStream('file.txt')
let dataPaused = '';
let chunk;

readableStream.on('readable', function(){
    while((chunk=readableStream.read()) != null){
        data += chunk;
    }
});

readableStream.on('end', function(){
    console.log(dataPaused)
})

////
//writeable stream
////

const fs = require('fs');
let readStream = fs.createReadStream('file1.txt')
let writeStream = fs.createWriteStream('file2.txt')

readStream.setEncoding('utf8')

readStream.on('data', function(chunk){
    writeStream.write(chunk)
})
//writeStream.end('fuuck') makes the writestream done

////
// using a writeable stream to read
// data from writeable stream
////

const Stream = require('stream')

const rStream = new Stream.Readable()
const wStream = new Stream.Writable()

wStream._write = (chunk, encoding, next) => {
    console.log(chunk.toString());
    next();
}

readableStream.pipe(wStream);

rStream.push('ping')
rStream.push('pong')

wStream.end()

/////
//async iterator method 
//RECOMMENDED
/////

const util = require('util')
const stream = require('stream')
const fs = require('fs')
const once = require('events').once;

//what does that mean??
//default of stream.finished() is callback based
//so this turns it into a promise
const finished = util.promisify(stream.finished);

async function writeIterableToFile(iterable, filePath){
    const writable = fs.createWriteStream(filePath,{encoding: 'utf-8'});
    for await (const chunk of iterable){
        if(!writable.write(chunk)){
            await once(writable, 'drain')
        }
    }
    writable.end();
    await finished(writable);

}

await writeIterableToFile(
    ['one', 'line of text'], 'tmp/log.txt'
)
assert.equal(
    fs.readFileSync('tmp/log.txt', {encoding: 'utf8'}),
    'One line of text.\n');


///
//piping!
///

const pipeline = require('stream').pipeline
const fs = require('fs');
const zlib = require('zlib');

// pipeline easily pipes a series of streams
// get notified when pipleine is fully done
// pipline to a gzip processes a huge video file efficiently

pipeline(
    fs.createReadStream('the.matrix.1080p.mkv')
    zlib.createGzip(),
    fs.createWriteStream('The.matrix.1080p.mkv.gz'),
    (err)=>{
        if(err){
            console.error('pipeline failed', err);

        }else{
            console.log('pipeline succesful')
        }
    }
)

