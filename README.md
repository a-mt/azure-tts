
# Azure TTS

## Install

* Get your API Key
  * Go to [Microsoft Azure > Text to Speech](https://azure.microsoft.com/en-us/services/cognitive-services/text-to-speech/) and click "Try Text to Speech"
  * Login
  * Go to [Your APIS](https://azure.microsoft.com/en-us/try/cognitive-services/my-apis/)
  * In the "Speech services" block, click "Add"  
  * An endpoint and two subscription keys will be listed beside Speech Services.  
    Add the endpoind and either one of the key to the `.env` file (you can use `.env.example` as reference) or set the corresponding environment variables.

## Run

    npm start

## Call

    ?q=<TEXT>&voice=<VOICENAME>

| Parameter |	Description
|---        |---
| q 	    | Text to read
| voice     | [Voice to use](https://docs.microsoft.com/en-US/azure/cognitive-services/speech-service/language-support#standard-voices). Default: "en-US-ZiraRUS"
| download  | Return the wav file, not html

---

## Sources:  
[Try Speech Services for free](https://docs.microsoft.com/en-US/azure/cognitive-services/speech-service/get-started)  
[Quickstart: Convert text-to-speech using Node.js](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/quickstart-nodejs-text-to-speech)  
[Azure-Samples/Cognitive-Speech-TTS](https://github.com/Azure-Samples/Cognitive-Speech-TTS/blob/master/Samples-Http/NodeJS/TTSSample.js)  
[Text-to-speech REST API](https://docs.microsoft.com/en-US/azure/cognitive-services/speech-service/rest-text-to-speech)