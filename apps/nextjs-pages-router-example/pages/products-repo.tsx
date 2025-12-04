/**
 * Products with Repository Pattern - Pages Router (getServerSideProps)
 *
 * This demonstrates the COMBINED testing strategy:
 * - Repository pattern for database access (with test ID isolation)
 * - Scenarist for HTTP API mocking
 *
 * The key insight: Both use the same test ID isolation model.
 * - Repository partitions data by test ID
 * - Scenarist returns mocks by test ID
 * - Parallel tests don't interfere with each other
 *
 * NOTE: Repository pattern is NOT a Scenarist feature. It's a complementary
 * pattern for handling direct database queries.
 *
 * Learn more: https://scenarist.io/guides/testing-database-apps/repository-pattern
 */

import type { GetServerSideProps } from "next";
import type { ProductsResponse } from "@/types/product";
import { getUserRepository, runWithTestId } from "@/lib/container";
import type { User } from "@/lib/repositories";
import { getString } from "@/lib/request-utils";

type ProductsRepoPageProps = {
  user: User | null;
  products: ProductsResponse["products"];
  testId: string;
};

export const getServerSideProps: GetServerSideProps<
  ProductsRepoPageProps
> = async (context) => {
  const userIdParam = context.query.userId;
  const userId = getString(userIdParam, "user-1");
  const testId = getString(
    context.req.headers["x-scenarist-test-id"],
    "default-test",
  );

  // 1. Get user from repository (in-memory with test ID isolation)
  const user = await runWithTestId(testId, async () => {
    const userRepository = getUserRepository();
    return userRepository.findById(userId);
  });

  // 2. Get products from external API (mocked by Scenarist)
  const tier = user?.tier ?? "standard";
  const response = await fetch("http://localhost:3001/products", {
    headers: {
      "x-scenarist-test-id": testId,
      "x-user-tier": tier,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.statusText}`);
  }

  const data: ProductsResponse = await response.json();

  return {
    props: {
      user,
      products: data.products,
      testId,
    },
  };
};

export default function ProductsRepoPage({
  user,
  products,
}: ProductsRepoPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Products with Repository Pattern
        </h1>
        <p className="text-gray-600 mb-4">
          This page demonstrates the combined testing strategy: Repository
          pattern for database access + Scenarist for HTTP API mocking.
        </p>
      </div>

      {/* User info from repository */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">User Information</h2>
        {user ? (
          <div className="space-y-1">
            <p>
              <strong>Name:</strong> {user.name}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Tier:</strong>{" "}
              <span
                className={`px-2 py-1 rounded text-sm ${
                  user.tier === "premium"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {user.tier}
              </span>
            </p>
          </div>
        ) : (
          <p className="text-gray-500">
            No user found. Use the test API to create a user first.
          </p>
        )}
      </div>

      {/* Products from external API (Scenarist) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
            <p className="text-gray-600 mb-4">{product.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-blue-600">
                £{product.price.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500 uppercase">
                {product.tier}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="mt-12 p-6 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">How It Works</h2>
        <div className="space-y-3 text-sm">
          <div>
            <strong>1. User from Repository:</strong>
            <p className="text-gray-600 ml-4">
              In-memory repository with test ID isolation. Each test gets its
              own data partition.
            </p>
          </div>
          <div>
            <strong>2. Products from Scenarist:</strong>
            <p className="text-gray-600 ml-4">
              External API mocked by Scenarist. Returns pricing based on user
              tier header.
            </p>
          </div>
          <div>
            <strong>3. Same Test ID:</strong>
            <p className="text-gray-600 ml-4">
              Both repository and Scenarist use the same test ID for isolation.
              Parallel tests don't interfere.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
