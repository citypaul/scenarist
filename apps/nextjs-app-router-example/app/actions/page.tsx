"use client";

import { useActionState } from "react";
import Link from "next/link";
import { submitContactForm } from "./actions";

export default function ActionsPage() {
  const [state, formAction, isPending] = useActionState(submitContactForm, null);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Server Actions Demo
        </h1>

        <nav aria-label="Main navigation" className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Back to Home
          </Link>
        </nav>

        <form action={formAction} className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            {isPending ? "Sending..." : "Send Message"}
          </button>
        </form>

        {state?.success && (
          <div
            role="status"
            className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800"
          >
            {state.message}
          </div>
        )}

        {state?.success === false && (
          <div
            role="alert"
            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800"
          >
            {state.message}
          </div>
        )}
      </div>
    </main>
  );
}
