const Queue=require('bull');
const path=require('path');
const { REDIS_URL, REDIS_PORT } = require('./rediscredential');
const  emailQueue=new Queue('emailQueue',{
    redis:{
        port:REDIS_PORT,
        host:REDIS_URL

    }
});

//process add into queue
emailQueue.process(path.join(__dirname,'emailQueueProcessor.js'));

emailQueue.on('completed',(job)=>{
    console.log(`completed #${job.id} Job`)
})
module.exports ={emailQueue};