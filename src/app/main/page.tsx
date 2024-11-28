'use client';
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AudioRecorder from "../components/AudioRecorder";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const MainPage = () => {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push(`${basePath}/?redirect=/main`);
        }
    }, [router]);

    return <AudioRecorder />;
};

export default MainPage;