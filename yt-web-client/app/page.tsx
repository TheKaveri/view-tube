// runs server side

import styles from './page.module.css';
import { getVideos } from './firebase/functions';

import Image from 'next/image';
import Link from 'next/link';
import { Fragment } from 'react';

export default async function Home() {
  const videoPrefix = 'https://storage.googleapis.com/narmada-processed-videos/';
  const videos = await getVideos();

  return (
    <Fragment>
      <main className={styles.container}>
        {videos.map((video) => ( // map returns a list of jsx elements
          <Link href={`/watch?v=${video.filename}`} key={video.id} className={styles.videoLink}>
            <Image 
              src={video.thumbnail ? videoPrefix + video.thumbnail : '/thumbnail.png'} 
              alt='video' 
              width={300} 
              height={200}
              className={styles.thumbnail}
            />
            <div className={styles.title}>{video.title}</div>
          </Link>
        ))}
      </main>
    </Fragment>
  );
}


// disable caching on this page:
export const revalidate = 3; // re-render this page every 3 seconds (can do 30 seconds too)