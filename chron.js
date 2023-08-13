let CronJob = require('cron').CronJob;
let job = new CronJob(
    '* * * * * *',
    function() {
        console.log('You will see this message every second');
    },
    null,
    true,
    'America/Los_Angeles'
);
// job.start() - See note below when to use this