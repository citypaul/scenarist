const INVENTORY_SERVICE_URL =
  process.env.INVENTORY_SERVICE_URL || "http://localhost:3001";

export type InventoryItem = {
  readonly id: string;
  readonly productId: string;
  readonly quantity: number;
  readonly reserved: number;
};

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export type ProductStock = {
  readonly productId: string;
  readonly available: number;
  readonly status: StockStatus;
};

const LOW_STOCK_THRESHOLD = 5;

function getStockStatus(available: number): StockStatus {
  if (available <= 0) return "out_of_stock";
  if (available <= LOW_STOCK_THRESHOLD) return "low_stock";
  return "in_stock";
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

export async function getProductStock(
  productId: string,
): Promise<ProductStock | null> {
  const inventory = await getInventory();
  const item = inventory.find((i) => i.productId === productId);

  if (!item) return null;

  const available = item.quantity - item.reserved;
  return {
    productId: item.productId,
    available,
    status: getStockStatus(available),
  };
}

export async function getAllProductStock(): Promise<readonly ProductStock[]> {
  const inventory = await getInventory();

  return inventory.map((item) => {
    const available = item.quantity - item.reserved;
    return {
      productId: item.productId,
      available,
      status: getStockStatus(available),
    };
  });
}

export async function checkStockAvailable(
  productId: string,
  quantity: number = 1,
): Promise<boolean> {
  const stock = await getProductStock(productId);
  if (!stock) return false;
  return stock.available >= quantity;
}
