const axios = require('axios');
const puppeteer = require('puppeteer');
const fs = require('fs');
const request = require('request');

const {
    token,
    systemID,
    pluralkitToken,
    customStatus,
    aboutMeBio
} = require('./config.json');

let isDiscordToken = false;

if (!["", "Please refer to the README to begin the login process."].includes(token)) isDiscordToken = true;

var latestFronts = "";

function check(token) {
    request({
        method: "GET",
        url: "https://discordapp.com/api/v9/users/@me",
        headers: {
            authorization: token
        }
    }, (err, res, body) => {
        if (!body) return;

        var json = JSON.parse(body);
        if (!json.id) return false;
        else if (!json.verified) return false;
        else return true;
    });
}

function frontingScript() {
    axios({
        method: "get",
        url: `https://api.pluralkit.me/v1/s/${systemID}/fronters`,
        headers: {
            Authorization: pluralkitToken
        }
    }).then(res => {
        if (res.data.members.length === 0) {
            if (latestFronts === "No one") return;
            latestFronts = "No one";
            console.log(`Switched to: No one`);
            if (customStatus) {
                axios({
                    method: 'patch',
                    url: `https://discord.com/api/v8/users/@me/settings`,
                    headers: {
                        authorization: token
                    },
                    data: {
                        custom_status: {
                            text: "Fronting: No one",
                            emoji_name: "▶️"
                        }
                    }
                }).catch(err => {
                    throw err;
                });
            }
            if (aboutMeBio) {
                // About Me BIO
            }
        } else if (res.data.members.length === 1) {
            if (latestFronts === res.data.members[0].name) return;
            latestFronts = res.data.members[0].name;
            console.log(`Switched to: ${res.data.members[0].name}`);
            if (customStatus) {
                axios({
                    method: 'patch',
                    url: `https://discord.com/api/v8/users/@me/settings`,
                    headers: {
                        authorization: token
                    },
                    data: {
                        custom_status: {
                            text: `Fronting: ${res.data.members[0].name}`,
                            emoji_name: "▶️"
                        }
                    }
                }).catch(err => {
                    throw err;
                });
            }
            if (aboutMeBio) {
                // About Me BIO
            }
        } else if (res.data.members.length > 1) {
            let fronters = [];
            res.data.members.forEach(member => {
                fronters.push(member.name);
            });
            if (latestFronts === fronters.join(", ")) return;
            latestFronts = fronters.join(", ");
            console.log(`Switched to: ${fronters.join(", ")}`);
            if (customStatus) {
                axios({
                    method: 'patch',
                    url: `https://discord.com/api/v8/users/@me/settings`,
                    headers: {
                        authorization: token
                    },
                    data: {
                        custom_status: {
                            text: `Fronting: ${fronters.join(", ")}`,
                            emoji_name: "▶️"
                        }
                    }
                }).catch(err => {
                    throw err;
                });
            }
            if (aboutMeBio) {
                // About Me BIO
            }
        }
    }).catch((err) => {
        console.log(err.response.data);
        if (err.response.data === "System has no registered switches.") {
            if (latestFronts === "No one") return;
            latestFronts = "No one";
            console.log(`Switched to: No one`);
            if (customStatus) {
                axios({
                    method: 'patch',
                    url: `https://discord.com/api/v8/users/@me/settings`,
                    headers: {
                        authorization: token
                    },
                    data: {
                        custom_status: {
                            text: "Fronting: No one",
                            emoji_name: "▶️"
                        }
                    }
                }).catch(err => {
                    throw err;
                });
            }
            if (aboutMeBio) {
                // About Me BIO
            }
        }
    });
}

if (isDiscordToken || check(token)) {
    if (!pluralkitToken || pluralkitToken === "" || pluralkitToken === "Insert your PK Token") { console.log('Please specify your PluralKit token using the `pk;token` command.'); process.exit(1); }
    if (!systemID || systemID === "" || systemID === "Insert your System ID") { console.log('Please specify your System ID (mostly found at the bottom of the `pk;system` command.)'); process.exit(1); }
    console.log("Ready! Your Custom Status will now change to whoever is fronting.");
    frontingScript();
    setInterval(() => { frontingScript(); }, 45000);
} else {
    (async () => {
        console.log("Please login to your Discord account to link your account token to PKSwitcher.");
        const browser = await puppeteer.launch({
            headless: false,
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1366, height: 768});
        await page.goto('https://discord.com/login?redirect_to=%2Fchannels%2F%40me').then(res => {

            setTimeout(async () => {
                let url1 = await page.url();

                let interval = setInterval(async () => {
                    if (page.url() === url1) return;
                    else {
                        await page.setRequestInterception(true);
                        let i = 0;
                        page.on('request', (interceptedRequest) => {
                            let arr = [];

                            if (interceptedRequest.url().endsWith('science')) {
                                i++;
                                if (i == 1) {
                                    console.log(`Your token has been configured in your config.json ! (${interceptedRequest.headers().authorization})`);

                                    const configFileJSON = JSON.parse(fs.readFileSync('config.json', 'utf8'));
                                    configFileJSON.token = interceptedRequest.headers().authorization;
                                    fs.writeFileSync('config.json', JSON.stringify(configFileJSON, null, 2));

                                    setTimeout(() => {
                                        console.log(`Please restart the application.`);
                                        browser.close();
                                    }, 1500);

                                }
                                interceptedRequest.continue();

                            } else interceptedRequest.continue();
                        });
                        clearInterval(interval);
                    }
                }, 1500);
            }, 1500);
        });
    })();
}
