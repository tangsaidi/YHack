var express = require('express');
var app = express();
var port = process.env.PORT || 8080;
var router = express.Router();
var fs = require('fs');
var path = require("path");

var fileUpload = require('express-fileupload');
app.use(fileUpload());

var bodyParser = require('body-parser');
app.use(bodyParser.json());  
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(__dirname + '/bootstrap'));

var ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');
var tone_analyzer = new ToneAnalyzerV3({
  url: "https://gateway.watsonplatform.net/tone-analyzer/api",
  username: "fb5e7526-37fa-4abd-bbd0-eb957cb699ad",
  password: "hCzs3JtsLKip",
  version_date: '2016-05-19'
});

var SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');
var speech_to_text = new SpeechToTextV1 ({
  url: "https://stream.watsonplatform.net/speech-to-text/api",
  username: "39ecbf24-0782-42b6-bcbe-615e5630a751",
  password: "Vghzb2VvOxE3"
});

var texts = [];

app.post('/upload', function (req, res, next) {
		if(!req.files)
			return res.status(400).send('No audio uploaded');

		audio = req.files.audio;

		audio.mv(__dirname + '/audio.wav', function(err){
			if(err){
      			return res.status(500).send(err);
			}
    		//res.send('File uploaded!');
    		next();
	});
}, function (req, res, next) {

	var files = [__dirname + '/audio.wav'];
	//console.log(fs.createReadStream(files[0]));
	for (var file in files) {
	  var params = {
	  	speaker_labels: true,
	    audio: fs.createReadStream(files[file]),
	    content_type: 'audio/wav',
	    timestamps: true,
	    word_alternatives_threshold: 0.9
	    //keywords: ['colorado', 'tornado', 'tornadoes'],
	    //keywords_threshold: 0.5
	  };

	  speech_to_text.recognize(params, function(error, transcript) {
	    if (error)
	    	console.log('Error:', error);
	    else
	    	//console.log(JSON.stringify(transcript, null, 2));
	    	
	    	var timeStampsIndex = 0;
	    	var timeStamps = transcript.results[0].alternatives[0].timestamps;

	    	var speakers = transcript.speaker_labels;
	    	//console.log(speakers);
	    	var currentSpeaker = speakers[0].speaker;
			var text = "";
			var textsIndex = 0;

	  //   	for(var speakersIndex in speakers){
	  //   		if(speakers[speakersIndex].speaker != currentSpeaker ||
	  //   			speakersIndex == speakers.length - 1){
	  //   			var finalTimeStamp = speakers[speakersIndex].from;
	  //   			while(timeStamps[timeStampsIndex][2] <= finalTimeStamp){
	  //   				text += timeStamps[timeStampsIndex][0];
	  //   				text += " ";
	  //   				timeStampsIndex++;
	  //   			}
	  //   			texts[textsIndex] = text;
	  //   			currentSpeaker = speakers[speakersIndex].speaker;
	  //   			textsIndex++;
	  //   			text = "";
	  //   		};
	  //   	}	
			// text += timeStamps[timeStampsIndex][0];
			// timeStampsIndex++;
			// console.log(speakers.length- 1);
			// console.log(currentSpeaker);
			// if(speakers.length == 1 || speakers[speakers.length - 2].speaker != speakers[speakers.length - 1].speaker){
			// 	texts[textsIndex] = text;
			// }
			// else{
			// 	texts[textsIndex-1] += text;
			// }
	  //   	console.log(texts);
	  //   	console.log(textsIndex);
			// console.log(transcript.results[0].alternatives[0].transcript);
			// text = transcript.results[0].alternatives[0].transcript;
			// next();
			texts[0] = "";
			for(var i in transcript.results){
				texts[0] += transcript.results[i].alternatives[0].transcript;
				console.log(transcript.results[i].alternatives[0].transcript);
			}
			console.log(texts[0]);
			next();
	  });
	}
}, function (req, res) {
	//for(var textsIndex in texts){
		input = texts[0];
	    console.log(input);
		var params = {
			text: input,
			tones: 'emotion'
		};
		tone_analyzer.tone(params, function(error, response) {
		if (error)
			console.log('error:', error);
		else
			console.log(JSON.stringify(response,null,2));
			 res.writeHead(301,
			  {Location: '/results.html?anger=' 
			  + response.document_tone.tone_categories[0].tones[0].score*10000 + '&disgust='
			  + response.document_tone.tone_categories[0].tones[1].score*10000 + '&fear='
			  + response.document_tone.tone_categories[0].tones[2].score*10000 + '&joy='
			  + response.document_tone.tone_categories[0].tones[3].score*10000 + '&sadness='
			  + response.document_tone.tone_categories[0].tones[4].score*10000}
			);
			//res.sendFile(__dirname + '/bootstrap/results.html');
			res.end();
		});
	//}
})

var response;

app.post('/text', function (req, res, next) {
	if(!req.body)
		return res.status(400).send('No text uploaded');

    var input = req.body.text;
    console.log(input);
	var params = {
	  text: input,
	  tones: 'emotion'
	};
	tone_analyzer.tone(params, function(error, response) {
		if (error)
			console.log('error:', error);
		else
			console.log(JSON.stringify(response,null,2));
			 res.writeHead(301,
			  {Location: '/results.html?anger=' 
			  + response.document_tone.tone_categories[0].tones[0].score*10000 + '&disgust='
			  + response.document_tone.tone_categories[0].tones[1].score*10000 + '&fear='
			  + response.document_tone.tone_categories[0].tones[2].score*10000 + '&joy='
			  + response.document_tone.tone_categories[0].tones[3].score*10000 + '&sadness='
			  + response.document_tone.tone_categories[0].tones[4].score*10000}
			);
			//res.sendFile(__dirname + '/bootstrap/results.html');
			res.end();
		});
})

var audio;

app.post('/upload2', function (req, res, next) {
		if(!req.files)
			return res.status(400).send('No audio uploaded');

		audio = req.files.audio;

		audio.mv(__dirname + '/python_script/demo/audio.wav', function(err){
			if(err){
      			return res.status(500).send(err);
			}
    		res.send('File uploaded!');
	});
})

app.get('/getAudio', function(req, res) {
	res.sendFile(__dirname + '/audio.wav');
})

app.get('/index', function (req, res){
	res.sendFile(path.join(__dirname + '/bootstrap/index.html'));
})

var server = app.listen(port, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Example app listening at http://%s:%s", host, port)
})