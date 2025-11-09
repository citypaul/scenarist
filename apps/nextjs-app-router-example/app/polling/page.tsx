/**
 * Polling Page - React Server Component with Sequences
 *
 * This demonstrates testing sequences with RSC:
 * - Async server component that polls a job status endpoint
 * - Scenarist sequences return different responses on each request
 * - Demonstrates repeat: 'last' (final state persists)
 * - Proves sequences work with server-side rendering
 *
 * Sequence progression: pending → processing → complete → complete (repeat)
 *
 * Traditional approach: ❌ Jest doesn't support RSC
 * Scenarist approach: ✅ Playwright + sequences + RSC = works perfectly
 */

import { scenarist } from '@/lib/scenarist';
import { headers } from 'next/headers';

type JobStatus = {
  readonly jobId: string;
  readonly status: 'pending' | 'processing' | 'complete';
  readonly progress: number;
};

async function fetchJobStatus(jobId: string): Promise<JobStatus> {
  // Create a mock Request object from the incoming headers
  // This allows us to use scenarist.getHeaders() method
  const headersList = await headers();
  const mockRequest = new Request('http://localhost:3002', {
    headers: headersList,
  });

  const response = await fetch(`http://localhost:3002/api/github/jobs/${jobId}`, {
    headers: {
      ...scenarist.getHeaders(mockRequest),
    },
    cache: 'no-store', // Disable Next.js caching for demo
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch job status: ${response.statusText}`);
  }

  return response.json();
}

type PollingPageProps = {
  searchParams: Promise<{ jobId?: string }>;
};

/**
 * React Server Component
 *
 * This is an ASYNC component that runs ONLY on the server.
 * Jest cannot test this with sequences - throws: "Objects are not valid as a React child"
 * Scenarist + Playwright CAN test this - sequences advance on each server render!
 */
export default async function PollingPage({ searchParams }: PollingPageProps) {
  const { jobId = '123' } = await searchParams;
  const job = await fetchJobStatus(jobId);

  const getStatusColor = (status: JobStatus['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'complete':
        return 'bg-green-100 text-green-800';
    }
  };

  const getProgressBarColor = (status: JobStatus['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'processing':
        return 'bg-blue-500';
      case 'complete':
        return 'bg-green-500';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Job Polling (React Server Component)
        </h1>
        <p className="text-gray-600 mb-4">
          This page demonstrates testing sequences with Scenarist and RSC.
          Each server render advances the sequence: pending → processing → complete.
        </p>
        <p className="text-sm text-gray-500">
          <strong>Job ID:</strong> {jobId}
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Job Status</h2>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}
            >
              {job.status.toUpperCase()}
            </span>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{job.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all ${getProgressBarColor(job.status)}`}
                style={{ width: `${job.progress}%` }}
              />
            </div>
          </div>

          <div className="text-sm text-gray-600">
            {job.status === 'pending' && (
              <p>Job is queued and waiting to start...</p>
            )}
            {job.status === 'processing' && (
              <p>Job is currently being processed...</p>
            )}
            {job.status === 'complete' && (
              <p className="text-green-700 font-medium">Job completed successfully!</p>
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Testing Sequences with RSC</h3>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Sequence Pattern:</strong> Each page refresh advances the sequence
            </p>
            <p>
              <strong>Repeat Mode:</strong> 'last' - Final state (complete) persists
            </p>
            <p className="text-xs text-gray-600 mt-2">
              This proves Scenarist sequences work with Server Components!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
