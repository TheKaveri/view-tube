// default keyword allows the function to be imported easily.
"use client";

import { useSearchParams } from 'next/navigation' // to grab the query params from the URL
import { Suspense } from 'react';
import styles from './page.module.css';


function WatchPage() {
    const videoPrefix = 'https://storage.googleapis.com/narmada-processed-videos/';
    const videoSrc = useSearchParams().get('v');

    return (
        <div>
            <h1>Watch Page</h1>
            <video controls src={videoPrefix + videoSrc} className={styles.video}/>
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
