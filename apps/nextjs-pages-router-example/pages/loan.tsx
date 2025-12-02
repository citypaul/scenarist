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
 */

import { useState, useEffect, useCallback } from "react";
import type { GetServerSideProps } from "next";

type LoanStatus = {
  status: "pending" | "reviewing" | "approved";
  message: string;
};

export default function LoanApplicationPage() {
  const [loanStatus, setLoanStatus] = useState<LoanStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean } | null>(
    null,
  );

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
      await fetchStatus();
    } finally {
      setIsReviewing(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "pending":
        return {
          backgroundColor: "#fef3c7",
          color: "#92400e",
          border: "1px solid #fcd34d",
        };
      case "reviewing":
        return {
          backgroundColor: "#dbeafe",
          color: "#1e40af",
          border: "1px solid #93c5fd",
        };
      case "approved":
        return {
          backgroundColor: "#d1fae5",
          color: "#065f46",
          border: "1px solid #6ee7b7",
        };
      default:
        return {
          backgroundColor: "#f3f4f6",
          color: "#374151",
          border: "1px solid #d1d5db",
        };
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h1>Loan Application</h1>

      {/* Feature Explanation */}
      <div
        style={{
          backgroundColor: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "24px",
        }}
      >
        <h2 style={{ fontSize: "16px", color: "#1e40af", marginTop: 0 }}>
          State-Aware Mocking Demo (ADR-0019)
        </h2>
        <p style={{ fontSize: "14px", color: "#1e40af", marginBottom: "12px" }}>
          This page demonstrates <strong>stateResponse</strong> and{" "}
          <strong>afterResponse.setState</strong> - two features that enable
          state machine patterns in mocks.
        </p>
        <ul
          style={{
            fontSize: "14px",
            color: "#3b82f6",
            margin: 0,
            paddingLeft: "20px",
          }}
        >
          <li>
            <code
              style={{
                backgroundColor: "#dbeafe",
                padding: "2px 4px",
                borderRadius: "4px",
              }}
            >
              GET /api/loan/status
            </code>{" "}
            returns different responses based on current state
          </li>
          <li>
            <code
              style={{
                backgroundColor: "#dbeafe",
                padding: "2px 4px",
                borderRadius: "4px",
              }}
            >
              POST /api/loan/submit
            </code>{" "}
            sets state to &quot;submitted&quot; via afterResponse.setState
          </li>
          <li>
            <code
              style={{
                backgroundColor: "#dbeafe",
                padding: "2px 4px",
                borderRadius: "4px",
              }}
            >
              POST /api/loan/review
            </code>{" "}
            sets state to &quot;reviewed&quot; via afterResponse.setState
          </li>
        </ul>
      </div>

      {/* Current Status Display */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: "24px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Application Status</h2>

        {isLoading ? (
          <p style={{ color: "#6b7280" }}>Loading status...</p>
        ) : loanStatus ? (
          <div>
            <div
              role="status"
              style={{
                display: "inline-block",
                padding: "8px 16px",
                borderRadius: "9999px",
                fontWeight: "600",
                textTransform: "capitalize",
                marginBottom: "16px",
                ...getStatusStyle(loanStatus.status),
              }}
            >
              {loanStatus.status}
            </div>
            <p
              data-testid="status-message"
              style={{ color: "#4b5563", margin: 0 }}
            >
              {loanStatus.message}
            </p>
          </div>
        ) : (
          <p style={{ color: "#ef4444" }}>Failed to load status</p>
        )}
      </div>

      {/* Submit Application */}
      {loanStatus?.status === "pending" && (
        <div
          style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            marginBottom: "24px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Submit Application</h2>
          <p style={{ color: "#4b5563" }}>
            Ready to submit your loan application for £10,000?
          </p>
          <button
            onClick={handleSubmitApplication}
            disabled={isSubmitting}
            style={{
              width: "100%",
              backgroundColor: isSubmitting ? "#9ca3af" : "#2563eb",
              color: "#fff",
              padding: "12px 16px",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </button>
          {submitResult?.success && (
            <p
              role="alert"
              style={{ color: "#059669", fontWeight: "500", marginTop: "12px" }}
            >
              Application submitted successfully!
            </p>
          )}
        </div>
      )}

      {/* Review Section */}
      {loanStatus?.status === "reviewing" && (
        <div
          style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            marginBottom: "24px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Complete Review</h2>
          <p style={{ color: "#4b5563" }}>
            Your application is under review. Click below to complete the review
            process.
          </p>
          <button
            onClick={handleCompleteReview}
            disabled={isReviewing}
            style={{
              width: "100%",
              backgroundColor: isReviewing ? "#9ca3af" : "#059669",
              color: "#fff",
              padding: "12px 16px",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              cursor: isReviewing ? "not-allowed" : "pointer",
            }}
          >
            {isReviewing ? "Processing..." : "Complete Review"}
          </button>
        </div>
      )}

      {/* Approved Section */}
      {loanStatus?.status === "approved" && (
        <div
          style={{
            backgroundColor: "#d1fae5",
            border: "1px solid #6ee7b7",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          <h2 style={{ color: "#065f46", marginTop: 0 }}>Congratulations!</h2>
          <p style={{ color: "#047857", margin: 0 }}>
            Your loan application has been approved. We will be in touch shortly
            with next steps.
          </p>
        </div>
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};
