// Codeforces handle verification page
'use client';

import { useState } from 'react';
import { BackgroundGradient } from '@/components/ui/background-gradient';
import { AlertCircle, AlertTriangle, CheckCircle, ChevronDown, ExternalLink, Loader2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LoaderOne from '@/components/ui/loader-one';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Link from 'next/link';
import { useApiClient } from '@/lib/api-client';
import { API_CONFIG } from '@/lib/api-config';

export default function VerifyPage() {
  const [handle, setHandle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const apiClient = useApiClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!handle.trim()) {
      toast.error('Please enter a Codeforces handle');
      return;
    }

    setIsLoading(true);
    setVerificationStatus('verifying');
    setError(null);

    try {
      // First, check if the handle exists on Codeforces
      const cfCheck = await fetch(`https://codeforces.com/api/user.info?handles=${handle.trim()}`);
      
      let cfData;
      try {
        cfData = await cfCheck.json();
      } catch (jsonError) {
        // If JSON parsing fails, it might be a rate limit or other error
        const textResponse = await cfCheck.text();
        console.error('Codeforces API returned non-JSON response:', textResponse);
        throw new Error('Codeforces API is temporarily unavailable. Please try again later.');
      }
      
      if (cfData.status === 'FAILED') {
        throw new Error('Codeforces handle not found');
      }

      // Use the Next.js API route which will proxy to our verification service
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ handle: handle.trim() }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse verify response:', jsonError);
        throw new Error('Server returned invalid response');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // Handle both boolean and string 'true'/'false' responses
      const isSuccessful = data.success === true || data.success === 'true';
      if (!isSuccessful) {
        throw new Error(data.message || 'Verification failed. Please make sure to submit a compilation error to problem 1000A.');
      }

      setVerificationStatus('success');
      toast.success('Codeforces handle verified successfully!');
      
      // Save user to database with rating
      const createUserResponse = await apiClient.post(API_CONFIG.ENDPOINTS.USER.CREATE, {
        codeforcesHandle: handle.trim(),
        rating: data.rating || null
      });

      if (!createUserResponse.ok) {
        const errorData = await createUserResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to create user:', errorData);
        throw new Error('Failed to save user profile: ' + (errorData.error || 'Unknown error'));
      }
      
      // Redirect to dashboard immediately after user is created
      window.location.href = '/dashboard';
    } catch (error: unknown) {
      console.error('Verification error:', error);
      setVerificationStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify handle';
      setError(errorMessage);
      
      if (errorMessage === 'Codeforces handle not found') {
        toast.error('Codeforces handle not found. Please check the spelling.');
      } else if (errorMessage.toLowerCase().includes('compilation') || errorMessage.includes('1000A')) {
        toast.error(
          <div>
            <p>Verification requires a compilation error on problem 1000A.</p>
            <p>1. <a href="https://codeforces.com/problemset/problem/1000/A" target="_blank" rel="noopener noreferrer" className="underline">Open problem 1000A</a></p>
            <p>2. Submit any code with a compilation error</p>
            <p>3. Try verifying again</p>
          </div>,
          { duration: 10000 }
        );
      } else {
        toast.error(`Verification failed: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenProblem = () => {
    window.open('https://codeforces.com/problemset/problem/1000/A', '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-cover bg-center"
         style={{ backgroundImage: "url('/cf_verify_bg.jpg')" }}>
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/80" />
      
      {/* Simplified gradient accents */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-2xl" />
        <div className="absolute bottom-1/3 right-1/4 w-56 h-56 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-2xl" />
      </div>
      
      <div className="relative z-10 w-full max-w-sm">
        <div className="relative overflow-hidden rounded-xl border border-white/10 backdrop-blur-xl bg-white/5 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/2" />
          
          <div className="relative z-10 p-5 sm:p-6">
            <div className="text-center mb-4">
              {verificationStatus === 'success' ? (
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 backdrop-blur-sm mb-4 border border-white/10">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              ) : verificationStatus === 'error' ? (
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 backdrop-blur-sm mb-4 border border-white/10">
                  <XCircle className="w-8 h-8 text-red-400" />
                </div>
              ) : (
                <div className="flex flex-col items-center -mb-2">
                  <div className="relative flex items-center justify-center px-12">
                    <img 
                      src="/logo.png" 
                      alt="Logo" 
                      className="w-36 h-36 object-contain z-10 transition-all duration-300 hover:scale-105 -ml-4" 
                    />
                    
                    <div className="mx-5 -ml-4">
                      <LoaderOne />
                    </div>
                    
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-0 group-hover:opacity-30 blur transition duration-300" />
                      <div className="relative w-17 h-17 flex items-center justify-center">
                        <img 
                          src="/code-forces-logo.svg" 
                          alt="Codeforces" 
                          className="w-full h-full object-contain z-10 transition-transform duration-300 group-hover:scale-110" 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <style jsx global>{`
                    @keyframes orbit {
                      0% { 
                        left: 0;
                        transform: translateY(-50%) scale(1);
                        opacity: 1;
                      }
                      50% { 
                        left: 100%;
                        transform: translateY(-50%) scale(1.2);
                        opacity: 0.8;
                      }
                      51% { 
                        left: 100%;
                        transform: translateY(-50%) scale(0.8);
                        opacity: 0.6;
                      }
                      100% { 
                        left: 0;
                        transform: translateY(-50%) scale(1);
                        opacity: 1;
                      }
                    }
                  `}</style>
                </div>
              )}
              <h1 className="text-2xl font-bold text-white -mt-3">
                {verificationStatus === 'success' 
                  ? 'Verified!'
                  : 'Verify Handle'}
              </h1>
              <p className="text-xs text-gray-300/90">
                {verificationStatus === 'success' 
                  ? 'Successfully connected'
                  : 'Connect & Verify your Codeforces handle'}
              </p>
            </div>

            {verificationStatus === 'success' ? (
              <div className="text-center">
                <p className="text-green-400 mb-6">Redirecting to dashboard...</p>
              </div>
            ) : (
              <>
                <div className="mb-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 mr-1.5 flex-shrink-0" />
                    <p className="text-[11px] leading-tight text-red-200">
                      Submit a compilation error to{' '}
                      <button 
                        onClick={handleOpenProblem}
                        className="text-red-300 hover:text-white font-medium underline inline-flex items-center"
                      >
                        Problem 1000A <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                      </button>
                    </p>
                  </div>
                </div>

                <div className="flex justify-center mb-3">
                  <button 
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center focus:outline-none focus:ring-0 focus:ring-offset-0"
                  >
                    {showInstructions ? 'Hide instructions' : 'How to verify?'}
                    <motion.span
                      animate={{ rotate: showInstructions ? 180 : 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className="ml-1 will-change-transform"
                    >
                      <ChevronDown className="w-2.5 h-2.5" />
                    </motion.span>
                  </button>
                </div>

                <AnimatePresence>
                  {showInstructions && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ 
                        opacity: 1, 
                        height: 'auto',
                        transition: { 
                          opacity: { duration: 0.2 },
                          height: { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
                        }
                      }}
                      exit={{ 
                        opacity: 0, 
                        height: 0,
                        transition: { 
                          opacity: { duration: 0.15 },
                          height: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
                        }
                      }}
                      className="overflow-hidden will-change-[height,opacity]"
                    >
                      <div className="p-2.5 bg-white/5 border border-white/10 rounded-lg text-[11px] text-gray-300">
                        <p className="font-medium text-white/90 mb-1.5">Verification Steps:</p>
                        <motion.ol 
                          className="space-y-1.5"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ 
                            opacity: 1, 
                            y: 0,
                            transition: { 
                              duration: 0.2,
                              when: "beforeChildren",
                              staggerChildren: 0.05
                            }
                          }}
                          exit={{ opacity: 0, y: -5 }}
                        >
                          <motion.li 
                            className="flex items-start"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                          >
                            <span className="inline-flex items-center justify-center w-4 h-4 bg-white/10 rounded-full text-[10px] font-medium mr-2 mt-0.5 flex-shrink-0">1</span>
                            Open <a href="https://codeforces.com/problemset/problem/1000/A" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline ml-1">Problem 1000A</a>
                          </motion.li>
                          <motion.li 
                            className="flex items-start"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                          >
                            <span className="inline-flex items-center justify-center w-4 h-4 bg-white/10 rounded-full text-[10px] font-medium mr-2 mt-0.5 flex-shrink-0">2</span>
                            Submit any code with a compilation error
                          </motion.li>
                          <motion.li 
                            className="flex items-start"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                          >
                            <span className="inline-flex items-center justify-center w-4 h-4 bg-white/10 rounded-full text-[10px] font-medium mr-2 mt-0.5 flex-shrink-0">3</span>
                            Enter your handle below and verify
                          </motion.li>
                        </motion.ol>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <div className="relative">
                      <Input
                        id="handle"
                        type="text"
                        value={handle}
                        onChange={(e) => setHandle(e.target.value)}
                        placeholder="Enter Codeforces handle"
                        className="w-full px-3 py-2 text-sm bg-white/5 border border-white/15 text-white placeholder-gray-400/70 rounded-lg focus:ring-1 focus:ring-white/20 focus:border-transparent transition-all duration-200 h-9"
                        disabled={isLoading}
                      />
                      {isLoading && (
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-3.5 h-3.5 text-white/60 animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !handle.trim()}
                    className={`w-full py-2 text-sm font-medium rounded-lg transition-all duration-200 relative overflow-hidden group ${
                      isLoading || !handle.trim()
                        ? 'bg-white/5 text-white/40 cursor-not-allowed border border-white/5'
                        : 'bg-gradient-to-r from-blue-500/90 to-cyan-400/90 hover:from-blue-600/90 hover:to-cyan-500/90 text-white shadow-md hover:shadow-blue-500/10 active:scale-95 border border-white/10'
                    }`}
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      {isLoading ? 'Verifying...' : 'Verify Handle'}
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-x-full group-hover:translate-x-full" />
                  </button>
                </form>
              </>
            )}

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-xs text-gray-400 text-center">
                By verifying, you agree to our{' '}
                <Link href="/terms" className="text-blue-400 hover:underline">Terms</Link> and{' '}
                <Link href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}