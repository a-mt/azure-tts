var http  = require('http'),
    https = require('https'),
    fs    = require('fs');

require('dotenv').config(); // load .env variables

const DEBUG = process.env.DEBUG || false;

//---------------------------------------------------------

function params(href) {
    var hash = href.indexOf('#');
    if(hash != -1) {
        href = href.substr(0, hash);
    }
    var vars = {};
    href.replace( 
        /[?&]+([^=&]+)=?([^&]*)?/gi, // regexp
        function( m, key, value ) { // callback
            vars[key] = value !== undefined ? value : '';
        }
    );
    return vars;
}

async function httpsRequest(url, options, body='') {
    return new Promise((resolve,reject) => {

        if(options.method == 'POST' && body) {
            options['Content-Length'] = body.length;
        }

        const req = https.request(url, options, (res) => {
            let chunks = [],
                statusCode = res.statusCode;

            res.on('data', (chunk) => { chunks.push(chunk); });
            res.on('end', () => {
                let content = Buffer.concat(chunks);
                /*
                switch(res.headers['content-type']) {
                    case 'application/json':
                        content = JSON.parse(content);
                        break;
                }
                */
                resolve({statusCode, content, headers: res.headers});
            });
        }).on("error", reject);

        if(body) {
            req.write(body);
        }
        req.end();
    });
}

//---------------------------------------------------------

// Gets an access token.
async function getAccessToken() {
    let res = await httpsRequest(process.env.ENDPOINT + '/issueToken', {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': process.env.KEY
        }
    });
    DEBUG && console.log("Access token status code: " + res.statusCode);
    return res.content;
}

// Testing access: retrieve the list of available voices
async function listVoices() {
    let accessToken = await getAccessToken();

    let res = await httpsRequest('https://westus.tts.speech.microsoft.com/cognitiveservices/voices/list', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'application/json'
        }
    });
    console.log('Get voices: ', res);

    if(res.statusCode == 200) {
        console.log(JSON.parse(res.content));

        fs.writeFile('voices.json', res.content, function(err) {
            if(err) {
                console.error(err);
            } else {
                console.log('Created voices.json');
            }
        });
    }
}

// TTS
async function textToSpeech(text='Hello World', voice='en-US-ZiraRUS') {
    let accessToken     = await getAccessToken(),
        {lang, country} = voice.split('-');

    // https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/speech-synthesis-markup
    let xml = "<speak xmlns='https://www.w3.org/2001/10/synthesis' version='1.0' xml:lang='" + lang + "-" + country + "'>"
              + "<voice name='" + voice + "'>" + text + "</voice>"
              + "</speak>";

    let res = await httpsRequest('https://westus.tts.speech.microsoft.com/cognitiveservices/v1', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + accessToken,
            'Cache-control': 'No-cache',
            'User-Agent': 'test-TTS',
            'X-Microsoft-OutputFormat': 'riff-16khz-16bit-mono-pcm',
            'Content-Type': 'application/ssml+xml'
        }
    }, xml);

    DEBUG && console.log(res);
    return res.content;
}

// Handle requests
const requestHandler = (req, res) => {
    var _GET = params(req.url);

    // Allow CSS requests
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin ? req.headers.origin : '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Check parameters
    if(!_GET.q) {
        fs.readFile('./voices.json', function(error, content) {
            let voices = JSON.parse(content);

            res.setHeader('Content-Type', 'text/html');
            res.end(`<!DOCTYPE html>
                <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>TTS Form</title>
                        <style>
                            form { max-width: 800px; background: #f5f5f5; padding: 15px; }
                            label { display: inline-block; width: 50px; }
                        </style>
                    </head>
                    <body>
                        <form method="GET">
                            <div>
                                <label for="q">Text</label>
                                <input id="q" name="q" value="Hello World">
                            </div>
                            <div>
                                <label for="voice">Voice</label>
                                <select id="voice" name="voice">
                                    ${voices.map(voice => `<option ${voice.ShortName == 'en-US-ZiraRUS' ? ' selected="selected"' : ''} value="${voice.ShortName}">
                                                                ${voice.Locale} ${voice.Gender} (${voice.ShortName})
                                                            </option>`).join('\n')}
                                </select>
                            </div>
                            <br>
                            <input type="submit">
                        </form>
                    </body>
                </html>`);
        });
        return;
    }

    let text  = decodeURIComponent(_GET.q.replace(/\+/g, '%20')),
        voice = _GET.voice || 'en-US-ZiraRUS';
    DEBUG && console.log(text, voice);

    textToSpeech(text, voice).then(function(raw_wav){
        if(typeof _GET.download != "undefined") {
            res.setHeader('Content-Type', 'audio/wav');
            res.setHeader('Content-Disposition', 'inline; filename="TTSOutput.wav"');
            res.setHeader('Content-Length', raw_wav.length);
            res.write(raw_wav, 'binary');
            res.end();

        } else {
            res.setHeader('Content-Type', 'text/html');
            res.end('<audio controls src="data:audio/x-wav;base64,' + raw_wav.toString('base64') + '"></audio>');
        }
    });
};

// Start server
const server = http.createServer(requestHandler),
      port   = process.env.PORT || 8080;

server.listen(port, function(){
   console.log('The server is listening on port ' + port);
});