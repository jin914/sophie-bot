var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var api = "";
var googleTranslate = require('google-translate')(api);
const {Translate} = require('@google-cloud/translate').v2;
const translateClient = new Translate();

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
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
            // !translate "chinese"
            case 'translate':
                if(original == null){
                    returnmessage = 'Need more parameters'
                }
                else{
                    
                    var text = original;

                    if (detectLanguage(text) == undefined) {
                        bot.sendMessage({
                            to: channelID,
                            message: "Error when detecting language"
                        });
                    }
                    else if (detectLanguage(text) == "en") {
                        //if input is english then translate into Chinese
                        console.log("English :>",text);
                        googleTranslate.translate(text, 'zh', function(err, translation) {
                            var returnmessage = ("Chinese (Simplified) :>",translation.translatedText);
                              bot.sendMessage({
                                  to: channelID,
                                  message: returnmessage
                              });
                          });
                    }
                    else {
                        // translate any other language into English
                        console.log("Chinese (Simplified) :>",text);
                        googleTranslate.translate(text, 'en', function(err, translation) {
                            var returnmessage = ("English :>",translation.translatedText);
                              bot.sendMessage({
                                  to: channelID,
                                  message: returnmessage
                              });
                          });
                    }
	
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
    let [detections] = await translateClient.detect(text);
    detections = Array.isArray(detections) ? detections : [detections];
    
    if (detections.length > 0) {
        return detections[0].language; //return the most detected language 
    }
    return undefined;
}