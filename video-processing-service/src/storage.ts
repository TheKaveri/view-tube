// File interactions: upload, download, delete etc.
// 1. Will take care of Goole Cloud Storage file interactions
// 2. Will take care of local file interactions

import { Storage } from "@google-cloud/storage";
import fs from 'fs' // native node.js file system module
import ffmpeg from "fluent-ffmpeg"; // this is a wrapper for the "fluent-ffmpeg" cli tool

const storage = new Storage(); // creates an instance of Google Cloud Storage SDK

// A bucket in Google Cloud Storage is like a folder with a globally unique name.
// Unlike a folder, a bucket can't be nested inside another bucket.

export const rawVideoBucketName = "narmada-raw-videos"; // where users will upload their raw videos
const processedVideoBucketName = "narmada-processed-videos";

// we will temporarily download from the bucket and process 
// locally to reduce latency.
const localRawVideoPath = "./raw-videos";
const localProcessedVideoPath = "./processed-videos";

const scalePadCommand = "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1"

/**
 * Creates the local directories for raw and processed videos in our Docker container.
 */
export function setupDirectories() {
    ensureDirectoryExistence(localRawVideoPath);
    ensureDirectoryExistence(localProcessedVideoPath);
}

/**
 * @param rawVideoName - Name of the file that's located in {@link localRawVideoPath} directory.
 * @param processedVideoName - Mame of the file to process and store in {@link localProcessedVideoPath} directory.
 * @returns A promise that resolves when the video has been converted.
 */
export function convertVideo(rawVideoName: string, processedVideoName: string) {
    return new Promise<void>((resolve, reject) => {
        // Async function to process the video to 360p
        ffmpeg(`${localRawVideoPath}/${rawVideoName}`)
        .outputOptions('-vf', scalePadCommand)
        // Scale to 720p but keep the aspect ratio. Frustratingly Cloud Run gives me errors when I try to add watermarks; does work locally.
        // Refer: https://ffmpeg.org/ffmpeg-utils.html#Video-rate
        // https://stackoverflow.com/questions/17623676/text-on-video-ffmpeg
        // https://stackoverflow.com/questions/46671252/how-to-add-black-borders-to-video

        .on("end", () => {
            console.log("Video processing finished successfully.");
            resolve();
        })
        .on("error", (err) => {
            console.log(`An error occurred in video processing: ${err.message}`);
            reject(err);
        })
        .save(`${localProcessedVideoPath}/${processedVideoName}`); // save to output file
    })
}
// A Javascript Promise is an object that returns a value sometime in the future.
// It can be used to keep track of how asynchronous operations execute.

// Export keyword allows the function (or variable or object) to be accessible outside the module.
// Async keyword allows the function to be asynchronous and return a Promise. Such functions
// are called with the await keyword. Await is used to make Javascript wait until the Promise is
// resolved.

/**
 * @param fileName - The name of the file to download from the 
 * {@link rawVideoBucketName} bucket into the {@link localRawVideoPath} folder.
 * @returns A promise that resolves when the file has been downloaded.
 */
export async function downloadRawVideo(fileName: string) {
    await storage.bucket(rawVideoBucketName)
        .file(fileName)
        .download({
            destination: `${localRawVideoPath}/${fileName}`
        });
    
    // log only after the file has been downloaded. `download` method is an async
    // function, so we use await keyword.
    console.log(`gs://${rawVideoBucketName}/${fileName} downloaded to ${localRawVideoPath}/${fileName}`);
}

/**
 * @param fileName - The name of the file to upload from the 
 * {@link localProcessedVideoPath} folder into the {@link processedVideoBucketName}.
 * @returns A promise that resolves when the file has been uploaded.
 */
export async function uploadProcessedVideo(fileName: string) {
    const bucket = storage.bucket(processedVideoBucketName);

    await bucket.upload(`${localProcessedVideoPath}/${fileName}`, {
        destination: fileName // destination is the name of the file in the bucket
    });

    await bucket.file(fileName).makePublic(); // makes the file public
    // for all users to access.

    console.log(`${localProcessedVideoPath}/${fileName} uploaded to gs://${processedVideoBucketName}/${fileName}`);
}

/**
 * @param fileName - The name of the file to delete from the
 * {@link localRawVideoPath} folder.
 * @returns A promise that resolves when the file has been deleted.
 * 
 */
export function deleteRawVideo(fileName: string) {
    return deleteFile(`${localRawVideoPath}/${fileName}`);
}

/**
* @param fileName - The name of the file to delete from the
* {@link localProcessedVideoPath} folder.
* @returns A promise that resolves when the file has been deleted.
* 
*/
export function deleteProcessedVideo(fileName: string) {
    return deleteFile(`${localProcessedVideoPath}/${fileName}`);
}

/**
 * @param filePath - The path of the file to delete.
 * @returns A promise that resolves when the file has been deleted.
 */
function deleteFile(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.log(`Error deleting ${filePath}: ${err}`);
                    reject(err);
                } else {
                    console.log(`File ${filePath} deleted successfully.`);
                    resolve();
                }
            });
        } else {
            console.log(`File ${filePath} does not exist. Skipping...`);
            resolve();
        }
    })
}

/**
 * Ensures a directory exists, creating it if necessary.
 * @param {string} dirPath - The directory path to check.
 */
function ensureDirectoryExistence(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true }); // recursive = true means that any 
        // subdirectories will be created as well
        console.log(`Directory ${dirPath} created successfully.`);
    }
}

/**
 * @param rawVideoName - Name of the file that's located in {@link localRawVideoPath} directory.
 * @param thumbnailVideoName - Name of the file to process and store in {@link localProcessedVideoPath} directory.
 * @returns A promise that resolves when the thumbnail has been generated.
 */
export function generateThumbnail(rawVideoName: string, thumbnailVideoName: string) {
    return new Promise<void>((resolve, reject) => {
        // Async function to process the video to 360p
        ffmpeg(`${localRawVideoPath}/${rawVideoName}`)
        .outputOptions("-vf", scalePadCommand, "-frames:v", "1") // generate a single frame
        .on("end", () => {
            console.log("Thumbnail generation finished successfully.");
            resolve();
        })
        .on("error", (err) => {
            console.log(`An error occurred while generating thumbnail: ${err.message}`);
            reject(err);
        })
        .save(`${localProcessedVideoPath}/${thumbnailVideoName}`); // save to output file
    })
}


export async function deleteGeneratedThumbnail(thumbnailName: string) {
    return deleteProcessedVideo(thumbnailName);
}

export async function uploadGeneratedThumbnail(thumbnailName: string) {
    return uploadProcessedVideo(thumbnailName);
}