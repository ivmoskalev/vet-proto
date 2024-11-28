'use client';
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AudioRecorder from "../components/AudioRecorder";

const MainPage = () => {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push(`/?redirect=/main`);
        }
    }, [router]);

    return <AudioRecorder />;
};

export default MainPage;