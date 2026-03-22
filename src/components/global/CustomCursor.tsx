"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useMotionValue, useSpring } from "framer-motion";

export const CustomCursor = () => {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  const [isHovering, setIsHovering] = useState(false);
  const [isHoveringText, setIsHoveringText] = useState(false);
  
  // Custom cursor is only for desktop devices that support hover
  const [isTouchDevice, setIsTouchDevice] = useState(true);

  useEffect(() => {
    const matchMedia = window.matchMedia("(hover: hover) and (pointer: fine)");
    setIsTouchDevice(!matchMedia.matches);
    const handleChange = () => setIsTouchDevice(!matchMedia.matches);
    matchMedia.addEventListener("change", handleChange);
    return () => matchMedia.removeEventListener("change", handleChange);
  }, []);

  // Toggle body class — cursor:none only applies on website pages
  useEffect(() => {
    if (!isDashboard && !isTouchDevice) {
      document.body.classList.add("website-cursor");
    } else {
      document.body.classList.remove("website-cursor");
    }
    return () => document.body.classList.remove("website-cursor");
  }, [isDashboard, isTouchDevice]);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    if (isTouchDevice) return;

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive = 
        target.tagName.toLowerCase() === "a" ||
        target.tagName.toLowerCase() === "button" ||
        target.closest("a") !== null ||
        target.closest("button") !== null ||
        target.getAttribute("role") === "button";
      const isText = ["p","h1","h2","h3","h4","h5","h6","span"].includes(target.tagName.toLowerCase());
      setIsHovering(isInteractive);
      setIsHoveringText(isText && !isInteractive);
    };

    window.addEventListener("mousemove", moveCursor);
    document.addEventListener("mouseover", handleMouseOver);
    return () => {
      window.removeEventListener("mousemove", moveCursor);
      document.removeEventListener("mouseover", handleMouseOver);
    };
  }, [cursorX, cursorY, isTouchDevice]);

  // Don't render on dashboard or touch devices
  if (isTouchDevice || isDashboard) return null;

  return (
    <motion.div
      className="fixed pointer-events-none z-50 rounded-full bg-accent mix-blend-difference"
      style={{
        x: cursorXSpring,
        y: cursorYSpring,
        translateX: "-50%",
        translateY: "-50%",
      }}
      animate={{
        width: isHovering ? 48 : isHoveringText ? 4 : 16,
        height: isHovering ? 48 : isHoveringText ? 24 : 16,
        opacity: 0.8,
        borderRadius: isHoveringText ? "2px" : "50%",
      }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    />
  );
};
