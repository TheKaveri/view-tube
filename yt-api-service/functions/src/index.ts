import * as functions from "firebase-functions";
import {initializeApp} from "firebase-admin/app";
// firebase-admin helps us update our firestore database
import {Firestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {Storage} from "@google-cloud/storage";
import {onCall} from "firebase-functions/v2/https";

initializeApp(); // we don't need to pass credentials because
// it will be uploaded to our firebase project under our account.
// Locally we had already signed in with our account.

const firestore = new Firestore(); // the database
const storage = new Storage(); // new storage object

const rawVideoBucketName = "narmada-raw-videos";

const videoCollectionId = "videos";
const userCollectionId = "users";

export interface Video {
  id?: string,
  uid?: string,
  filename?: string,
  status?: "processing" | "processed",
  title?: string,
  description?: string,
  date?: string,
  thumbnail?: string
}

export interface User {
  displayName?: string,
  email?: string,
  photoURL?: string,
  uid?:string
}

// This funtion will be invoked by an event. The event
// is creating a new user in firebase auth we will pass
// a callback function
export const createUser = functions.auth.user().onCreate((user) => {
  const userInfo = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };

  firestore.collection("users").doc(user.uid).set(userInfo);
  // writes to collection "users" a document with id "user.id".
  // The field written is userInfo. Will create collections and doc
  // if they don't exist.

  logger.info(`User Created: ${JSON.stringify(userInfo)}`);
  // console log an 'info' message

  return;
});

export const generateUploadUrl = onCall({maxInstances: 1}, async (request) => {
  // check if user is authenticated
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The function must be called while authenticated."
    );
  }

  const auth = request.auth;
  const data = request.data;
  const bucket = storage.bucket(rawVideoBucketName);

  // add semicolon
  const fileName = `${auth.uid}-${Date.now()}-${data.name}.${data.extension}`;
  // const fileName = `${auth.uid}-${Date.now()}.${data.fileExtension}`;

  // Get a v4 signed URL for uploading file
  const [url] = await bucket.file(fileName).getSignedUrl({
    version: "v4",
    action: "write", // cuz we want to upload the file
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes until the url expires
  });

  return {url, fileName};
});

export const getVideos = onCall({maxInstances: 1}, async () => {
  const snapshot = await firestore.collection(videoCollectionId)
    .limit(10).get();
  return snapshot.docs.map((doc) => doc.data());
});

export const getVideoUploader = onCall({maxInstances: 1}, async (request) => {
  const videoId = request.data.videoId;
  const snapshotVideo = await firestore.collection(videoCollectionId)
    .doc(videoId).get();

  const video = snapshotVideo.data() as Video;
  const uid = video.uid;
  // could've obtained uid via splitting videoId
  const snapshotUser = await firestore.collection(userCollectionId)
    .doc(uid as string) .get();

  return snapshotUser.data() as User;
});