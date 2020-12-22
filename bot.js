import Discord from 'discord.io';
import logger from 'winston';
import fetch from 'node-fetch';
import auth from 'google-auth-library';
import * as fs from 'fs';
import gt from 'google-translate';
import gtClass from '@google-cloud/translate';
import moment from 'moment';

const discord_auth = JSON.parse(fs.readFileSync('./auth.json', 'utf8'));

const Translate = gtClass.v2.Translate;
const api = "";
const googleTranslate = gt(api);
const projectID = "sapient-notch-272806";
const translateClient = new Translate({projectID});

var users = [{ 'name': 'buiisabella', 'stars': 'pisces', 'birthday': 'February 21' },
            { 'name': 'maddymq', 'stars': 'pisces', 'birthday': 'March 11' },
            { 'name': 'Majestix', 'stars': 'gemini', 'birthday': 'June 13' },
            { 'name': 'kazdingle', 'stars': 'cancer', 'birthday': 'July 8' },
            { 'name': 'amblypygid', 'stars': 'libra', 'birthday': 'September 30' },
            { 'name': 'direangelz', 'stars': 'aries', 'birthday': 'April 2' },
            { 'name': 's0ph1e.wu', 'stars': 'libra', 'birthday': 'October 21' },
            { 'name': 'Wontongss', 'stars': 'leo', 'birthday': 'August 20' },
            { 'name': 'zoevstheworld', 'stars': 'pisces', 'birthday': 'March 9' },
            { name: 'synapses', stars: 'scorpio', birthday: 'March 9' }];

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: discord_auth.token,
   autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});
bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
        var i = message.indexOf(' ');
        var args = message.substring(1).split(' ');
        var cmd = args[0];
        var original = message.slice(i + 1, message.length).trim();
        var returnmessage = "";
       
        args = args.splice(1);
        switch(cmd) {
            // !help
            case 'help':
                bot.sendMessage({
                    to: channelID,
                    message: 'Here are some commands you can ask me:'
                            + '\n !ping - I\'ll respond back with pong!'
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

                if(!username) {
                    bot.sendMessage({
                        to: channelID,
                        message: `sorry, <@${userID}> - I don't know who you are`
                    });

                    return;
                }

                const star = username['stars'];

                fetch(`http://horoscope-api.herokuapp.com/horoscope/today/${star}`)
                    .then(res => res.json())
                    .then(json => {
                        var date = new moment(json.date);

                        bot.sendMessage({
                            to: channelID,
                            message: `Hello ${username.name}, here is today's horoscope for ${star}!
                            \nIt's ${date.format("dddd, MMMM Do YYYY")}. ${json['horoscope']}`
                        });
                })
                
                break;
            // !translate "chinese"
            case 'translate':
                if(original == null){
                    returnmessage = 'Need more parameters'
                }
                else{                    
                    var text = original;
                    detectLanguage(text).then(lang => {
                        console.log("Lang: " + lang)
                        if (lang == undefined) {
                            bot.sendMessage({
                                to: channelID,
                                message: "Error when detecting language"
                            });
                        }
                        else if (lang == "en") {
                            //if input is english then translate into Chinese
                            console.log("English :>",text);
                            googleTranslate.translate(text, 'zh-cn', function(err, translation) {
                                var returnmessage = ("Chinese :>",translation.translatedText);
                                  bot.sendMessage({
                                      to: channelID,
                                      message: returnmessage
                                  });
                              });
                        }
                        else {
                            // translate any other language into English
                            console.log("Chinese (Simplified) :>",text);
                            googleTranslate.translate(text, 'en-us', function(err, translation) {
                                var returnmessage = ("English :>",translation.translatedText);
                                  bot.sendMessage({
                                      to: channelID,
                                      message: returnmessage
                                  });
                              });
                        }
                    });
	
                }
                
                break;
            // Just add any case commands if you want to..
         }
     }else{
        if(message.includes('sophie-bot')){
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
    console.log("created a client")
    let [detections] = await translateClient.detect(text);
    console.log("finished client")
    detections = Array.isArray(detections) ? detections : [detections];
    
    if (detections.length > 0) {
        return detections[0].language; //return the most detected language 
    }
    return undefined;
}
