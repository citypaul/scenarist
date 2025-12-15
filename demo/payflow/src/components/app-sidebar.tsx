"use client";

import * as React from "react";
import { CreditCard, Home, Package, ShoppingCart, User } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

// PayFlow navigation data
const navItems = [
  {
    title: "Products",
    url: "/",
    icon: Home,
    isActive: true,
  },
  {
    title: "Cart",
    url: "/cart",
    icon: ShoppingCart,
  },
  {
    title: "Orders",
    url: "/orders",
    icon: Package,
  },
  {
    title: "Checkout",
    url: "/checkout",
    icon: CreditCard,
  },
  {
    title: "Account",
    url: "/account",
    icon: User,
    items: [
      {
        title: "Profile",
        url: "/account/profile",
      },
      {
        title: "Settings",
        url: "/account/settings",
      },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <CreditCard className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">PayFlow</span>
                  <span className="text-muted-foreground truncate text-xs">
                    Payment Dashboard
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
