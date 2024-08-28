import express from "express";
// the wrapper helps us use ffmeg in typescript like a library.

import { convertVideo, deleteProcessedVideo, deleteRawVideo, downloadRawVideo, setupDirectories, uploadProcessedVideo, generateThumbnail, uploadGeneratedThumbnail, deleteGeneratedThumbnail, rawVideoBucketName } from "./storage";
import { isVideoNew, setVideo } from "./firestore";

import { isExplicit } from "./explicit-check";

setupDirectories();

const app = express();
// creates an instance of an express app
app.use(express.json());
// middleware tells express-server to expect requests with JSON data

// post will not be invoked manually. It will be invoked by pubsub
// each time file is uploaded to cloud bucket, this endpoint will be invoked
app.post("/process-video", async (req, res) => {
    // refer https://cloud.google.com/run/docs/tutorials/pubsub

    let data;
    try {
        const message = Buffer.from(req.body.message.data, 'base64').toString('utf8');
        data = JSON.parse(message);
        if (!data.name) {
            throw new Error('Invalid message payload received.');
        }
    } catch (error) {
        console.error(error);
        return res.status(400).send('Bad Request: missing filename.');
    }

    const inputFileName = data.name; // Format is <UID>-<DATE>-<TITLE>.<EXTENSION>
    const outputFileName = `processed-${inputFileName}`;
    const videoId = inputFileName.split('.')[0];

    const thumbnailFileName = `thumbnail-${inputFileName}`.split('.')[0] + '.png';
    // change the extension to jpg

    // generate gcsUri from file name
    const gcsUri = "gs://" + rawVideoBucketName + inputFileName;

    if (!isVideoNew(videoId)) {
        return res.status(400).send("Bad Request: Video already processing or processed");
    } else {
        let [uid_, date_, ...filename_] = videoId.split('-');
        let title_ = filename_.join('-').split('.')[0];

        await setVideo(videoId, {
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

    const isExplicitFlag = await isExplicit(gcsUri);

    if (isExplicitFlag) {
        // video is explicit so we stop
        return res.status(400).send('Processing Aborted: Video is explicit.');
    } else {
        console.log("Passed explicit check.")
    }
    // video is not explicit so no worries

    // download the raw video from Google Cloud Storage
    await downloadRawVideo(inputFileName);

    // convert the video to 360p
    try {
        await convertVideo(inputFileName, outputFileName);        
    } catch (error) {
        // clean up the local files
        await Promise.all([ // this awaits both deletions in parallel
            // making it efficient
            deleteRawVideo(inputFileName),
            deleteProcessedVideo(outputFileName)
        ])
        console.error(error);
        return res.status(500).send('Server Error: Failed to convert video.');
    }

    // generate thumbnail
    try {
        await generateThumbnail(inputFileName, thumbnailFileName);
    } catch (error) {
        // clean up the local files
        await Promise.all([
            deleteRawVideo(inputFileName),
            deleteGeneratedThumbnail(thumbnailFileName)
        ])
        console.error(error);
        return res.status(500).send('Server Error: Failed to generate thumbnail.');
    }

    // upload the processed video to Google Cloud Storage
    await uploadProcessedVideo(outputFileName);

    // upload the generated thumbnail to Google Cloud Storage
    await uploadGeneratedThumbnail(thumbnailFileName);

    await setVideo(videoId, {
        status: 'processed',
        filename: outputFileName,
        thumbnail: thumbnailFileName
    });

    // clean up the local files
    await Promise.all([
        deleteRawVideo(inputFileName),
        deleteProcessedVideo(outputFileName)
    ]);

    return res.status(200).send('Video processed successfully.');

});

const port = process.env.PORT || 3000; // standard way to get port from environment

// When you start your Express server using app.listen, it begins
// to listen for incoming HTTP requests on the specified port.
app.listen(port, () => {
    console.log(`Video processing service listening at http://localhost:${port}`);
});