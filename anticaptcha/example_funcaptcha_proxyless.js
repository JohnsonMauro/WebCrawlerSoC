// http module should be installed:
// npm i http

// Params:
// your anti-captcha.com account key
var anticaptcha = require('./anticaptcha')('12345678901234567890123456789012');

//funcaptcha key from target website
anticaptcha.setWebsiteURL("http://mywebsite.com/funcaptcha/test.php");
anticaptcha.setWebsitePublicKey("fun-captcha-website-key");

// check balance first
anticaptcha.getBalance(function (err, balance) {
    if (err) {
        console.error(err);
        return;
    }

    if (balance > 0) {
        // ATTENTION!
        // Customer needs to enable Funcaptcha Proxyless tasks first
        // in API settings web-page: https://anti-captcha.com/clients/settings/apisetup
        // to make this task type work
        anticaptcha.createFunCaptchaTaskProxyless(function (err, taskId) {
            if (err) {
                console.error(err);
                return;
            }

            console.log(taskId);

            anticaptcha.getTaskSolution(taskId, function (err, taskSolution) {
                if (err) {
                    console.error(err);
                    return;
                }

                console.log(taskSolution);
            });
        });
    }
});