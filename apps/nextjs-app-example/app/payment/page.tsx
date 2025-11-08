/**
 * Payment/Sequences Page - Phase 8.5 Response Sequences Demo
 *
 * Demonstrates Scenarist's response sequences feature (Phase 2):
 * 1. GitHub Polling (repeat: 'last') - Polls until complete, stays at final response
 * 2. Weather Cycle (repeat: 'cycle') - Cycles through states infinitely
 * 3. Payment Limited (repeat: 'none') - Falls through after exhaustion (rate limiting)
 *
 * Client Component - Requires state and effects for API calls.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

type JobStatus = {
  readonly jobId: string;
  readonly status: string;
  readonly progress: number;
};

type WeatherStatus = {
  readonly city: string;
  readonly conditions: string;
  readonly temp: number;
};

type PaymentResult = {
  readonly id: string;
  readonly status: string;
};

type PaymentError = {
  readonly error: {
    readonly message: string;
  };
};

export default function PaymentPage() {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [weatherStatus, setWeatherStatus] = useState<WeatherStatus | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [paymentError, setPaymentError] = useState<PaymentError | null>(null);
  const [isCheckingJob, setIsCheckingJob] = useState(false);
  const [isCheckingWeather, setIsCheckingWeather] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const handleCheckJobStatus = async () => {
    setIsCheckingJob(true);
    try {
      const response = await fetch('/api/payment/github-job', {
        method: 'GET',
      });
      const data: JobStatus = await response.json();
      setJobStatus(data);
    } finally {
      setIsCheckingJob(false);
    }
  };

  const handleGetWeather = async () => {
    setIsCheckingWeather(true);
    try {
      const response = await fetch('/api/payment/weather', {
        method: 'GET',
      });
      const data: WeatherStatus = await response.json();
      setWeatherStatus(data);
    } finally {
      setIsCheckingWeather(false);
    }
  };

  const handleSubmitPayment = async () => {
    setIsSubmittingPayment(true);
    setPaymentError(null);
    try {
      const response = await fetch('/api/payment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 100 }),
      });

      if (!response.ok) {
        const errorData: PaymentError = await response.json();
        setPaymentError(errorData);
        setPaymentResult(null);
      } else {
        const data: PaymentResult = await response.json();
        setPaymentResult(data);
        setPaymentError(null);
      }
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Response Sequences Demo</h1>

        <nav aria-label="Main navigation" className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 underline">
            Back to Products
          </Link>
        </nav>

        <div className="grid grid-cols-1 gap-8">
          {/* GitHub Job Polling (repeat: 'last') */}
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">1. GitHub Job Polling (repeat: 'last')</h2>
            <p className="text-gray-600 mb-6">
              Demonstrates polling pattern. Sequence progresses through pending → processing → complete,
              then repeats the last response indefinitely.
            </p>

            <button
              onClick={handleCheckJobStatus}
              disabled={isCheckingJob}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded transition-colors mb-6"
            >
              {isCheckingJob ? 'Checking...' : 'Check Job Status'}
            </button>

            {jobStatus && (
              <div
                role="status"
                aria-live="polite"
                className="bg-blue-50 border border-blue-200 p-4 rounded-lg"
              >
                <p className="mb-2">
                  <span className="font-semibold">Job ID:</span> {jobStatus.jobId}
                </p>
                <p className="mb-2">
                  <span className="font-semibold">Status:</span>{' '}
                  <span className={jobStatus.status === 'complete' ? 'text-green-600' : 'text-blue-600'}>
                    {jobStatus.status}
                  </span>
                </p>
                <div className="mb-2">
                  <span className="font-semibold">Progress:</span> {jobStatus.progress}%
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={jobStatus.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="w-full bg-gray-200 rounded-full h-2.5 mt-2"
                >
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${jobStatus.progress}%` }}
                  />
                </div>
              </div>
            )}
          </section>

          {/* Weather Cycle (repeat: 'cycle') */}
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">2. Weather Cycle (repeat: 'cycle')</h2>
            <p className="text-gray-600 mb-6">
              Demonstrates cycling pattern. Sequence cycles through Sunny → Cloudy → Rainy,
              then loops back to the start infinitely.
            </p>

            <button
              onClick={handleGetWeather}
              disabled={isCheckingWeather}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded transition-colors mb-6"
            >
              {isCheckingWeather ? 'Checking...' : 'Get Weather'}
            </button>

            {weatherStatus && (
              <div
                role="status"
                aria-live="polite"
                className="bg-green-50 border border-green-200 p-4 rounded-lg"
              >
                <p className="mb-2">
                  <span className="font-semibold">City:</span> {weatherStatus.city}
                </p>
                <p className="mb-2">
                  <span className="font-semibold">Conditions:</span>{' '}
                  <span className="text-green-700">{weatherStatus.conditions}</span>
                </p>
                <p>
                  <span className="font-semibold">Temperature:</span> {weatherStatus.temp}°C
                </p>
              </div>
            )}
          </section>

          {/* Payment Limited (repeat: 'none') */}
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">3. Payment Limited (repeat: 'none')</h2>
            <p className="text-gray-600 mb-6">
              Demonstrates rate limiting. Allows 3 payment attempts, then falls through to
              rate limit error. Sequence exhausts and never repeats.
            </p>

            <button
              onClick={handleSubmitPayment}
              disabled={isSubmittingPayment}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded transition-colors mb-6"
            >
              {isSubmittingPayment ? 'Submitting...' : 'Submit Payment'}
            </button>

            {paymentResult && (
              <div
                role="status"
                aria-live="polite"
                className="bg-purple-50 border border-purple-200 p-4 rounded-lg"
              >
                <p className="mb-2">
                  <span className="font-semibold">Payment ID:</span> {paymentResult.id}
                </p>
                <p>
                  <span className="font-semibold">Status:</span>{' '}
                  <span className={paymentResult.status === 'succeeded' ? 'text-green-600' : 'text-purple-600'}>
                    {paymentResult.status}
                  </span>
                </p>
              </div>
            )}

            {paymentError && (
              <div role="alert" className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="text-red-700 font-semibold mb-2">Payment Failed</p>
                <p className="text-red-600">{paymentError.error.message}</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
