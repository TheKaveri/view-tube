"use strict";
// Dcoumentation https://cloud.google.com/video-intelligence/docs/analyze-safesearch#video_analyze_explicit_content-nodejs
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isVideoSafe = isVideoSafe;
const video = require('@google-cloud/video-intelligence').v1;
const client = new video.VideoIntelligenceServiceClient();
function isVideoSafe(gcsUri_) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Executing isVideoSafe');
        // Imports the Google Cloud Video Intelligence library
        // Creates a client
        /**
         * TODO(developer): Uncomment the following line before running the sample.
         */
        // const gcsUri = 'GCS URI of video to analyze, e.g. gs://my-bucket/my-video.mp4';
        const gcsUri = gcsUri_;
        const request = {
            inputUri: gcsUri,
            features: ['EXPLICIT_CONTENT_DETECTION'],
        };
        // Human-readable likelihoods
        const likelihoods = [
            'UNKNOWN',
            'VERY_UNLIKELY',
            'UNLIKELY',
            'POSSIBLE',
            'LIKELY',
            'VERY_LIKELY',
        ];
        // Detects unsafe content
        const [operation] = yield client.annotateVideo(request);
        console.log('Waiting for operation to complete...');
        const [operationResult] = yield operation.promise();
        // Gets unsafe content
        const explicitContentResults = operationResult.annotationResults[0].explicitAnnotation;
        console.log('Explicit annotation results:');
        explicitContentResults.frames.forEach((result) => {
            if (result.timeOffset === undefined) {
                result.timeOffset = {};
            }
            if (result.timeOffset.seconds === undefined) {
                result.timeOffset.seconds = 0;
            }
            if (result.timeOffset.nanos === undefined) {
                result.timeOffset.nanos = 0;
            }
            console.log(`\tTime: ${result.timeOffset.seconds}` +
                `.${(result.timeOffset.nanos / 1e6).toFixed(0)}s`);
            console.log(`\t\tPornography likelihood: ${likelihoods[result.pornographyLikelihood]}`);
        });
    });
}
