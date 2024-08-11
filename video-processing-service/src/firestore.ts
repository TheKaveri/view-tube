// to fix the pub/sub and cloud-run bug
// target: enfore idempotency

import { credential } from "firebase-admin";
import {initializeApp} from "firebase-admin/app";
import {Firestore} from "firebase-admin/firestore";

initializeApp({credential: credential.applicationDefault()});

const firestore = new Firestore();

// Note: This requires setting an env variable in Cloud Run
/** if (process.env.NODE_ENV !== 'production') {
  firestore.settings({
      host: "localhost:8080", // Default port for Firestore emulator
      ssl: false
  });
} */

const videoCollectionId = "videos";

// what we expect our firestore data to look like
export interface Video {
    id?: string,
    uid?: string,
    filename?: string,
    status?: 'processing' | 'processed',
    title?: string,
    description?: string,
    date?: string,
    thumbnail?: string
}

async function getVideo(videoId: string) {
    const snapshot = await firestore.collection(videoCollectionId).doc(videoId).get();
    return (snapshot.data() as Video) ?? {}; // return empty object if undefined; 
    // otherwise return the data as a video
}

export function setVideo(videoId: string, video: Video) {
    return firestore
        .collection(videoCollectionId)
        .doc(videoId)
        .set(video, {merge: true}) // append the interface-data to
        // the doc if it already exists. Don't overwrite the existing
        // doc.
}

export async function isVideoNew(videoId: string) {
    const video = await getVideo(videoId);
    return video?.status == undefined;
}