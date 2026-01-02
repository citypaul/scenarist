"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  CreditCard,
  Lock,
  Loader2,
  AlertCircle,
  ShoppingCart,
  XCircle,
  Truck,
  CheckCircle,
} from "lucide-react";
import { useCart } from "@/contexts/cart-context";

type UnavailableOffer = {
  readonly id: string;
  readonly name: string;
  readonly available: number;
  readonly requested: number;
};

type ShippingOption = {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly estimatedDays: string;
};

type CheckoutSuccess = {
  readonly orderId: string;
  readonly paymentId: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, discount, discountAmount, tax, total, clearCart } =
    useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [unavailableOffers, setUnavailableOffers] = useState<
    readonly UnavailableOffer[]
  >([]);
  const [shippingOptions, setShippingOptions] = useState<
    readonly ShippingOption[]
  >([]);
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(
    null,
  );
  const [isLoadingShipping, setIsLoadingShipping] = useState(true);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] =
    useState<CheckoutSuccess | null>(null);

  // Fetch shipping options from Shipping Service
  useEffect(() => {
    async function loadShippingOptions() {
      try {
        const response = await fetch("/api/shipping");
        if (response.ok) {
          const options: readonly ShippingOption[] = await response.json();
          setShippingOptions(options);
          // Auto-select first option if available
          if (options.length > 0) {
            setSelectedShippingId(options[0].id);
          }
        } else {
          setShippingError("Unable to load shipping options");
        }
      } catch {
        setShippingError("Unable to load shipping options");
      }
      setIsLoadingShipping(false);
    }

    loadShippingOptions();
  }, []);

  const selectedShipping = shippingOptions.find(
    (option) => option.id === selectedShippingId,
  );
  const shippingCost = selectedShipping?.price ?? 0;
  const totalWithShipping = total + shippingCost;

  const handleCheckout = useCallback(async () => {
    if (items.length === 0 || !selectedShippingId) return;

    setIsLoading(true);
    setError(null);
    setPaymentError(null);
    setUnavailableOffers([]);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            basePrice: item.basePrice,
            quantity: item.quantity,
          })),
          shippingOptionId: selectedShippingId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409 && data.unavailableOffers) {
          setUnavailableOffers(data.unavailableOffers);
          setError("Some promotional offers are no longer available");
          return;
        }
        if (response.status === 402) {
          // Payment failed
          setPaymentError(data.message || "Your payment was declined");
          return;
        }
        throw new Error(data.error || "Failed to process checkout");
      }

      // Success! Clear cart and show success message
      clearCart();
      setCheckoutSuccess({
        orderId: data.orderId,
        paymentId: data.paymentId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, [items, selectedShippingId, clearCart]);

  const handleBackToProducts = useCallback(() => {
    router.push("/");
  }, [router]);

  // Show success state
  if (checkoutSuccess) {
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
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">Products</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Order Confirmed</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
          <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/30">
            <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold">Payment Successful!</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Thank you for your purchase. Your order has been confirmed and will
            be processed shortly.
          </p>
          <div className="mt-2 text-sm text-muted-foreground space-y-1 text-center">
            <p>
              Order ID:{" "}
              <code className="font-mono">{checkoutSuccess.orderId}</code>
            </p>
            <p>
              Payment ID:{" "}
              <code className="font-mono">{checkoutSuccess.paymentId}</code>
            </p>
          </div>
          <div className="flex gap-4 mt-4">
            <Button asChild variant="outline">
              <Link href="/orders">View Orders</Link>
            </Button>
            <Button asChild>
              <Link href="/">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  if (items.length === 0) {
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
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">Products</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Checkout</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
          <ShoppingCart className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Your cart is empty</h2>
          <p className="text-muted-foreground">
            Add some items to your cart before checking out.
          </p>
          <Button asChild>
            <Link href="/">Browse Products</Link>
          </Button>
        </div>
      </>
    );
  }

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
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/">Products</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/cart">Cart</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Checkout</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight">Checkout</h1>
          <p className="text-muted-foreground">
            Complete your purchase securely.
          </p>
        </div>

        {error && unavailableOffers.length === 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {paymentError && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Payment Failed</AlertTitle>
            <AlertDescription>
              {paymentError}. Please try again or use a different payment
              method.
            </AlertDescription>
          </Alert>
        )}

        {unavailableOffers.length > 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Promotional Offers Ended</AlertTitle>
            <AlertDescription>
              <p className="mb-2">
                Sorry, the following promotional offers are no longer available:
              </p>
              <ul className="list-disc list-inside space-y-1">
                {unavailableOffers.map((item) => (
                  <li key={item.id}>
                    <strong>{item.name}</strong>
                    {item.available > 0
                      ? ` - Only ${item.available} spots remaining at this price (you requested ${item.requested})`
                      : " - Offer ended"}
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={handleBackToProducts}
              >
                Update Your Cart
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping
                </CardTitle>
                <CardDescription>
                  Choose your preferred shipping method
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingShipping ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : shippingError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Shipping Unavailable</AlertTitle>
                    <AlertDescription>{shippingError}</AlertDescription>
                  </Alert>
                ) : (
                  <RadioGroup
                    value={selectedShippingId ?? undefined}
                    onValueChange={setSelectedShippingId}
                    className="space-y-3"
                  >
                    {shippingOptions.map((option) => (
                      <div
                        key={option.id}
                        className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer"
                        onClick={() => setSelectedShippingId(option.id)}
                      >
                        <RadioGroupItem value={option.id} id={option.id} />
                        <Label
                          htmlFor={option.id}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{option.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {option.estimatedDays}
                              </p>
                            </div>
                            <span className="font-medium">
                              ${option.price.toFixed(2)}
                            </span>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment
                </CardTitle>
                <CardDescription>
                  Your payment will be processed securely
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Secure Payment</p>
                      <p className="text-sm text-muted-foreground">
                        Your payment information is encrypted and secure
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Accepted payment methods:</p>
                  <div className="mt-2 flex gap-2">
                    <div className="rounded border px-2 py-1 text-xs">Visa</div>
                    <div className="rounded border px-2 py-1 text-xs">
                      Mastercard
                    </div>
                    <div className="rounded border px-2 py-1 text-xs">Amex</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>${(item.basePrice * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({discount}%)</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>
                  {selectedShipping
                    ? `$${shippingCost.toFixed(2)}`
                    : "Select option"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (10%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${totalWithShipping.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={
                  isLoading ||
                  items.length === 0 ||
                  !selectedShippingId ||
                  isLoadingShipping ||
                  !!shippingError
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Pay ${totalWithShipping.toFixed(2)}
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                By completing this purchase you agree to our Terms of Service.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}
