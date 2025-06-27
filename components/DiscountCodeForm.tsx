"use client";

import { useState } from "react";

interface DiscountCodeFormProps {
  onDiscountApplied?: (percentOff: number, code: string) => void;
  onDiscountRemoved?: () => void;
  disabled?: boolean;
}

export default function DiscountCodeForm({ 
  onDiscountApplied, 
  onDiscountRemoved,
  disabled = false 
}: DiscountCodeFormProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    percentOff: number;
  } | null>(null);

  const handleApply = async () => {
    if (!code.trim()) {
      setError("Please enter a discount code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/discount-codes/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid discount code");
      }

      // Success - apply discount
      const discount = {
        code: data.code,
        percentOff: data.percent_off
      };

      setAppliedDiscount(discount);
      setCode(""); // Clear input
      
      if (onDiscountApplied) {
        onDiscountApplied(discount.percentOff, discount.code);
      }

    } catch (err) {
      console.error("Discount code error:", err);
      setError(err instanceof Error ? err.message : "Invalid discount code");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setAppliedDiscount(null);
    setCode("");
    setError(null);
    
    if (onDiscountRemoved) {
      onDiscountRemoved();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && !disabled) {
      e.preventDefault();
      handleApply();
    }
  };

  if (appliedDiscount) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-green-800">
                Discount Applied!
              </h4>
              <p className="text-sm text-green-700">
                <strong>{appliedDiscount.code}</strong> - {appliedDiscount.percentOff}% off
              </p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            disabled={disabled}
            className="text-green-600 hover:text-green-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">
        Have a discount code?
      </h3>
      
      {error && (
        <div className="mb-3 rounded-md bg-red-50 border border-red-200 p-3">
          <div className="flex">
            <svg className="h-4 w-4 text-red-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-2">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="Enter discount code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyPress={handleKeyPress}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={loading || disabled}
          maxLength={20}
        />
        <button
          onClick={handleApply}
          disabled={loading || disabled || !code.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
              Applying
            </div>
          ) : (
            "Apply"
          )}
        </button>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        <p>• Founding Provider codes offer exclusive discounts</p>
        <p>• Codes are case-insensitive and single-use</p>
      </div>
    </div>
  );
} 