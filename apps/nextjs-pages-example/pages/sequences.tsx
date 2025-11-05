import { useState } from "react";
import Head from "next/head";
import Link from "next/link";

type JobData = {
  jobId: string;
  status: string;
  progress: number;
};

type WeatherData = {
  city: string;
  conditions: string;
  temp: number;
};

type PaymentData = {
  id: string;
  status: string;
};

export default function SequencesDemo() {
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [callCounts, setCallCounts] = useState({
    job: 0,
    weather: 0,
    payment: 0,
  });

  const checkJobStatus = async () => {
    const res = await fetch("/api/github/jobs/123");
    const data = await res.json();
    setJobData(data);
    setCallCounts((prev) => ({ ...prev, job: prev.job + 1 }));
  };

  const getWeather = async () => {
    const res = await fetch("/api/weather/london");
    const data = await res.json();
    setWeatherData(data);
    setCallCounts((prev) => ({ ...prev, weather: prev.weather + 1 }));
  };

  const submitPayment = async () => {
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 100 }),
    });

    if (res.ok) {
      const data = await res.json();
      setPaymentData(data);
      setPaymentError(null);
    } else {
      const error = await res.json();
      setPaymentError(error.error?.message || "Payment failed");
      setPaymentData(null);
    }
    setCallCounts((prev) => ({ ...prev, payment: prev.payment + 1 }));
  };

  return (
    <>
      <Head>
        <title>Response Sequences Demo - Scenarist</title>
      </Head>

      <main className="container mx-auto p-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-4">Response Sequences Demo</h1>

        <nav aria-label="Main navigation" className="mb-4">
          <ul className="flex gap-4">
            <li>
              <Link href="/" className="text-blue-600 hover:text-blue-700 underline">
                Products
              </Link>
            </li>
            <li>
              <Link href="/cart" className="text-blue-600 hover:text-blue-700 underline">
                Shopping Cart
              </Link>
            </li>
            <li>
              <span className="text-blue-600 font-semibold">Sequences Demo</span>
            </li>
          </ul>
        </nav>

        <p className="mb-8 text-gray-600">
          Demonstrates Phase 2 core feature: sequences with different repeat
          modes
        </p>

        {/* Section 1: Job Polling (repeat: 'last') */}
        <section
          className="mb-12 border rounded-lg p-6 bg-white shadow-sm"
          aria-labelledby="job-polling-heading"
        >
          <h2 id="job-polling-heading" className="text-2xl font-semibold mb-2">
            GitHub Job Polling
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Repeat mode:{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">last</code> - Final
            state repeats infinitely
          </p>

          <button
            onClick={checkJobStatus}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Check Job Status
          </button>

          {jobData && (
            <div
              className="mt-4 bg-gray-50 p-4 rounded border border-gray-200"
              role="status"
              aria-live="polite"
            >
              <dl className="space-y-2">
                <div>
                  <dt className="font-semibold inline">Job ID:</dt>{" "}
                  <dd className="inline ml-2">{jobData.jobId}</dd>
                </div>
                <div>
                  <dt className="font-semibold inline">Status:</dt>{" "}
                  <dd className="inline ml-2 capitalize">{jobData.status}</dd>
                </div>
                <div>
                  <dt className="font-semibold inline">Progress:</dt>{" "}
                  <dd className="inline ml-2">{jobData.progress}%</dd>
                </div>
              </dl>

              <div
                className="mt-3 bg-gray-200 rounded-full h-2"
                role="progressbar"
                aria-valuenow={jobData.progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${jobData.progress}%` }}
                />
              </div>

              <p className="text-sm text-gray-600 mt-3">
                Calls made: {callCounts.job}
              </p>
            </div>
          )}
        </section>

        {/* Section 2: Weather Cycle (repeat: 'cycle') */}
        <section
          className="mb-12 border rounded-lg p-6 bg-white shadow-sm"
          aria-labelledby="weather-heading"
        >
          <h2 id="weather-heading" className="text-2xl font-semibold mb-2">
            Weather Cycle
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Repeat mode:{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">cycle</code> -
            Loops back to first response
          </p>

          <button
            onClick={getWeather}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            Get Weather
          </button>

          {weatherData && (
            <div
              className="mt-4 bg-gray-50 p-4 rounded border border-gray-200"
              role="status"
              aria-live="polite"
            >
              <dl className="space-y-2">
                <div>
                  <dt className="font-semibold inline">City:</dt>{" "}
                  <dd className="inline ml-2">{weatherData.city}</dd>
                </div>
                <div>
                  <dt className="font-semibold inline">Conditions:</dt>{" "}
                  <dd className="inline ml-2">{weatherData.conditions}</dd>
                </div>
                <div>
                  <dt className="font-semibold inline">Temperature:</dt>{" "}
                  <dd className="inline ml-2">{weatherData.temp}°C</dd>
                </div>
              </dl>

              <p className="text-sm text-gray-600 mt-3">
                Calls made: {callCounts.weather}
              </p>
            </div>
          )}
        </section>

        {/* Section 3: Payment Attempts (repeat: 'none') */}
        <section
          className="mb-12 border rounded-lg p-6 bg-white shadow-sm"
          aria-labelledby="payment-heading"
        >
          <h2 id="payment-heading" className="text-2xl font-semibold mb-2">
            Payment Rate Limiting
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Repeat mode:{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">none</code> -
            Exhausts then falls back to error
          </p>

          <button
            onClick={submitPayment}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
          >
            Submit Payment
          </button>

          {paymentData && (
            <div
              className="mt-4 bg-green-50 p-4 rounded border border-green-200"
              role="status"
              aria-live="polite"
            >
              <dl className="space-y-2">
                <div>
                  <dt className="font-semibold inline">Payment ID:</dt>{" "}
                  <dd className="inline ml-2">{paymentData.id}</dd>
                </div>
                <div>
                  <dt className="font-semibold inline">Status:</dt>{" "}
                  <dd className="inline ml-2 capitalize">
                    {paymentData.status}
                  </dd>
                </div>
              </dl>

              <p className="text-sm text-gray-600 mt-3">
                Attempts made: {callCounts.payment}
              </p>
            </div>
          )}

          {paymentError && (
            <div
              className="mt-4 bg-red-50 p-4 rounded border border-red-200"
              role="alert"
            >
              <p className="font-semibold text-red-800">Payment Failed</p>
              <p className="text-red-700">{paymentError}</p>
              <p className="text-sm text-gray-600 mt-2">
                Attempts made: {callCounts.payment}
              </p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
