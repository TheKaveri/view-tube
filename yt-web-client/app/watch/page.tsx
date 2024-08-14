// default keyword allows the function to be imported easily.
"use client";

import { useSearchParams } from 'next/navigation' // to grab the query params from the URL
import { Suspense } from 'react';
import styles from './page.module.css';
import { getVideoUploader } from '../firebase/functions';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export interface User {
    displayName?: string;
    email?: string;
    photoURL?: string;
    uid?:string;
}

function WatchPage() {
    const resourcePrefix = 'https://storage.googleapis.com/narmada-processed-videos/';
    const videoSrc = useSearchParams().get('v');

    const [uploader, setUploader] = useState<User|null>(null);

    let res = videoSrc?.split(".")[0]
    res = res?.split("processed-")[1]

    const thumbnailSrc = "thumbnail-" + res + ".png";
    const videoName = res?.split("-")[2];

    useEffect(() => {
        const fetchUploader = async () => {
            if (videoSrc) {
                const uploader = await getVideoUploader(res as string);
                setUploader(() => uploader);
            }
        };
        fetchUploader();
    }, [res]);

    return (
        <div className={styles.watchPageContainer}>
            <video controls src={resourcePrefix + videoSrc} className={styles.video} poster={resourcePrefix + thumbnailSrc}/>
            <h2>{videoName}</h2>
            {uploader && <Uploader uploader={uploader}/>}
         </div>
    );
}

function Uploader({uploader}: {uploader: User}) {
    return (
        <div className={styles.uploaderContainer}>
            <Image className={styles.uploaderIcon} src={(uploader.photoURL)? uploader.photoURL : "./thumbnail.png"} alt="user icon" title={uploader.displayName || ""} width={40} height={40}/>
            <div className={styles.uploaderInfo}>
                <span className={styles.displayName}>{uploader.displayName}</span>
                <span className={styles.email}>{uploader.email}</span>
            </div>
        </div>
    )   
}

export default function Watch() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <WatchPage />
        </Suspense>
    )
}

// must wrap useSearchParams in a Suspense component for avoiding deployment issues.

// export default function Watch() {
//   const videoPrefix = 'https://storage.googleapis.com/narmada-processed-videos/';
//   const videoSrc = useSearchParams().get('v');

//   return (
//     <div>
//       <h1>Watch Page</h1>
//       { <video controls src={videoPrefix + videoSrc}/> }
//     </div>
//   );
// }
