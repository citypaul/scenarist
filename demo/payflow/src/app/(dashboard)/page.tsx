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
import { ShoppingCart } from "lucide-react";

// Sample products data - will be enhanced with real data later
const products = [
  {
    id: "1",
    name: "Basic Plan",
    description: "Perfect for individuals and small projects",
    price: 9.99,
    features: ["5 projects", "Basic analytics", "Email support"],
    popular: false,
  },
  {
    id: "2",
    name: "Pro Plan",
    description: "Best for growing teams and businesses",
    price: 29.99,
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
    price: 99.99,
    features: [
      "Everything in Pro",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee",
    ],
    popular: false,
  },
];

export default function ProductsPage() {
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
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {products.map((product) => (
            <Card
              key={product.id}
              className={product.popular ? "border-primary" : ""}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{product.name}</CardTitle>
                  {product.popular && <Badge variant="default">Popular</Badge>}
                </div>
                <CardDescription>{product.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <span className="text-3xl font-bold">${product.price}</span>
                  <span className="text-muted-foreground">/month</span>
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
                  variant={product.popular ? "default" : "outline"}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
