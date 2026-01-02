const SHIPPING_SERVICE_URL =
  process.env.SHIPPING_SERVICE_URL || "http://localhost:3001";

export type ShippingOption = {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly estimatedDays: string;
};

/**
 * Headers to propagate to backend service calls.
 * Used for Scenarist test ID propagation.
 */
export type ServiceHeaders = Record<string, string>;

export async function getShippingOptions(
  headers: ServiceHeaders = {},
): Promise<readonly ShippingOption[]> {
  const response = await fetch(`${SHIPPING_SERVICE_URL}/shipping`, {
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Shipping service error: ${response.status}`);
  }

  return response.json();
}

export async function getShippingOption(
  id: string,
  headers: ServiceHeaders = {},
): Promise<ShippingOption | null> {
  const options = await getShippingOptions(headers);
  return options.find((option) => option.id === id) ?? null;
}
