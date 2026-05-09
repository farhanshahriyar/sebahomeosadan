"use client";
import { useEffect } from "react";

export default function ContentProtection() {
  useEffect(() => {
    // Prevent right click
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    // Prevent copy
    const handleCopy = (e) => {
      e.preventDefault();
    };

    // Prevent keyboard shortcuts (Ctrl+C, Ctrl+A, Ctrl+U, Ctrl+P, Ctrl+S)
    const handleKeyDown = (e) => {
      if (
        e.ctrlKey &&
        (e.key === "c" ||
          e.key === "C" ||
          e.key === "a" ||
          e.key === "A" ||
          e.key === "u" ||
          e.key === "U" ||
          e.key === "p" ||
          e.key === "P" ||
          e.key === "s" ||
          e.key === "S")
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
}
