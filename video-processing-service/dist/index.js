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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// the wrapper helps us use ffmeg in typescript like a library.
const storage_1 = require("./storage");
const firestore_1 = require("./firestore");
const explicit_check_1 = require("./explicit-check");
(0, storage_1.setupDirectories)();
const app = (0, express_1.default)();
// creates an instance of an express app
app.use(express_1.default.json());
// middleware tells express-server to expect requests with JSON data
// post will not be invoked manually. It will be invoked by pubsub
// each time file is uploaded to cloud bucket, this endpoint will be invoked
app.post("/process-video", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // refer https://cloud.google.com/run/docs/tutorials/pubsub
    let data;
    try {
        const message = Buffer.from(req.body.message.data, 'base64').toString('utf8');
        data = JSON.parse(message);
        if (!data.name) {
            throw new Error('Invalid message payload received.');
        }
    }
    catch (error) {
        console.error(error);
        return res.status(400).send('Bad Request: missing filename.');
    }
    const inputFileName = data.name; // Format is <UID>-<DATE>-<TITLE>.<EXTENSION>
    const outputFileName = `processed-${inputFileName}`;
    const videoId = inputFileName.split('.')[0];
    const thumbnailFileName = `thumbnail-${inputFileName}`.split('.')[0] + '.png';
    // change the extension to jpg
    // generate gcsUri from file name
    const gcsUri = "gs://" + storage_1.rawVideoBucketName + inputFileName;
    if (!(0, firestore_1.isVideoNew)(videoId)) {
        return res.status(400).send("Bad Request: Video already processing or processed");
    }
    else {
        let [uid_, date_, ...filename_] = videoId.split('-');
        let title_ = filename_.join('-').split('.')[0];
        yield (0, firestore_1.setVideo)(videoId, {
            id: videoId,
            uid: uid_,
            // filename: filename_.join('-'),
            status: 'processing',
            title: title_,
            date: date_
        });
        // await setVideo(videoId, {
        //     id: videoId,
        //     uid: videoId.split('-')[0],
        //     status: 'processing'
        // });
    }
    const isExplicitFlag = yield (0, explicit_check_1.isExplicit)(gcsUri);
    if (isExplicitFlag) {
        // video is explicit so we stop
        return res.status(400).send('Processing Aborted: Video is explicit.');
    }
    else {
        console.log("Passed explicit check.");
    }
    // video is not explicit so no worries
    // download the raw video from Google Cloud Storage
    yield (0, storage_1.downloadRawVideo)(inputFileName);
    // convert the video to 360p
    try {
        yield (0, storage_1.convertVideo)(inputFileName, outputFileName);
    }
    catch (error) {
        // clean up the local files
        yield Promise.all([
            // making it efficient
            (0, storage_1.deleteRawVideo)(inputFileName),
            (0, storage_1.deleteProcessedVideo)(outputFileName)
        ]);
        console.error(error);
        return res.status(500).send('Server Error: Failed to convert video.');
    }
    // generate thumbnail
    try {
        yield (0, storage_1.generateThumbnail)(inputFileName, thumbnailFileName);
    }
    catch (error) {
        // clean up the local files
        yield Promise.all([
            (0, storage_1.deleteRawVideo)(inputFileName),
            (0, storage_1.deleteGeneratedThumbnail)(thumbnailFileName)
        ]);
        console.error(error);
        return res.status(500).send('Server Error: Failed to generate thumbnail.');
    }
    // upload the processed video to Google Cloud Storage
    yield (0, storage_1.uploadProcessedVideo)(outputFileName);
    // upload the generated thumbnail to Google Cloud Storage
    yield (0, storage_1.uploadGeneratedThumbnail)(thumbnailFileName);
    yield (0, firestore_1.setVideo)(videoId, {
        status: 'processed',
        filename: outputFileName,
        thumbnail: thumbnailFileName
    });
    // clean up the local files
    yield Promise.all([
        (0, storage_1.deleteRawVideo)(inputFileName),
        (0, storage_1.deleteProcessedVideo)(outputFileName)
    ]);
    return res.status(200).send('Video processed successfully.');
}));
const port = process.env.PORT || 3000; // standard way to get port from environment
// When you start your Express server using app.listen, it begins
// to listen for incoming HTTP requests on the specified port.
app.listen(port, () => {
    console.log(`Video processing service listening at http://localhost:${port}`);
});
