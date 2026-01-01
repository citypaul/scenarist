const SHIPPING_SERVICE_URL =
  process.env.SHIPPING_SERVICE_URL || "http://localhost:3001";

export type ShippingOption = {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly estimatedDays: string;
};

export async function getShippingOptions(): Promise<readonly ShippingOption[]> {
  const response = await fetch(`${SHIPPING_SERVICE_URL}/shipping`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Shipping service error: ${response.status}`);
  }

  return response.json();
}

export async function getShippingOption(
  id: string,
): Promise<ShippingOption | null> {
  const options = await getShippingOptions();
  return options.find((option) => option.id === id) ?? null;
}
