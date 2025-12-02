/**
 * Loan Application Page - State-Aware Mocking Demo (ADR-0019)
 *
 * Demonstrates stateResponse + afterResponse.setState:
 * 1. GET /api/loan/status returns state-dependent responses
 * 2. POST /api/loan/submit advances workflow state via afterResponse.setState
 * 3. POST /api/loan/review advances workflow state via afterResponse.setState
 *
 * Flow:
 * - Initial: status returns "pending" (no state)
 * - After submit: status returns "reviewing" (state.step = "submitted")
 * - After review: status returns "approved" (state.step = "reviewed")
 *
 * Client Component - Requires state and effects for workflow handling.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type LoanStatus = {
  readonly status: "pending" | "reviewing" | "approved";
  readonly message: string;
};

export default function LoanApplicationPage() {
  const [loanStatus, setLoanStatus] = useState<LoanStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
  } | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/loan/status");
      const data = await response.json();
      setLoanStatus(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleSubmitApplication = async () => {
    setIsSubmitting(true);
    setSubmitResult(null);
    try {
      const response = await fetch("/api/loan/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 10000 }),
      });
      const data = await response.json();
      setSubmitResult(data);
      // Refresh status after submission
      await fetchStatus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteReview = async () => {
    setIsReviewing(true);
    try {
      await fetch("/api/loan/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      // Refresh status after review
      await fetchStatus();
    } finally {
      setIsReviewing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "reviewing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Loan Application
        </h1>

        <nav aria-label="Main navigation" className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Back to Home
          </Link>
        </nav>

        {/* Feature Explanation */}
        <section
          aria-label="What this demo tests"
          className="mb-8 bg-blue-50 border border-blue-200 p-6 rounded-lg"
        >
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            State-Aware Mocking Demo (ADR-0019)
          </h2>
          <p className="text-blue-800 text-sm mb-3">
            This page demonstrates <strong>stateResponse</strong> and{" "}
            <strong>afterResponse.setState</strong> - two features that enable
            state machine patterns in mocks.
          </p>
          <ul className="text-blue-700 text-sm list-disc list-inside space-y-1">
            <li>
              <code className="bg-blue-100 px-1 rounded">
                GET /api/loan/status
              </code>{" "}
              returns different responses based on current state
            </li>
            <li>
              <code className="bg-blue-100 px-1 rounded">
                POST /api/loan/submit
              </code>{" "}
              sets state to &quot;submitted&quot; via afterResponse.setState
            </li>
            <li>
              <code className="bg-blue-100 px-1 rounded">
                POST /api/loan/review
              </code>{" "}
              sets state to &quot;reviewed&quot; via afterResponse.setState
            </li>
          </ul>
        </section>

        {/* Current Status Display */}
        <section
          aria-label="Application status"
          className="mb-8 bg-white p-6 rounded-lg shadow"
        >
          <h2 className="text-2xl font-semibold mb-4">Application Status</h2>

          {isLoading ? (
            <p className="text-gray-500">Loading status...</p>
          ) : loanStatus ? (
            <div>
              <div
                role="status"
                aria-live="polite"
                className={`inline-block px-4 py-2 rounded-full border ${getStatusColor(loanStatus.status)} mb-4`}
              >
                <span className="font-semibold capitalize">
                  {loanStatus.status}
                </span>
              </div>
              <p className="text-gray-600" data-testid="status-message">
                {loanStatus.message}
              </p>
            </div>
          ) : (
            <p className="text-red-500">Failed to load status</p>
          )}
        </section>

        {/* Submit Application */}
        {loanStatus?.status === "pending" && (
          <section
            aria-label="Submit application"
            className="mb-8 bg-white p-6 rounded-lg shadow"
          >
            <h2 className="text-2xl font-semibold mb-4">Submit Application</h2>
            <p className="text-gray-600 mb-4">
              Ready to submit your loan application for £10,000?
            </p>
            <button
              onClick={handleSubmitApplication}
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded transition-colors"
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </button>
            {submitResult?.success && (
              <p role="alert" className="mt-4 text-green-600 font-medium">
                Application submitted successfully!
              </p>
            )}
          </section>
        )}

        {/* Review Section (shown when status is "reviewing") */}
        {loanStatus?.status === "reviewing" && (
          <section
            aria-label="Complete review"
            className="mb-8 bg-white p-6 rounded-lg shadow"
          >
            <h2 className="text-2xl font-semibold mb-4">Complete Review</h2>
            <p className="text-gray-600 mb-4">
              Your application is under review. Click below to complete the
              review process.
            </p>
            <button
              onClick={handleCompleteReview}
              disabled={isReviewing}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded transition-colors"
            >
              {isReviewing ? "Processing..." : "Complete Review"}
            </button>
          </section>
        )}

        {/* Approved Section */}
        {loanStatus?.status === "approved" && (
          <section
            aria-label="Application approved"
            className="mb-8 bg-green-50 border border-green-200 p-6 rounded-lg"
          >
            <h2 className="text-2xl font-bold text-green-800 mb-4">
              Congratulations!
            </h2>
            <p className="text-green-700">
              Your loan application has been approved. We will be in touch
              shortly with next steps.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
