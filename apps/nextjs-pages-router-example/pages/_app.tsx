import type { AppProps } from "next/app";
import "../styles/globals.css";

import { clsx, type ClassValue } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Database,
  Globe,
  Lock,
  Play,
  Server,
  Shield,
  Terminal,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

// --- Utility for cleaner tailwind classes ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Constants ---
const CYCLE_DURATION = 8000;
const STEPS = {
  IDLE: 0,
  TEST_START: 1,
  SERVER_PROCESSING: 2,
  INTERCEPTION: 3,
  RETURN: 4,
  SUCCESS: 5,
};

const ScenaristPremiumDemo = () => {
  const [step, setStep] = useState(STEPS.IDLE);

  useEffect(() => {
    const loop = async () => {
      setStep(STEPS.TEST_START);
      await wait(1000); // Test starts
      setStep(STEPS.SERVER_PROCESSING);
      await wait(2000); // Processing in real server
      setStep(STEPS.INTERCEPTION);
      await wait(1500); // Hit the edge
      setStep(STEPS.RETURN);
      await wait(1500); // Return data
      setStep(STEPS.SUCCESS);
      await wait(3000); // Show success state
      setStep(STEPS.IDLE); // Reset
      await wait(500);
    };

    const wait = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    // Start loop
    loop();

    // Cleanup not strictly necessary for this simple recursive demo but good practice
    return () => {};
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto p-6 flex flex-col items-center justify-center bg-transparent font-sans">
      {/* Main Glass Panel */}
      <div className="relative w-full aspect-[16/9] md:aspect-[2/1] bg-[#0A0A0A] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Background Grid Effect */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        {/* --- LEFT: VISUALIZATION --- */}
        <div className="flex-1 relative p-8 md:p-12 flex items-center justify-between z-10">
          {/* Connector Lines (Background) */}
          <div className="absolute top-1/2 left-20 right-20 h-[2px] bg-white/5 -translate-y-1/2"></div>

          {/* NODE 1: The Test */}
          <NodeContainer
            active={step >= STEPS.TEST_START}
            label="Playwright"
            icon={
              <Play size={20} className="fill-blue-500 text-blue-500 ml-1" />
            }
            color="blue"
          />

          {/* NODE 2: The Infrastructure (Real Server) */}
          <div className="relative">
            <NodeContainer
              active={step >= STEPS.SERVER_PROCESSING && step < STEPS.SUCCESS}
              label="Your Infrastructure"
              subLabel="Next.js • Express • DB"
              icon={<Server size={20} className="text-emerald-400" />}
              color="emerald"
              isLarge
            />
            {/* Database indicator popping up */}
            <AnimatePresence>
              {step === STEPS.SERVER_PROCESSING && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: -40 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute left-1/2 -translate-x-1/2 -top-4 flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1.5 rounded-full whitespace-nowrap"
                >
                  <Database size={12} />
                  <span>Querying Real DB</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* THE PACKET (The Hero Actor) */}
          <Packet step={step} />

          {/* NODE 3: The Interception Point */}
          <div className="relative z-20">
            <motion.div
              animate={{
                scale: step === STEPS.INTERCEPTION ? 1.1 : 1,
                borderColor:
                  step === STEPS.INTERCEPTION
                    ? "rgba(139, 92, 246, 0.5)"
                    : "rgba(255,255,255,0.1)",
                boxShadow:
                  step === STEPS.INTERCEPTION
                    ? "0 0 40px -10px rgba(139, 92, 246, 0.5)"
                    : "none",
              }}
              className="w-16 h-16 rounded-xl bg-[#111] border border-white/10 flex items-center justify-center relative"
            >
              <Shield
                size={24}
                className={cn(
                  "transition-colors duration-500",
                  step >= STEPS.INTERCEPTION
                    ? "text-violet-400"
                    : "text-slate-600",
                )}
              />

              {/* The "Wall" Effect */}
              <AnimatePresence>
                {step === STEPS.INTERCEPTION && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1.5 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 border-2 border-violet-500/50 rounded-xl"
                  />
                )}
              </AnimatePresence>
            </motion.div>
            <div className="absolute top-20 left-1/2 -translate-x-1/2 text-center w-32">
              <span
                className={cn(
                  "text-xs font-bold tracking-wider transition-colors duration-300",
                  step >= STEPS.INTERCEPTION
                    ? "text-violet-400"
                    : "text-slate-600",
                )}
              >
                SCENARIST
              </span>
            </div>
          </div>

          {/* NODE 4: The External World (Blocked) */}
          <div className="opacity-30 grayscale relative">
            <div className="w-12 h-12 rounded-full border border-dashed border-white/30 flex items-center justify-center">
              <Globe size={20} />
            </div>
            <div className="absolute top-16 left-1/2 -translate-x-1/2 text-[10px] font-mono text-center w-20">
              EXTERNAL API
            </div>
            {/* X Mark */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-px h-8 bg-red-500/50 rotate-45 absolute"></div>
              <div className="w-px h-8 bg-red-500/50 -rotate-45 absolute"></div>
            </div>
          </div>
        </div>

        {/* --- RIGHT: CODE TERMINAL --- */}
        <div className="w-full md:w-80 border-l border-white/10 bg-[#050505] p-6 font-mono text-sm relative flex flex-col justify-center">
          <div className="absolute top-4 left-6 flex gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20"></div>
          </div>

          <div className="space-y-4 mt-8">
            <CodeLine
              active={step === STEPS.TEST_START}
              text={
                <span>
                  <span className="text-purple-400">test</span>(
                  <span className="text-green-400">'checkout'</span>,{" "}
                  <span className="text-purple-400">async</span> ({"{"} page{" "}
                  {"}"}) ={"{"}
                </span>
              }
            />

            <CodeLine
              active={step === STEPS.INTERCEPTION} // Highlight when Scenarist is active
              text={
                <span>
                  {" "}
                  <span className="text-slate-500">
                    // 1. Activate Scenario
                  </span>
                  <br /> <span className="text-blue-400">await</span>{" "}
                  switchScenario(
                  <span className="text-green-400">'success'</span>);
                </span>
              }
              highlightColor="bg-violet-500/10 border-violet-500/30"
            />

            <CodeLine
              active={step === STEPS.SERVER_PROCESSING}
              text={
                <span>
                  {" "}
                  <span className="text-slate-500">
                    // 2. Real Backend runs
                  </span>
                  <br /> <span className="text-blue-400">await</span>{" "}
                  page.click(<span className="text-green-400">'#pay'</span>);
                </span>
              }
              highlightColor="bg-emerald-500/10 border-emerald-500/30"
            />

            <CodeLine
              active={step === STEPS.SUCCESS}
              text={
                <span>
                  {" "}
                  <span className="text-blue-400">await</span>{" "}
                  expect(page).toHaveURL(
                  <span className="text-green-400">'/ok'</span>);
                </span>
              }
            />

            <div className="text-slate-600">{"}"});</div>
          </div>

          {/* Success Toast */}
          <AnimatePresence>
            {step === STEPS.SUCCESS && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="absolute bottom-6 left-6 right-6 bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-lg flex items-center gap-3 shadow-lg backdrop-blur-sm"
              >
                <CheckCircle2 size={18} />
                <span className="text-xs font-bold">TEST PASSED (140ms)</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// --- Sub-components for cleanliness ---

const NodeContainer = ({
  active,
  icon,
  label,
  subLabel,
  color,
  isLarge,
}: any) => {
  const borderColor = active
    ? color === "blue"
      ? "border-blue-500/50"
      : "border-emerald-500/50"
    : "border-white/10";

  const glow = active
    ? color === "blue"
      ? "shadow-[0_0_30px_-5px_rgba(59,130,246,0.4)]"
      : "shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)]"
    : "";

  return (
    <div className="flex flex-col items-center gap-4 relative z-10 transition-all duration-500">
      <div
        className={cn(
          "bg-[#111] border rounded-2xl flex items-center justify-center transition-all duration-500",
          borderColor,
          glow,
          isLarge ? "w-24 h-24" : "w-16 h-16",
        )}
      >
        {icon}
      </div>
      <div className="text-center">
        <div
          className={cn(
            "text-xs font-bold tracking-wide transition-colors duration-300",
            active ? "text-white" : "text-slate-500",
          )}
        >
          {label}
        </div>
        {subLabel && (
          <div className="text-[10px] text-slate-600 mt-1">{subLabel}</div>
        )}
      </div>
    </div>
  );
};

const Packet = ({ step }: { step: number }) => {
  // We use Framer Motion variants to control the precise x/y position of the data packet
  // The positions (left: X%) align with the flex layout of the parent

  const variants = {
    [STEPS.IDLE]: { left: "10%", opacity: 0, scale: 0 },
    [STEPS.TEST_START]: {
      left: "18%",
      opacity: 1,
      scale: 1,
      backgroundColor: "#3b82f6",
    }, // Blue (Request)
    [STEPS.SERVER_PROCESSING]: {
      left: "50%",
      scale: 1.2,
      backgroundColor: "#10b981",
      transition: { duration: 0.8, ease: "easeInOut" },
    }, // Green (Processing)
    [STEPS.INTERCEPTION]: {
      left: "78%",
      scale: 1,
      backgroundColor: "#8b5cf6",
      transition: { duration: 0.5 },
    }, // Purple (At the Shield)
    [STEPS.RETURN]: {
      left: "18%",
      scale: 0.8,
      backgroundColor: "#8b5cf6",
      transition: { duration: 0.8, ease: "easeOut" },
    }, // Purple (Mock Data Return)
    [STEPS.SUCCESS]: { left: "18%", scale: 0, opacity: 0 },
  };

  return (
    <motion.div
      className="absolute top-1/2 -mt-2 w-4 h-4 rounded-full z-30 shadow-[0_0_15px_currentColor]"
      initial={STEPS.IDLE}
      animate={step.toString()}
      variants={variants as any}
    >
      {/* Inner "Data" Icon */}
      {step === STEPS.INTERCEPTION && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -top-6 left-1/2 -translate-x-1/2"
        >
          <Lock size={12} className="text-violet-300" />
        </motion.div>
      )}
    </motion.div>
  );
};

const CodeLine = ({
  text,
  active,
  highlightColor = "bg-white/5 border-white/10",
}: any) => (
  <div
    className={cn(
      "p-2 rounded border-l-2 transition-all duration-300 text-xs leading-relaxed font-medium font-mono",
      active
        ? `opacity-100 ${highlightColor} pl-3`
        : "opacity-40 border-transparent pl-2",
    )}
  >
    {text}
  </div>
);

export default function App({ Component, pageProps }: AppProps) {
  return <ScenaristPremiumDemo />;
  return <Component {...pageProps} />;
}
