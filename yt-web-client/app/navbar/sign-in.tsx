'use client';

import { Fragment } from "react"; 
import styles from "./sign-in.module.css"

import { signInWithGoogle, signOut } from "../firebase/firebase";

import { User } from "firebase/auth";

import Image from 'next/image';

interface SignInProps {
    user: User | null
}

export default function SignIn({user}: SignInProps) {
    return (
        <Fragment>
            { user ?
                (
                <div className={styles.container}>
                    <div className={styles.userInfo}>
                        <span className={styles.displayName}>{user.displayName}</span>
                        <span className={styles.email}>{user.email}</span>
                    </div>
                    <Image className={styles.userIcon} src={(user.photoURL)? user.photoURL : "./thumbnail.png"} alt="user icon" title={user.displayName || ""} width={40} height={40}/>
                    <button className={styles.signin} onClick={signOut}>
                    Sign Out
                    </button>
                </div>
                ) : (
                <button className={styles.signin} onClick={signInWithGoogle}>
                Sign In
                </button>
                )
            }
        </Fragment>
    )
}

export const revalidate = 30; 