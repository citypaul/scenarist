/**
 * TierSelector Component - Phase 2
 *
 * Allows switching between premium and standard user tiers.
 * Updates the x-user-tier header for API requests.
 */

type TierSelectorProps = {
  readonly currentTier: "premium" | "standard";
  readonly onTierChange: (tier: "premium" | "standard") => void;
};

export const TierSelector = ({
  currentTier,
  onTierChange,
}: TierSelectorProps) => {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
      <label className="text-sm font-medium text-gray-700">User Tier:</label>
      <div role="group" aria-label="User tier selection" className="flex gap-2">
        <button
          onClick={() => onTierChange("premium")}
          aria-label="Select premium tier"
          aria-pressed={currentTier === "premium"}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            currentTier === "premium"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          Premium
        </button>
        <button
          onClick={() => onTierChange("standard")}
          aria-label="Select standard tier"
          aria-pressed={currentTier === "standard"}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            currentTier === "standard"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          Standard
        </button>
      </div>
      <span className="text-xs text-gray-500 ml-auto">
        {currentTier === "premium"
          ? "Premium pricing (£99.99)"
          : "Standard pricing (£149.99)"}
      </span>
    </div>
  );
};
