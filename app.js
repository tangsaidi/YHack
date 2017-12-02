var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

var express = require('express');
var app = express();
var port = process.env.PORT || 3000;
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

var text = "";

app.post('/audio2emotion', function (req, res, next) {

	var files = [__dirname + '/audio.flac'];
	//console.log(fs.createReadStream(files[0]));
	for (var file in files) {
	  var params = {
	  	speaker_labels: true,
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
	    	//console.log(JSON.stringify(transcript, null, 2));
	    	
	    	var timeStampsIndex = 0;
	    	var timeStamps = transcript.results[0].alternatives[0].timestamps;

	    	var speakers = transcript.speaker_labels;
	    	var currentSpeaker = speakers[0].speaker;
	
	    	for(var speakersIndex in speakers){
	    		if(speakers[speakersIndex].speaker != currentSpeaker ||
	    			speakersIndex == speakers.length - 1){
	    			var finalTimeStamp = speakers[speakersIndex].from;
	    			while(timeStamps[timeStampsIndex][2] <= finalTimeStamp){
	    				text += timeStamps[timeStampsIndex][0];
	    				text += " ";
	    				timeStampsIndex++;
	    			}
	    			text += timeStamps[timeStampsIndex][0];
	    			timeStampsIndex++;
	    			next();
	    			currentSpeaker = speakers[speakersIndex].speaker;
	    			text = "";
	    		}
	    	}	
			console.log(transcript.results[0].alternatives[0].transcript);
			text = transcript.results[0].alternatives[0].transcript;
	  		
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

var audio;

app.post('/uploadOld', function (req, res, next) {
		if(!req.files)
			return res.status(400).send('No audio uploaded');

		audio = req.files.audio;

		audio.mv(__dirname + '/audio.flac', function(err){
			if(err){
      			return res.status(500).send(err);
    			res.send('File uploaded!');
			}
	});
})

var multer = require('multer');
var AWS = require('aws-sdk');
var multerS3 = require('multer-s3');

AWS.config.update({
    accessKeyId: 'AKIAIUQRXK6FIFIYP5YA',
    secretAccessKey: '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'
});

var s3 = new AWS.S3();

var upload = multer({
	storage: multerS3({
		s3: s3,
		bucket: 'yhack',
		metadata: function (req, file, cb) {
	      cb(null, {fieldName: file.fieldname});
	    },
		key: function (req, file, cb){
			console.log(file);
			cb(null, 'audio.flac');
		}
	})
})

app.post('/upload', upload.single('audio'), function (req, res, next) {
    res.send("Uploaded!");
});

app.get('/index', function (req, res){
	res.sendFile(path.join(__dirname + '/bootstrap/index.html'));
})

module.exports = app;
