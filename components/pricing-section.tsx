"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, Calculator } from "lucide-react";
import { Button } from "./ui/button";
import Image from "next/image";
import Link from "next/link";

const pricingPlans = [
  {
    name: "Basic",
    price: "Free",
    description: "Set up recurring tasks and let our system handle the reminders. Never forget about important maintenance tasks again.",
    icon: <Check className="h-8 w-8 text-[#4AB5A8]" />,
    cta: "Get Started",
    border: "border-[#4AB5A8]",
    features: [
      "Basic Task Management",
      "Digital Document Storage",
      "Maintenance Reminders",
      "Access to DIY Library",
    ]
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "/month",
    description: "View all your upcoming home maintenance tasks at a glance. Stay on top of your home care schedule effortlessly.",
    icon: <Check className="h-8 w-8 text-[#4AB5A8]" />,
    cta: "Join the Waitlist",
    border: "border-[#4AB5A8]",
    features: [
      "Everything in Basic",
      "Home Calendar",
      "Manage Multiple Home Profiles", 
      "Priority Email Support",
      "Expanded Document Storage",
    ]
  },
  {
    name: "Premium",
    price: "$19.99",
    period: "/month",
    description: "View all your upcoming home maintenance tasks at a glance. Stay on top of your home care schedule effortlessly.",
    icon: <Check className="h-8 w-8 text-[#4AB5A8]" />,
    cta: "Join the Waitlist",
    border: "border-[#4AB5A8]",
    features: [
      "Everything in Pro",
      "Increased Document Storage",
      "'Rivo' Report",
      "Priority Phone Support",
      "Custom Maintenance Plans",
    ]
  },
];

export default function PricingSection() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <>
      {/* Hero Banner - Two Column */}
      <section className="w-full py-20 bg-gradient-to-r from-rivo-light via-rivo-base to-rivo-dark">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Simple, Transparent Pricing.
              </h1>
              <p className="text-xl text-white/90 mb-8">
                With pricing starting under $10/month, we offer flexible plans to meet your needs. Start with our free option and upgrade as you grow.
              </p>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  className="bg-white text-rivo-dark hover:bg-gray-100 px-8 py-3 rounded-full font-medium"
                  size="lg"
                >
                  Get Started Now
                </Button>
              </motion.div>
            </motion.div>

            {/* Right Column - Image with animations */}
            <motion.div 
              className="relative h-[400px] w-full flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {/* Main circular image */}
              <div className="relative h-[300px] w-[300px] md:h-[360px] md:w-[360px] rounded-full overflow-hidden border-4 border-white/30 z-10 bg-white/90 flex items-center justify-center">
                <Calculator className="h-40 w-40 text-rivo-base" />
              </div>
              
              {/* Decorative elements */}
              <motion.div 
                className="absolute top-0 right-0 h-16 w-16 rounded-full bg-rivo-light/70 z-0"
                animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
              />
              <motion.div 
                className="absolute bottom-10 left-10 h-10 w-10 rounded-full bg-rivo-base/60 z-0"
                animate={{ y: [0, 15, 0], x: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
              />
              <motion.div 
                className="absolute top-1/3 left-0 h-12 w-12 rounded-full bg-rivo-dark/50 z-0"
                animate={{ y: [0, 10, 0], x: [0, -15, 0] }}
                transition={{ duration: 6, repeat: Infinity, repeatType: "reverse" }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Title */}
      <section className="w-full bg-white pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <div className="mb-4 flex justify-center">
            <Check className="h-10 w-10 text-[#4AB5A8]" />
          </div>
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-gray-900"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            RivoHome Pricing Packages
          </motion.h2>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="w-full bg-white pb-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {pricingPlans.map((plan) => (
              <motion.div
                key={plan.name}
                variants={item}
                whileHover={{ y: -5 }}
                className={`relative flex flex-col rounded-2xl border ${plan.border} p-8 shadow-sm bg-white`}
              >
                <div className="mb-5 flex flex-col items-center text-center">
                  <div className="mb-4 rounded-full bg-rivo-light/20 p-3">
                    {plan.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {plan.name}
                  </h3>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-4xl font-bold tracking-tight text-gray-900">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="ml-1 text-lg text-gray-500">
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <p className="mt-4 text-center text-gray-600">
                    {plan.description}
                  </p>
                </div>
                
                {/* Features List */}
                <div className="mt-4 mb-6 space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto">
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button 
                      className="w-full bg-gradient-to-r from-[#4AB5A8] to-[#2775A6] text-white hover:from-[#3da99c] hover:to-[#206792]"
                      size="lg"
                    >
                      {plan.cta}
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <motion.div 
        className="w-full max-w-7xl mx-auto px-4 md:px-8 mt-20 mb-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Frequently asked questions</h2>
          <p className="text-lg text-gray-600 mb-12">
            Have more questions? Contact our customer support team at <a href="mailto:support@rivohome.com" className="text-primary hover:underline">support@rivohome.com</a>
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Can I switch plans later?</h3>
            <p className="text-gray-600">
              Yes, you can upgrade or downgrade your plan at any time. Changes will be applied to your next billing cycle.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">What payment methods do you accept?</h3>
            <p className="text-gray-600">
              We accept all major credit cards, including Visa, Mastercard, and American Express. We also support PayPal.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">How does the free trial work?</h3>
            <p className="text-gray-600">
              All paid plans include a 14-day free trial. You can cancel anytime before the trial ends and won't be charged.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Is there a contract or commitment?</h3>
            <p className="text-gray-600">
              No long-term contracts. All plans are month-to-month and you can cancel anytime without penalty.
            </p>
          </div>
        </div>
      </motion.div>
    </>
  );
} 