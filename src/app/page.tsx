// /app/page.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginPage from './components/LoginPage';

const Home = ({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) => {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // User is authenticated, redirect to /main
      router.push('/main');
    }
  }, [router]);

  return <LoginPage searchParams={searchParams} />;
};

export default Home;