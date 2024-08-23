const jwt = require("jsonwebtoken");
require("dotenv").config();
const { BOT_ID, APP_ID, APP_SECRET } = process.env;
const CHAT_URL = `https://bots.kore.ai/chatbot/v2/webhook/${BOT_ID}`;

let sessionId = null;
const jwtPayload = {
    appId: APP_ID,
    sub: Math.floor(Math.random() * 10000),
};
const jwToken = jwt.sign(jwtPayload, APP_SECRET);


const callApi = async (prompt, userId) => {
    const payload = {
        session: {
            new: sessionId ? false : true
        },
        message: {
            type: "text",
            val: prompt,
        },
        from: {
            id: userId
        },
        "metaTags": {
            "userLevelTags": [
                {
                    "name": "",
                    "value": ""
                }
            ],
            "sessionLevelTags": [
                {
                    "name": "",
                    "value": ""
                }
            ],
            "messageLevelTags": [
                {
                    "name": "",
                    "value": ""
                }
            ]
        },
        "mergeIdentity": false,
        "preferredChannelForResponse": "rtm",
        "customData": {
            "customText": "This is generated by customData"
        }

    };

    try {
        const response = await fetch(CHAT_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${jwToken}`
            },
            body: JSON.stringify(payload)
        });

        const dat = await response.json();

        sessionId = dat.sessionId;

        return dat;
    } catch (error) {
        return "I'm sorry, an error has ocurred: " + error;
    }
};

const say = (message) => {
    console.log(message);
}

const tui = async () => {
    let debug = false;
    if (process.argv[2] === "debug") {
        debug = true;
    }

    say("Hello there! How can I help you today?");

    if (debug) say("108 | Debug is: " + debug);

    const userId = Math.floor(Math.random() * 100000).toString();
    const inputs = process.stdin;
    let dat;
    let pollId;

    inputs.on("data", async (prompt) => {
        if (debug) say(`INFO: 114 | Calling api with prompt ${prompt.toString()}`);

        dat = await callApi(prompt.toString(), userId);

        if (dat.pollId) {
            pollId = dat.pollId;
            say("Response delayed, preparing results...");

            let interval = setInterval(async () => {
                const pollDataRes = await fetch(`${CHAT_URL}/poll/${pollId}`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${jwToken}`
                    },
                    method: "GET"
                });

                const pollData = await pollDataRes.json();

                if (debug) say("128 | Polldata: " + JSON.stringify(pollData));

                if (pollData?.status?.toLowerCase() !== "inprogress") {
                    say(pollData?.data[0].val);
                    if (debug) say("131 | pollData: " + JSON.stringify(pollData));
                    return clearInterval(interval);
                }

                say("Still not available, let me try again");
            }, 3000);
        } else {
            if (debug) say("137 | dat: " + JSON.stringify(dat));
            say(dat.data[0].val);
        }
    });


};
tui();