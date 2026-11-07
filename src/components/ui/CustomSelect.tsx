"use client";

import React, { useState, useRef, useEffect, useCallback, useId } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Loader2 } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: "zinc" | "blue" | "purple" | "amber" | "emerald" | "rose";
  dotColor?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "badge" | "subtle";
  colorTheme?: "zinc" | "blue" | "purple" | "amber" | "emerald" | "rose" | "auto";
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  menuWidth?: number | string;
  align?: "left" | "right";
  icon?: React.ReactNode;
  id?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  size = "md",
  variant = "default",
  colorTheme = "auto",
  isLoading = false,
  disabled = false,
  className = "",
  menuWidth,
  align = "left",
  icon,
  id,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  // Selected Option
  const selectedOption = options.find((opt) => opt.value === value);

  // Active theme color
  const activeColor =
    colorTheme === "auto"
      ? selectedOption?.badgeColor || "zinc"
      : colorTheme;

  // Position state for floating portal
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    placement: "bottom" | "top";
  }>({
    top: 0,
    left: 0,
    width: 0,
    placement: "bottom",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate coordinates relative to viewport
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = Math.min(options.length * 44 + 20, 280);
    const spaceBelow = window.innerHeight - rect.bottom;
    const placement = spaceBelow < dropdownHeight && rect.top > dropdownHeight ? "top" : "bottom";

    let calculatedWidth: number;
    if (typeof menuWidth === "number") {
      calculatedWidth = menuWidth;
    } else if (typeof menuWidth === "string" && menuWidth.endsWith("px")) {
      calculatedWidth = parseFloat(menuWidth);
    } else if (menuWidth === "100%") {
      calculatedWidth = rect.width;
    } else {
      calculatedWidth = size === "sm" ? Math.max(rect.width, 210) : Math.max(rect.width, 240);
    }

    let calculatedLeft = align === "right" ? rect.right - calculatedWidth : rect.left;

    // Viewport bounds clamping
    if (calculatedLeft + calculatedWidth > window.innerWidth - 12) {
      calculatedLeft = window.innerWidth - calculatedWidth - 12;
    }
    if (calculatedLeft < 12) {
      calculatedLeft = 12;
    }

    setCoords({
      top: placement === "bottom" ? rect.bottom + 6 : rect.top - 6,
      left: calculatedLeft,
      width: calculatedWidth,
      placement,
    });
  }, [align, menuWidth, options.length, size]);

  // Click outside and scroll listener
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleScrollOrResize = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        setIsOpen(false);
      } else {
        updatePosition();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("scroll", handleScrollOrResize, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  // Keyboard navigation within menu
  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex((opt) => opt.value === value);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, options, value]);

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || isLoading) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        let next = prev + 1;
        while (next < options.length && options[next].disabled) next++;
        return next < options.length ? next : prev;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        let next = prev - 1;
        while (next >= 0 && options[next].disabled) next--;
        return next >= 0 ? next : prev;
      });
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < options.length) {
        const option = options[highlightedIndex];
        if (!option.disabled) {
          onChange(option.value);
          setIsOpen(false);
          triggerRef.current?.focus();
        }
      }
    } else if (e.key === "Tab") {
      setIsOpen(false);
    }
  };

  // Trigger size styles
  const sizeStyles = {
    sm: "px-2.5 py-1 text-[11px] font-mono rounded-lg",
    md: "px-3 py-2 text-xs font-mono rounded-xl",
    lg: "px-3.5 py-2.5 text-xs font-mono rounded-xl",
  }[size];

  // Badge theme colors
  const badgeThemeClasses: Record<string, string> = {
    zinc: "border-white/[0.08] bg-zinc-900/90 text-zinc-300 hover:bg-zinc-800 hover:border-white/20",
    blue: "border-blue-500/30 bg-blue-950/40 text-blue-200 hover:bg-blue-900/50 hover:border-blue-500/50",
    purple: "border-purple-500/30 bg-purple-950/40 text-purple-200 hover:bg-purple-900/50 hover:border-purple-500/50",
    amber: "border-amber-500/30 bg-amber-950/40 text-amber-200 hover:bg-amber-900/50 hover:border-amber-500/50",
    emerald: "border-emerald-500/30 bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900/50 hover:border-emerald-500/50",
    rose: "border-rose-500/30 bg-rose-950/40 text-rose-200 hover:bg-rose-900/50 hover:border-rose-500/50",
  };
  const activeBadgeClass = badgeThemeClasses[activeColor] || badgeThemeClasses.zinc;

  // Trigger style composition
  const triggerVariantClasses =
    variant === "badge"
      ? `border font-semibold transition-all ${activeBadgeClass}`
      : `border border-white/[0.08] bg-zinc-950/90 text-zinc-200 hover:border-white/20 hover:bg-zinc-900/90 transition-all`;

  const openFocusClasses = isOpen
    ? "border-blue-500/60 ring-1 ring-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
    : "focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20";

  return (
    <>
      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        disabled={disabled || isLoading}
        onClick={() => {
          if (!disabled && !isLoading) {
            updatePosition();
            setIsOpen((prev) => !prev);
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`group relative inline-flex items-center justify-between gap-2 text-left select-none transition-all duration-150 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${sizeStyles} ${triggerVariantClasses} ${openFocusClasses} ${className}`}
      >
        <span className="flex items-center gap-2 truncate">
          {icon && <span className="shrink-0 text-zinc-400">{icon}</span>}

          {/* Color indicator dot if present */}
          {selectedOption?.dotColor && (
            <span
              className={`h-1.5 w-1.5 rounded-full shrink-0 transition-transform ${selectedOption.dotColor}`}
            />
          )}

          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>

        <span className="shrink-0 flex items-center ml-1">
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
          ) : (
            <ChevronDown
              className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 group-hover:text-zinc-200 ${
                isOpen ? "rotate-180 text-blue-400" : ""
              }`}
            />
          )}
        </span>
      </button>

      {/* Floating Dropdown Menu via Portal */}
      {mounted &&
        isOpen &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            tabIndex={-1}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: coords.width,
              transform: coords.placement === "top" ? "translateY(-100%)" : "translateY(0)",
              zIndex: 9999,
            }}
            className="rounded-2xl border border-white/10 bg-[#0c0f17]/95 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_1px_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto space-y-0.5 custom-scrollbar">
              {options.map((option, index) => {
                const isSelected = option.value === value;
                const isHighlighted = highlightedIndex === index;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    onClick={() => {
                      if (!option.disabled) {
                        onChange(option.value);
                        setIsOpen(false);
                        triggerRef.current?.focus();
                      }
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-left text-xs transition-all duration-100 font-mono ${
                      option.disabled
                        ? "opacity-40 cursor-not-allowed"
                        : isSelected
                        ? "bg-blue-600/15 text-blue-200 font-semibold"
                        : isHighlighted
                        ? "bg-white/[0.06] text-white"
                        : "text-zinc-300 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {/* Dot or Icon */}
                      {option.dotColor ? (
                        <span
                          className={`h-2 w-2 rounded-full shrink-0 ${option.dotColor}`}
                        />
                      ) : option.icon ? (
                        <span className="shrink-0 text-zinc-400">{option.icon}</span>
                      ) : null}

                      <span className="truncate">{option.label}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Price / Sublabel tag */}
                      {option.sublabel && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md border font-mono ${
                            isSelected
                              ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                              : "bg-white/[0.04] text-zinc-400 border-white/[0.06]"
                          }`}
                        >
                          {option.sublabel}
                        </span>
                      )}

                      {/* Checkmark indicator */}
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
