// Simple in-memory order store for the demo
// In a real app, this would be a database

export interface Order {
  id: string;
  sessionId: string;
  customerEmail: string | null;
  userId: string;
  userTier: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  createdAt: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

// In-memory store (resets on server restart)
const orders: Map<string, Order> = new Map();

export function createOrder(order: Order): Order {
  orders.set(order.id, order);
  return order;
}

export interface AddOrderInput {
  readonly userId: string;
  readonly items: readonly OrderItem[];
  readonly subtotal: number;
  readonly discount: number;
  readonly shipping: number;
  readonly tax: number;
  readonly total: number;
  readonly currency: string;
  readonly status: Order["status"];
  readonly paymentId: string;
  readonly customerEmail: string;
}

export function addOrder(input: AddOrderInput): Order {
  const id = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const order: Order = {
    id,
    sessionId: input.paymentId,
    customerEmail: input.customerEmail,
    userId: input.userId,
    userTier: "pro", // Will be set from user service in real implementation
    items: [...input.items],
    subtotal: input.subtotal,
    discount: input.discount,
    tax: input.tax,
    total: input.total,
    currency: input.currency,
    status: input.status,
    createdAt: new Date().toISOString(),
  };
  orders.set(id, order);
  return order;
}

export function getOrder(id: string): Order | undefined {
  return orders.get(id);
}

export function getOrderBySessionId(sessionId: string): Order | undefined {
  for (const order of orders.values()) {
    if (order.sessionId === sessionId) {
      return order;
    }
  }
  return undefined;
}

export function getOrdersByUserId(userId: string): Order[] {
  const userOrders: Order[] = [];
  for (const order of orders.values()) {
    if (order.userId === userId) {
      userOrders.push(order);
    }
  }
  return userOrders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getAllOrders(): Order[] {
  return Array.from(orders.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function updateOrderStatus(
  id: string,
  status: Order["status"],
): Order | undefined {
  const order = orders.get(id);
  if (order) {
    order.status = status;
    orders.set(id, order);
  }
  return order;
}
