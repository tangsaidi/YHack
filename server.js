var express = require('express');
var app = express();
var port = process.env.PORT || 8000;
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
	username: process.env.TAAPIKEY,
  password: process.env.TAPASS,
  version_date: '2016-05-19'
});

var SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');
var speech_to_text = new SpeechToTextV1 ({
  url: "https://stream.watsonplatform.net/speech-to-text/api",
  username: process.env.STTKEY,
  password: process.env.STTPASS
});

var texts = [""];
var obj;
var audio;

app.post('/upload', function (req, res, next) {
		texts[0] = "";
		if(!req.files)
			return res.status(400).send('No audio uploaded');

		fs.unlink(__dirname + '/audio.wav', function(err) {
		    if(err && err.code == 'ENOENT') {
		        // file doens't exist
		        console.info("File doesn't exist, won't remove it.");
		    } else if (err) {
		        // other errors, e.g. maybe we don't have enough permission
		        console.error("Error occurred while trying to remove file");
		    } else {
		        console.info(`removed`);
		    }
		});

		setTimeout(function() {
			console.log('Setting Wav');
			audio = req.files.audio;
			console.log(audio);
				audio.mv(__dirname + '/audio.wav', function(err){
					if(err){
		      			return res.status(500).send(err);
					}
		    		next();
			});
		}, 3000);
		
}, function (req, res, next) {
	setTimeout(function() {
		console.log('Reading json');
		obj = JSON.parse(fs.readFileSync(__dirname + '/json/whatever.json', 'utf8'));
		console.log(obj);
		next();
	}, 3000)
}, function (req, res, next) {
		if(!req.files)
			return res.status(400).send('No audio uploaded');

		audio.mv(__dirname + '/audio.wav', function(err){
			if(err){
      			return res.status(500).send(err);
			}
    		next();
	});
}, function (req, res, next) {

	var file = __dirname + '/audio.wav';
	var params = {
		speaker_labels: true,
	audio: fs.createReadStream(file),
	content_type: 'audio/wav',
	timestamps: true,
	word_alternatives_threshold: 0.9
	};

	speech_to_text.recognize(params, function(error, transcript) {
	if (error)
		console.log('Error:', error);
	else
		text = "";
		for(var i in transcript.results){
			texts[0] += transcript.results[i].alternatives[0].transcript;
		}
		next();
	});

}, function (req, res) {
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
		    + response.document_tone.tone_categories[0].tones[4].score*10000 + '&neutral='
			+ obj[0][0].Neutral*10000 + '&happy='
			+ obj[0][1].Happy*10000 + '&bitter='
			+ obj[0][2].Sad*10000 + '&aggresion='
			+ obj[0][3].Anger*10000 + '&distress='
			+ obj[0][4].Fear*10000 + '&speech2text='
			+ texts[0]}
		);
		res.end();
	});
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
			  + response.document_tone.tone_categories[0].tones[4].score*10000 + '&speech2text='
			  + input}
			);
			res.end();
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
