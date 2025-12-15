"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { login, isLoading } = useAuth();

  const handleLogin = () => {
    login(); // Redirects to Auth0
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome to PayFlow</h1>
                <p className="text-muted-foreground text-balance">
                  Sign in to access your payment dashboard
                </p>
              </div>
              <div className="pt-4">
                <Button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    "Sign in with Auth0"
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center pt-4">
                PayFlow uses Auth0 for secure authentication. You&apos;ll be
                redirected to sign in.
              </p>
            </FieldGroup>
          </div>
          <div className="bg-muted relative hidden md:block">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="text-6xl font-bold text-primary mb-4">PF</div>
                <p className="text-xl text-muted-foreground">
                  Secure Payment Processing
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <p className="px-6 text-center text-xs text-muted-foreground">
        By signing in, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
