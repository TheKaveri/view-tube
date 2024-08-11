import {httpsCallable} from "firebase/functions";
import {functions} from "./firebase";


const generateUploadUrlFunction = httpsCallable(functions, 'generateUploadUrl');
// httpsCallable() acts as a wrapper around the functions. It makes things
// easier to call since we don't have to specify any endpoint URL.
// It knows this because of how we initialized firebase.ts

const getVideosFunction = httpsCallable(functions, 'getVideos');

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

export async function uploadVideo(file: File) {
    // figure out file extension
    const response: any = await generateUploadUrlFunction({
        extension: file.name.split(".").pop(),
        name: file.name.split(".")[0].slice(0, 100)
        // fileExtension: file.name.split('.').pop()
    });

    // Upload file via a signed URL
    // The Fetch API interface allows you to make HTTP requests to web servers.
    const uploadResult = await fetch(response?.data?.url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });
    
    return uploadResult;
}

export async function getVideos() {
    const response = await getVideosFunction();
    return response.data as Video[];
}