import { VideoIntelligenceServiceClient } from "@google-cloud/video-intelligence";

// Imports the Google Cloud Video Intelligence library
// const video = require('@google-cloud/video-intelligence').v1;

// Creates a client
// const client = new video.VideoIntelligenceServiceClient();

const client = new VideoIntelligenceServiceClient();

/**
 * @param gcsUri - Link of the video to that is in the storage bucket.
 * @returns A boolean that indicates whether the video is explicit or not.
 */
export async function isExplicit(gcsUri : string) {
    const request: any = {
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
    const [operation]: any = await client.annotateVideo(request);
    console.log('Waiting for operation to complete...');
    const [operationResult] = await operation.promise();
    // Gets unsafe content
    const explicitContentResults =
    operationResult.annotationResults[0].explicitAnnotation;

    // console.log(explicitContentResults.frames)

    let frameLikelihoods: string[] = []
    
    // console.log('Explicit annotation results:');
    explicitContentResults.frames.forEach(
        (explicitContentFrame : any) => {
            if (![ "VERY_UNLIKELY", "UNLIKELY"].includes(likelihoods[explicitContentFrame.pornographyLikelihood])) {
            // console.log(`${explicitContentFrame.timeOffset.seconds}: ${likelihoods[explicitContentFrame.pornographyLikelihood]}`);
            frameLikelihoods.push(likelihoods[explicitContentFrame.pornographyLikelihood])
        }
        }
    )

    if (frameLikelihoods.includes("VERY_LIKELY") || frameLikelihoods.includes("LIKELY")) {
        return true        
    } else {
        return false
    }

}