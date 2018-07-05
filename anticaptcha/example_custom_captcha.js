// http module should be installed:
// npm i http

// Params:
// your anti-captcha.com account key
var anticaptcha = require('./anticaptcha')('12345678901234567890123456789012');

// check balance first
anticaptcha.getBalance(function (err, balance) {
    if (err) {
        console.error(err);
        return;
    }

    anticaptcha.setImageUrl("https://files.anti-captcha.com/26/41f/c23/7c50ff19.jpg?random=" + Math.random());
    anticaptcha.setAssignment("Enter license plate number");

    anticaptcha.setForms([
        {
            label:        "Number",
            labelHint:    false,
            contentType:  false,
            name:         "license_plate",
            inputType:    "text",
            inputOptions: {
                width:        "100",
                placeHolder:  "Enter a letters and number without spaces"
            }
        },
        {
            label:        "Car color",
            labelHint:    "Select car color",
            contentType:  false,
            name:         "color",
            inputType:    "select",
            inputOptions: [
                {
                    value:    "white",
                    caption:  "White color"
                },
                {
                    value:    "black",
                    caption:  "Black color"
                },
                {
                    value:    "grey",
                    caption:  "Grey color"
                }
            ]
        }
    ]);

    if (balance > 0) {
        anticaptcha.createCustomCaptchaTask(
            function (err, taskId) {
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
            }
        );
    }
});