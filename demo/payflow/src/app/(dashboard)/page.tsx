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
  Flame,
  Zap,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { useAuth, type UserTier } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import type { OfferStatus } from "@/lib/inventory";

type ProductOffer = {
  readonly productId: string;
  readonly available: number;
  readonly status: OfferStatus;
};

// Base products data with offer types
const products = [
  {
    id: "1",
    name: "Basic Plan",
    description: "Perfect for individuals and small projects",
    basePrice: 9.99,
    features: ["5 projects", "Basic analytics", "Email support"],
    popular: false,
    offerType: null, // Always available, no limited offer
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
    offerType: "launch", // Launch pricing - limited slots
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
    offerType: "founding", // Founding member spots
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

function OfferBadge({
  offer,
  offerType,
}: {
  offer: ProductOffer | undefined;
  offerType: string | null;
}) {
  if (!offer) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Loading...
      </Badge>
    );
  }

  // No badge for always-available products
  if (offerType === null && offer.status === "available") {
    return null;
  }

  switch (offer.status) {
    case "available":
      return null; // No urgency badge needed
    case "limited_offer":
      if (offerType === "founding") {
        return (
          <Badge
            variant="outline"
            className="border-purple-500/50 bg-purple-500/10 text-purple-600 dark:text-purple-400"
          >
            <Zap className="mr-1 h-3 w-3" />
            {offer.available} founding spots
          </Badge>
        );
      }
      return (
        <Badge
          variant="outline"
          className="border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400"
        >
          <Flame className="mr-1 h-3 w-3" />
          {offer.available} left at this price
        </Badge>
      );
    case "offer_ended":
      return (
        <Badge
          variant="outline"
          className="border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400"
        >
          <XCircle className="mr-1 h-3 w-3" />
          Offer Ended
        </Badge>
      );
  }
}

export default function ProductsPage() {
  const { user, isAuthenticated } = useAuth();
  const { addItem, items } = useCart();
  const userTier = user?.tier ?? "free";
  const discount = TIER_DISCOUNTS[userTier];

  const [offerData, setOfferData] = useState<readonly ProductOffer[]>([]);
  const [offerError, setOfferError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOffers() {
      try {
        const response = await fetch("/api/inventory");
        if (!response.ok) {
          throw new Error("Failed to fetch offers");
        }
        const data = await response.json();
        setOfferData(data);
        setOfferError(null);
      } catch {
        setOfferError("Unable to check promotional offers");
      }
    }

    fetchOffers();
  }, []);

  const getOffer = (productId: string): ProductOffer | undefined =>
    offerData.find((o) => o.productId === productId);

  const handleAddToCart = (product: (typeof products)[0]) => {
    const offer = getOffer(product.id);
    if (offer?.status === "offer_ended") return;

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
          {offerError && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-1.5 text-sm text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              <span>{offerError}</span>
            </div>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {products.map((product) => {
            const discountedPrice = calculatePrice(product.basePrice, userTier);
            const hasDiscount = discount > 0;
            const offer = getOffer(product.id);
            const isOfferEnded = offer?.status === "offer_ended";

            return (
              <Card
                key={product.id}
                className={`${product.popular ? "border-primary" : ""} ${isOfferEnded ? "opacity-60" : ""}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{product.name}</CardTitle>
                    <div className="flex gap-2">
                      <OfferBadge offer={offer} offerType={product.offerType} />
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
                    disabled={isOfferEnded}
                  >
                    {isOfferEnded ? (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Offer Ended
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
