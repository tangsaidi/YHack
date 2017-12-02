var express = require('express');
var app = express();
var port = process.env.PORT || 8080;
var router = express.Router();
var ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');
var fs = require('fs');

var bodyParser = require('body-parser');
app.use(bodyParser.json());  
app.use(bodyParser.urlencoded({ extended: false }));

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

var text;

app.post('/speech2text', function (req, res, next) {
	var files = ['audio-file.flac'];
	console.log(files);
	for (var file in files) {
	  var params = {
	    audio: fs.createReadStream(files[file]),
	    content_type: 'audio/flac',
	    timestamps: true,
	    word_alternatives_threshold: 0.9
	    //keywords: ['colorado', 'tornado', 'tornadoes'],
	    //keywords_threshold: 0.5
	  };

	  speech_to_text.recognize(params, function(error, transcript) {
	    if (error)
	    	console.log('Error:', error);
	    else
			console.log(transcript.results[0].alternatives[0].transcript);
			text = transcript.results[0].alternatives[0].transcript;
	  		next();
	  });
	}
}, function (req, res) {
	input = text;
    console.log(input);
	var params = {
	  text: input,
	  tones: 'emotion'
	};
	tone_analyzer.tone(params, function(error, response) {
	if (error)
		console.log('error:', error);
	else
		res.json(JSON.stringify(response, null, 2));
	});
})

app.post('/text2emotion', function (req, res) {
    var input = req.body.input;
    console.log(input);
	var params = {
	  text: input,
	  tones: 'emotion'
	};
	tone_analyzer.tone(params, function(error, response) {
	if (error)
		console.log('error:', error);
	else
		res.json(JSON.stringify(response, null, 2));
	});
})

var server = app.listen(port, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Example app listening at http://%s:%s", host, port)
})


