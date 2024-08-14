// default keyword allows the function to be imported easily.
"use client";

import { useSearchParams } from 'next/navigation' // to grab the query params from the URL
import { Suspense } from 'react';
import styles from './page.module.css';
import { getVideoUploader } from '../firebase/functions';

import { useState, useEffect } from 'react';

export interface User {
    displayName?: string;
    email?: string;
    photoURL?: string;
    uid?:string;
}

function WatchPage() {
    const videoPrefix = 'https://storage.googleapis.com/narmada-processed-videos/';
    const videoSrc = useSearchParams().get('v');

    const [uploader, setUploader] = useState<User|null>(null);

    let res = videoSrc?.split(".")[0]
    res = res?.split("processed-")[1]

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
        <div>
            {/* <h1>Watch Page</h1> */}
            <video controls src={videoPrefix + videoSrc} className={styles.video}/>
            {uploader && (
                <div>
                    <h2>Uploader Information</h2>
                    <p>{JSON.stringify(uploader)}</p>
                </div>
            )}
         </div>
    );
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
