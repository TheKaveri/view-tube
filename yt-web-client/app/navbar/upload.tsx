'use client';

import { Fragment } from "react";
import { uploadVideo } from "../firebase/functions";

import styles from "./upload.module.css";

export default function Upload() {
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.item(0);
      if (file) {
        handleUpload(file);
      }
    };  

    const handleUpload = async (file: File) => {
        try {
            const response = await uploadVideo(file);
            alert(`File uploaded. Response: ${JSON.stringify(response)}`);
        } catch (error) {
            alert(`Failed to upload video: ${error}`);
        }
    };

    return (
        <Fragment>
            <input id = "upload" className={styles.uploadInput} type="file" accept="video/*"
                onChange={handleFileChange}
            />
            <label htmlFor = "upload" className={styles.uploadButton}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
            </label>
        </Fragment>
    );
}