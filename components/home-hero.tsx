"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useEffect } from "react"
import { GradientButton } from "@/components/ui/gradient-button"

export function HomeHero() {
  useEffect(() => {
    const handleScroll = () => {
      const headerHeight = document.querySelector('header')?.offsetHeight || 0;
      const target = document.querySelector('#notify-section');
      if (target) {
        window.scrollTo({
          top: target.offsetTop - headerHeight,
          behavior: 'smooth',
        });
      }
    };

    const button = document.querySelector('#join-waitlist-button');
    if (button) {
      button.addEventListener('click', handleScroll);
    }

    return () => {
      if (button) {
        button.removeEventListener('click', handleScroll);
      }
    };
  }, []);

  return (
    <section className="relative h-screen">
      <Image
        src="/rivohome-hero.png"
        alt="Home Hero"
        fill
        className="absolute inset-0 z-0 object-cover"
      />
      <div className="absolute inset-0 bg-black/40 z-10" />
      <div className="container relative z-20 h-full flex items-center justify-end px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="text-right text-white max-w-lg"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome to RivoHome
          </h1>
          <p className="text-lg md:text-xl mb-6">
            Your Complete Home Maintenance Solution. Automate tasks, access DIY tutorials, connect with service providers, and store important documents - all in one place.
          </p>
          <div className="flex items-center justify-end space-x-4">
            <Link href="/sign-in">
              <GradientButton
                variant="secondary"
                size="lg"
              >
                Sign In
              </GradientButton>
            </Link>
            <Link href="/sign-up">
              <GradientButton
                variant="primary"
                size="lg"
              >
                Sign Up
              </GradientButton>
            </Link>
          </div>
          <p className="mt-4 text-sm text-white/80">
            Join today and take control of your home maintenance.
          </p>
        </motion.div>
      </div>
    </section>
  )
} 