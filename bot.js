import Discord from 'discord.io';
import fetch from 'node-fetch';
import * as fs from 'fs';
import gt from 'google-translate';
import gtClass from '@google-cloud/translate';
import moment from 'moment';

const credentials = JSON.parse(fs.readFileSync('./auth.json', 'utf8'));
const discord_auth = { token: credentials.token };
const googleApiKey = credentials.googleApiKey;

const Translate = gtClass.v2.Translate;
const googleTranslate = gt(googleApiKey);
const translateClient = new Translate({ key: googleApiKey });

const users = [{ 'name': 'buiisabella', 'stars': 'pisces', 'birthday': 'February 21' },
    { 'name': 'maddymq', 'stars': 'pisces', 'birthday': 'March 11' },
    { 'name': 'Majestix', 'stars': 'gemini', 'birthday': 'June 13' },
    { 'name': 'kazdingle', 'stars': 'cancer', 'birthday': 'July 8' },
    { 'name': 'amblypygid', 'stars': 'libra', 'birthday': 'September 30' },
    { 'name': 'direangelz', 'stars': 'aries', 'birthday': 'April 2' },
    { 'name': 's0ph1e.wu', 'stars': 'libra', 'birthday': 'October 21' },
    { 'name': 'Wontongss', 'stars': 'leo', 'birthday': 'August 20' },
    { 'name': 'zoevstheworld', 'stars': 'pisces', 'birthday': 'March 9' },
    { name: 'synapses', stars: 'scorpio', birthday: 'March 9' }];

// Initialize Discord Bot
const bot = new Discord.Client({
    token: discord_auth.token,
    autorun: true
});

bot.on('ready', _ => {
    console.log("Connected");
    console.log("Logged in as:");
    console.log(`${bot.username} - (${bot.id})`);
});

bot.on('message', (user, userID, channelID, message) => {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if(message.substring(0, 1) === '!') {
        const i = message.indexOf(' ');
        let args = message.substring(1).split(' ');
        const cmd = args[0];
        const original = message.slice(i + 1, message.length).trim();

        args = args.splice(1);

        switch(cmd) {
            // !help
            case 'help':
                bot.sendMessage({
                    to: channelID,
                    message: 'Here are some commands you can ask me:'
                        + '\n !ping - I\'ll respond back with pong!'
                        + '\m !stars - I\'ll get you today\'s horoscope'
                        + '\n !translate text - I\'ll translate your text from Chinese to English.'
                });
                break;
            // !ping
            case 'ping':
                bot.sendMessage({
                    to: channelID,
                    message: 'Pong!'
                });
                break;
            case 'stars':
                const username = users.find(o => o.name === user);

                if(!username)
                    return bot.sendMessage({
                        to: channelID,
                        message: `sorry, <@${userID}> - I don't know who you are`
                    });

                fetch(`http://horoscope-api.herokuapp.com/horoscope/today/${username.stars}`)
                    .then(res => res.json())
                    .then(json => {
                        const date = new moment(json.date);

                        bot.sendMessage({
                            to: channelID,
                            message: `Hello ${username.name}, here is today's horoscope for ${star}!
                            \nIt's ${date.format("dddd, MMMM Do YYYY")}. ${json['horoscope']}`
                        });
                    })

                break;
            // !translate "chinese"
            case 'translate':
                if(!original) {
                    return bot.sendMessage({
                        to: channelID,
                        message: "Need more parameters"
                    });
                }

                const text = original;

                detectLanguage(text).then(lang => {
                    console.log(`Lang: ${lang}`);

                    if(!lang) {
                        bot.sendMessage({
                            to: channelID,
                            message: "Error when detecting language"
                        });
                    } else if(lang === "en") {
                        //if input is english then translate into Chinese
                        console.log("English :>", text);

                        googleTranslate.translate(text, 'zh-cn', function(err, translation) {
                            if(err)
                                console.log(err);

                            bot.sendMessage({
                                to: channelID,
                                message: `Chinese :> ${translation.translatedText}`
                            });
                        });
                    } else {
                        // translate any other language into English
                        console.log("Chinese (Simplified) :>", text);

                        googleTranslate.translate(text, 'en', function(err, translation) {
                            if(err)
                                console.log(err);

                            bot.sendMessage({
                                to: channelID,
                                message: `English :> ${translation.translatedText}`
                            });
                        });
                    }
                });

                break;
            // Just add any case commands if you want to..
        }
    } else {
        if(message.includes('sophie-bot')) {
            bot.sendMessage({
                to: channelID,
                message: 'Did you ask for a bot? Here I am!'
            });
        }
    }
});

// Detects the language. "text" can be a string for detecting the language of
// a single piece of text, or an array of strings for detecting the languages
// of multiple texts.
async function detectLanguage(text) {
    console.log("created a client");

    let [detections] = await translateClient.detect(text);

    console.log("finished client");

    detections = Array.isArray(detections) ? detections : [detections];

    if(detections.length > 0)
        return detections[0].language; //return the most detected language
}
