"use strict";
// File interactions: upload, download, delete etc.
// 1. Will take care of Goole Cloud Storage file interactions
// 2. Will take care of local file interactions
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDirectories = setupDirectories;
exports.convertVideo = convertVideo;
exports.downloadRawVideo = downloadRawVideo;
exports.uploadProcessedVideo = uploadProcessedVideo;
exports.deleteRawVideo = deleteRawVideo;
exports.deleteProcessedVideo = deleteProcessedVideo;
exports.generateThumbnail = generateThumbnail;
exports.deleteGeneratedThumbnail = deleteGeneratedThumbnail;
exports.uploadGeneratedThumbnail = uploadGeneratedThumbnail;
const storage_1 = require("@google-cloud/storage");
const fs_1 = __importDefault(require("fs")); // native node.js file system module
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg")); // this is a wrapper for the "fluent-ffmpeg" cli tool
const storage = new storage_1.Storage(); // creates an instance of Google Cloud Storage SDK
// A bucket in Google Cloud Storage is like a folder with a globally unique name.
// Unlike a folder, a bucket can't be nested inside another bucket.
const rawVideoBucketName = "narmada-raw-videos"; // where users will upload their raw videos
const processedVideoBucketName = "narmada-processed-videos";
// we will temporarily download from the bucket and process 
// locally to reduce latency.
const localRawVideoPath = "./raw-videos";
const localProcessedVideoPath = "./processed-videos";
/**
 * Creates the local directories for raw and processed videos in our Docker container.
 */
function setupDirectories() {
    ensureDirectoryExistence(localRawVideoPath);
    ensureDirectoryExistence(localProcessedVideoPath);
}
/**
 * @param rawVideoName - Name of the file that's located in {@link localRawVideoPath} directory.
 * @param processedVideoName - Mame of the file to process and store in {@link localProcessedVideoPath} directory.
 * @returns A promise that resolves when the video has been converted.
 */
function convertVideo(rawVideoName, processedVideoName) {
    return new Promise((resolve, reject) => {
        // Async function to process the video to 360p
        (0, fluent_ffmpeg_1.default)(`${localRawVideoPath}/${rawVideoName}`)
            .outputOptions("-vf", "drawtext=fontfile=/path/to/font.ttf:text='scaled to 720p via ffmpeg':fontcolor=white:fontsize=24:box=1:boxcolor=black@0.5:boxorder w=5:x=10:y=10", "-codec:a", "copy")
            // Scale to 720p but keep the aspect ratio and add a wartermark.
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
    });
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
function downloadRawVideo(fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        yield storage.bucket(rawVideoBucketName)
            .file(fileName)
            .download({
            destination: `${localRawVideoPath}/${fileName}`
        });
        // log only after the file has been downloaded. `download` method is an async
        // function, so we use await keyword.
        console.log(`gs://${rawVideoBucketName}/${fileName} downloaded to ${localRawVideoPath}/${fileName}`);
    });
}
/**
 * @param fileName - The name of the file to upload from the
 * {@link localProcessedVideoPath} folder into the {@link processedVideoBucketName}.
 * @returns A promise that resolves when the file has been uploaded.
 */
function uploadProcessedVideo(fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        const bucket = storage.bucket(processedVideoBucketName);
        yield bucket.upload(`${localProcessedVideoPath}/${fileName}`, {
            destination: fileName // destination is the name of the file in the bucket
        });
        yield bucket.file(fileName).makePublic(); // makes the file public
        // for all users to access.
        console.log(`${localProcessedVideoPath}/${fileName} uploaded to gs://${processedVideoBucketName}/${fileName}`);
    });
}
/**
 * @param fileName - The name of the file to delete from the
 * {@link localRawVideoPath} folder.
 * @returns A promise that resolves when the file has been deleted.
 *
 */
function deleteRawVideo(fileName) {
    return deleteFile(`${localRawVideoPath}/${fileName}`);
}
/**
* @param fileName - The name of the file to delete from the
* {@link localProcessedVideoPath} folder.
* @returns A promise that resolves when the file has been deleted.
*
*/
function deleteProcessedVideo(fileName) {
    return deleteFile(`${localProcessedVideoPath}/${fileName}`);
}
/**
 * @param filePath - The path of the file to delete.
 * @returns A promise that resolves when the file has been deleted.
 */
function deleteFile(filePath) {
    return new Promise((resolve, reject) => {
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlink(filePath, (err) => {
                if (err) {
                    console.log(`Error deleting ${filePath}: ${err}`);
                    reject(err);
                }
                else {
                    console.log(`File ${filePath} deleted successfully.`);
                    resolve();
                }
            });
        }
        else {
            console.log(`File ${filePath} does not exist. Skipping...`);
            resolve();
        }
    });
}
/**
 * Ensures a directory exists, creating it if necessary.
 * @param {string} dirPath - The directory path to check.
 */
function ensureDirectoryExistence(dirPath) {
    if (!fs_1.default.existsSync(dirPath)) {
        fs_1.default.mkdirSync(dirPath, { recursive: true }); // recursive = true means that any 
        // subdirectories will be created as well
        console.log(`Directory ${dirPath} created successfully.`);
    }
}
/**
 * @param rawVideoName - Name of the file that's located in {@link localRawVideoPath} directory.
 * @param thumbnailVideoName - Name of the file to process and store in {@link localProcessedVideoPath} directory.
 * @returns A promise that resolves when the thumbnail has been generated.
 */
function generateThumbnail(rawVideoName, thumbnailVideoName) {
    return new Promise((resolve, reject) => {
        // Async function to process the video to 360p
        (0, fluent_ffmpeg_1.default)(`${localRawVideoPath}/${rawVideoName}`)
            .outputOptions("-frames:v", "1") // generate a single frame
            .on("end", () => {
            console.log("Thumbnail generation finished successfully.");
            resolve();
        })
            .on("error", (err) => {
            console.log(`An error occurred while generating thumbnail: ${err.message}`);
            reject(err);
        })
            .save(`${localProcessedVideoPath}/${thumbnailVideoName}`); // save to output file
    });
}
function deleteGeneratedThumbnail(thumbnailName) {
    return __awaiter(this, void 0, void 0, function* () {
        return deleteProcessedVideo(thumbnailName);
    });
}
function uploadGeneratedThumbnail(thumbnailName) {
    return __awaiter(this, void 0, void 0, function* () {
        return uploadProcessedVideo(thumbnailName);
    });
}
