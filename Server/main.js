var express = require('express');
var app = express();
var port = process.env.PORT || 8080;
var router = express.Router();
var ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');

var bodyParser = require('body-parser');
app.use(bodyParser.json());  
app.use(bodyParser.urlencoded({ extended: false }));

var tone_analyzer = new ToneAnalyzerV3({
  url: "https://gateway.watsonplatform.net/tone-analyzer/api",
  username: "fb5e7526-37fa-4abd-bbd0-eb957cb699ad",
  password: "hCzs3JtsLKip",
  version_date: '2016-05-19'
});

app.post('/watson', function (req, res) {
    console.log("Got a POST request for the watson");
    console.log(req.body);
    var input = req.body.Input;
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


