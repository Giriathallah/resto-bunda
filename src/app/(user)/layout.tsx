"use client";

import Link from "next/link";
import { ShoppingCart, User } from "lucide-react";
import { useCart } from "@/lib/cart";
import { CartProvider } from "@/lib/cart";

function Header() {
  const { count } = useCart();
  return (
    <div className="bg-card border-b sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          RestaurantApp
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="p-2 rounded-lg hover:bg-accent"
            aria-label="Profile"
          >
            <User className="w-6 h-6" />
          </Link>
          <Link
            href="/cart"
            className="relative p-2 rounded-lg hover:bg-accent"
            aria-label="Cart"
          >
            <ShoppingCart className="w-6 h-6" />
            {count() > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {count()}
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <Header />
      <main className="min-h-screen bg-background">{children}</main>
    </CartProvider>
  );
}
