const INVENTORY_SERVICE_URL =
  process.env.INVENTORY_SERVICE_URL || "http://localhost:3001";

export type InventoryItem = {
  readonly id: string;
  readonly productId: string;
  readonly quantity: number;
  readonly reserved: number;
};

export type OfferStatus = "available" | "limited_offer" | "offer_ended";

export type ProductOffer = {
  readonly productId: string;
  readonly available: number;
  readonly status: OfferStatus;
};

const LIMITED_OFFER_THRESHOLD = 20;

function getOfferStatus(available: number): OfferStatus {
  if (available <= 0) return "offer_ended";
  if (available <= LIMITED_OFFER_THRESHOLD) return "limited_offer";
  return "available";
}

export async function getInventory(): Promise<readonly InventoryItem[]> {
  const response = await fetch(`${INVENTORY_SERVICE_URL}/inventory`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Inventory service error: ${response.status}`);
  }

  return response.json();
}

export async function getProductOffer(
  productId: string,
): Promise<ProductOffer | null> {
  const inventory = await getInventory();
  const item = inventory.find((i) => i.productId === productId);

  if (!item) return null;

  const available = item.quantity - item.reserved;
  return {
    productId: item.productId,
    available,
    status: getOfferStatus(available),
  };
}

export async function getAllProductOffers(): Promise<readonly ProductOffer[]> {
  const inventory = await getInventory();

  return inventory.map((item) => {
    const available = item.quantity - item.reserved;
    return {
      productId: item.productId,
      available,
      status: getOfferStatus(available),
    };
  });
}

export async function checkOfferAvailable(
  productId: string,
  quantity: number = 1,
): Promise<boolean> {
  const offer = await getProductOffer(productId);
  if (!offer) return false;
  return offer.available >= quantity;
}
