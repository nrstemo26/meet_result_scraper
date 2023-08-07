const { makeNewMeetMetaData } = require('./meetMetadataCsv')

//now this needs to read that csv get the meet name and have that as an array

async function run (){
    console.log('getting new meet metadata')
    await makeNewMeetMetaData()
    console.log('done')
}

run()