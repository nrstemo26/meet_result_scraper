const CronJob = require('cron').CronJob;
const {run: getNewMeets} = require('./main')
// Create a cron job that runs every Thursday at 10:00 AM
const cronExpression = '0 9 * * 4'; // Minutes(0), Hours(10), Day of Month(*), Month(*), Day of Week(4, Thursday)

//this would run every second
//'* * * * * *',

const job = new CronJob(cronExpression, function() {
    // Your code to run the program here
    console.log('Running the program every Thursday!');
    
    //getNewMeets()
    
    //import my code to run every thursday
}, null, true, 'UTC'); // The last parameter sets the timezone

job.start(); // Start the cron job
