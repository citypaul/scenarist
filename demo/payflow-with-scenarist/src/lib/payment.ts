const PAYMENT_SERVICE_URL =
  process.env.PAYMENT_SERVICE_URL || "http://localhost:3001";

export type PaymentStatus = "succeeded" | "failed" | "pending";

export type PaymentRequest = {
  readonly userId: string;
  readonly amount: number;
  readonly currency: string;
  readonly items: readonly {
    readonly name: string;
    readonly quantity: number;
    readonly price: number;
  }[];
  readonly shippingOption: string;
};

export type PaymentResponse = {
  readonly id: string;
  readonly status: PaymentStatus;
  readonly amount: number;
  readonly currency: string;
  readonly createdAt: string;
  readonly error?: string;
  readonly message?: string;
};

/**
 * Headers to propagate to backend service calls.
 * Used for Scenarist test ID propagation.
 */
export type ServiceHeaders = Record<string, string>;

export async function processPayment(
  request: PaymentRequest,
  headers: ServiceHeaders = {},
): Promise<PaymentResponse> {
  const response = await fetch(`${PAYMENT_SERVICE_URL}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(request),
    cache: "no-store",
  });

  if (!response.ok) {
    // If the service returns an error status, try to parse the error response
    const errorData = await response.json().catch(() => ({}));
    return {
      id: `pay_error_${Date.now()}`,
      status: "failed",
      amount: request.amount,
      currency: request.currency,
      createdAt: new Date().toISOString(),
      error: "service_error",
      message: errorData.message || `Payment service error: ${response.status}`,
    };
  }

  return response.json();
}
