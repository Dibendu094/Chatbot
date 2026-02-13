import { Suspense } from 'react';
import VoiceContent from '@/components/VoiceContent';

// Force dynamic rendering to bypass static analysis that fails on useSearchParams
export const dynamic = 'force-dynamic';

const VoicePage = () => {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
                <p>Loading Voice Mode...</p>
            </div>
        }>
            <VoiceContent />
        </Suspense>
    );
};

export default VoicePage;
