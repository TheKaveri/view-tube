"use client"; // makes this a client component

import Image from "next/image"; // React element for images. Not native HTML image tag.
import Link from "next/link"; // React element for links. Not native HTML anchor tag.
import styles from "./navbar.module.css";
import SignIn from "./sign-in";

import { onAuthStateChangeHelper } from "../firebase/firebase";
import { useEffect, useState } from "react";

import { User } from "firebase/auth";
import Upload from "./upload";

// apply the CSS class via className

export default function Navbar() {
    // Init the user state
    const [user, setUser] = useState<User | null>(null);

    // useEffect executes the callback function whenever the authentication state changes.
    useEffect(() => {
        // onAuthStateChanged function is designed to automatically know and provide
        // the current user information whenever the authentication state changes.
        const unsubscribe = onAuthStateChangeHelper((user) => {
            setUser(user);            
        });

        // cleanup function on unmount
        return () => unsubscribe();
    });

    return (
        <nav className={styles.nav}>
            <Link href="/" className={styles.title}>
            {/* <Image src="/youtube-logo.svg" alt="Youtube Logo" width={90} height={20} /> */}
            <h1 className={styles.title}>🎥ViewTube: A Fullstack Video Sharing App</h1>
            </Link>
            <div className={styles.container}>
            {
                user && <Upload /> // render only when user is not null
            }
            <SignIn user={user}/>
            </div>
        </nav>
    );
}