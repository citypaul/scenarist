"use client";

import { useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Percent,
  Check,
  Package,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { useAuth, type UserTier } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import type { StockStatus } from "@/lib/inventory";

type ProductStock = {
  readonly productId: string;
  readonly available: number;
  readonly status: StockStatus;
};

// Base products data
const products = [
  {
    id: "1",
    name: "Basic Plan",
    description: "Perfect for individuals and small projects",
    basePrice: 9.99,
    features: ["5 projects", "Basic analytics", "Email support"],
    popular: false,
  },
  {
    id: "2",
    name: "Pro Plan",
    description: "Best for growing teams and businesses",
    basePrice: 29.99,
    features: [
      "Unlimited projects",
      "Advanced analytics",
      "Priority support",
      "API access",
    ],
    popular: true,
  },
  {
    id: "3",
    name: "Enterprise Plan",
    description: "For large organizations with custom needs",
    basePrice: 99.99,
    features: [
      "Everything in Pro",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee",
    ],
    popular: false,
  },
];

// Tier discount percentages
const TIER_DISCOUNTS: Record<UserTier, number> = {
  free: 0,
  basic: 10,
  pro: 20,
  enterprise: 30,
};

function calculatePrice(basePrice: number, tier: UserTier): number {
  const discount = TIER_DISCOUNTS[tier];
  return basePrice * (1 - discount / 100);
}

function StockBadge({ stock }: { stock: ProductStock | undefined }) {
  if (!stock) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Loading...
      </Badge>
    );
  }

  switch (stock.status) {
    case "in_stock":
      return (
        <Badge
          variant="outline"
          className="border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400"
        >
          <Package className="mr-1 h-3 w-3" />
          In Stock
        </Badge>
      );
    case "low_stock":
      return (
        <Badge
          variant="outline"
          className="border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400"
        >
          <AlertTriangle className="mr-1 h-3 w-3" />
          Low Stock: {stock.available} left
        </Badge>
      );
    case "out_of_stock":
      return (
        <Badge
          variant="outline"
          className="border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400"
        >
          <XCircle className="mr-1 h-3 w-3" />
          Out of Stock
        </Badge>
      );
  }
}

export default function ProductsPage() {
  const { user, isAuthenticated } = useAuth();
  const { addItem, items } = useCart();
  const userTier = user?.tier ?? "free";
  const discount = TIER_DISCOUNTS[userTier];

  const [stockData, setStockData] = useState<readonly ProductStock[]>([]);
  const [stockError, setStockError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStock() {
      try {
        const response = await fetch("/api/inventory");
        if (!response.ok) {
          throw new Error("Failed to fetch stock");
        }
        const data = await response.json();
        setStockData(data);
        setStockError(null);
      } catch {
        setStockError("Unable to check stock levels");
      }
    }

    fetchStock();
  }, []);

  const getStock = (productId: string): ProductStock | undefined =>
    stockData.find((s) => s.productId === productId);

  const handleAddToCart = (product: (typeof products)[0]) => {
    const stock = getStock(product.id);
    if (stock?.status === "out_of_stock") return;

    addItem({
      id: product.id,
      name: product.name,
      basePrice: product.basePrice,
    });
  };

  const isInCart = (productId: string) =>
    items.some((item) => item.id === productId);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Products</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground">
            Select the plan that best fits your needs. All plans include a
            14-day free trial.
          </p>
          {isAuthenticated && discount > 0 && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-md bg-green-500/10 px-3 py-1.5 text-sm text-green-600 dark:text-green-400">
              <Percent className="h-4 w-4" />
              <span>
                Your <strong>{userTier}</strong> membership saves you{" "}
                <strong>{discount}%</strong> on all plans!
              </span>
            </div>
          )}
          {stockError && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-1.5 text-sm text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              <span>{stockError}</span>
            </div>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {products.map((product) => {
            const discountedPrice = calculatePrice(product.basePrice, userTier);
            const hasDiscount = discount > 0;
            const stock = getStock(product.id);
            const isOutOfStock = stock?.status === "out_of_stock";

            return (
              <Card
                key={product.id}
                className={`${product.popular ? "border-primary" : ""} ${isOutOfStock ? "opacity-60" : ""}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{product.name}</CardTitle>
                    <div className="flex gap-2">
                      <StockBadge stock={stock} />
                      {product.popular && (
                        <Badge variant="default">Popular</Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription>{product.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    {hasDiscount ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">
                          ${discountedPrice.toFixed(2)}
                        </span>
                        <span className="text-lg text-muted-foreground line-through">
                          ${product.basePrice.toFixed(2)}
                        </span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-3xl font-bold">
                          ${product.basePrice.toFixed(2)}
                        </span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                    )}
                    {hasDiscount && (
                      <Badge variant="secondary" className="mt-2">
                        Save ${(product.basePrice - discountedPrice).toFixed(2)}
                        /mo
                      </Badge>
                    )}
                  </div>
                  <ul className="space-y-2 text-sm">
                    {product.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <svg
                          className="mr-2 h-4 w-4 text-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={
                      isInCart(product.id)
                        ? "secondary"
                        : product.popular
                          ? "default"
                          : "outline"
                    }
                    onClick={() => handleAddToCart(product)}
                    disabled={isOutOfStock}
                  >
                    {isOutOfStock ? (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Out of Stock
                      </>
                    ) : isInCart(product.id) ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        In Cart
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
