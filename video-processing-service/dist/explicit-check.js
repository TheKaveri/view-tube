"use strict";
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
exports.isExplicit = isExplicit;
// Imports the Google Cloud Video Intelligence library
const video = require('@google-cloud/video-intelligence').v1;
// Creates a client
const client = new video.VideoIntelligenceServiceClient();
/**
 * @param gcsUri - Link of the video to that is in the storage bucket.
 * @returns A boolean that indicates whether the video is explicit or not.
 */
function isExplicit(gcsUri) {
    return __awaiter(this, void 0, void 0, function* () {
        const request = {
            inputUri: gcsUri,
            features: ['EXPLICIT_CONTENT_DETECTION']
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
        // console.log(explicitContentResults.frames)
        let frameLikelihoods = [];
        // console.log('Explicit annotation results:');
        explicitContentResults.frames.forEach((explicitContentFrame) => {
            if (!["VERY_UNLIKELY", "UNLIKELY"].includes(likelihoods[explicitContentFrame.pornographyLikelihood])) {
                // console.log(`${explicitContentFrame.timeOffset.seconds}: ${likelihoods[explicitContentFrame.pornographyLikelihood]}`);
                frameLikelihoods.push(likelihoods[explicitContentFrame.pornographyLikelihood]);
            }
        });
        if (frameLikelihoods.includes("VERY_LIKELY") || frameLikelihoods.includes("LIKELY")) {
            return true;
        }
        else {
            return false;
        }
    });
}
