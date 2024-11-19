// /app/page.tsx
import dynamic from 'next/dynamic';

const AudioRecorder = dynamic(() => import('./components/AudioRecorder'), {
  ssr: false,
});

export default function Home() {
  return (
    <div>
      <h1>Speech Recognition App</h1>
      <AudioRecorder />
    </div>
  );
}
