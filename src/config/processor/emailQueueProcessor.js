const { offerMailSendToUser } = require("../helper/mail/send_mail_template");

const emailQueueProcessor = async (job, done) => {
    try {
        const { name, email } = job.data.user;
        await offerMailSendToUser(name, email);
        setTimeout(() => {
            done();
        }, 2000)
    } catch (error) {
        console.log(error);
        throw error;
    }

}
module.exports = emailQueueProcessor;