"use client";

import { useEffect, useState, useRef } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";

interface CodeBlockProps extends React.ComponentProps<"div"> {
  code: string;
  lang: string;
  theme?: "light" | "dark";
  themes?: { light: string; dark: string };
  writing?: boolean;
  duration?: number;
  delay?: number;
  onDone?: () => void;
  onWrite?: (info: { index: number; length: number; done: boolean }) => void;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  inView?: boolean;
  inViewMargin?: string;
  inViewOnce?: boolean;
}

export function CodeBlock({
  code,
  lang,
  theme = "dark",
  themes,
  writing = false,
  duration = 5000,
  delay = 0,
  onDone,
  onWrite,
  scrollContainerRef,
  inView: inViewProp,
  inViewMargin = "0px",
  inViewOnce = true,
  className,
  ...props
}: CodeBlockProps) {
  const [displayedCode, setDisplayedCode] = useState(writing ? "" : code);
  const [isWriting, setIsWriting] = useState(writing);
  const codeRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (inViewProp !== undefined) {
      setIsInView(inViewProp);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (inViewOnce) {
            observer.disconnect();
          }
        } else if (!inViewOnce) {
          setIsInView(false);
        }
      },
      { rootMargin: inViewMargin }
    );

    if (codeRef.current) {
      observer.observe(codeRef.current);
    }

    return () => observer.disconnect();
  }, [inViewProp, inViewMargin, inViewOnce]);

  const shouldAnimate = isInView;

  useEffect(() => {
    if (!writing || !shouldAnimate) {
      setDisplayedCode(code);
      setIsWriting(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsWriting(true);
      const totalChars = code.length;
      const startTime = Date.now();
      const endTime = startTime + duration;

      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentIndex = Math.floor(progress * totalChars);

        setDisplayedCode(code.slice(0, currentIndex));

        if (onWrite) {
          onWrite({
            index: currentIndex,
            length: totalChars,
            done: currentIndex >= totalChars,
          });
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsWriting(false);
          if (onDone) {
            onDone();
          }
        }
      };

      requestAnimationFrame(animate);
    }, delay);

    return () => clearTimeout(timer);
  }, [code, writing, duration, delay, shouldAnimate, onDone, onWrite]);

  const styleMap: Record<string, any> = {
    light: oneLight,
    dark: oneDark,
    ...themes,
  };

  const selectedTheme = styleMap[theme] || styleMap.dark;

  return (
    <div
      ref={codeRef}
      className={cn("relative code-block-wrapper", className)}
      {...props}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .code-block-wrapper pre,
        .code-block-wrapper code {
          white-space: pre-wrap !important;
          word-break: break-all !important;
          overflow-wrap: anywhere !important;
        }
      `,
        }}
      />
      <SyntaxHighlighter
        language={lang}
        style={selectedTheme}
        customStyle={{
          margin: 0,
          padding: "1rem",
          borderRadius: "0.5rem",
          fontSize: "0.875rem",
          lineHeight: "1.5",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          overflowWrap: "anywhere",
        }}
        showLineNumbers={false}
        PreTag="pre"
        CodeTag="code"
      >
        {displayedCode}
      </SyntaxHighlighter>
      {isWriting && <span className="animate-pulse ml-1">|</span>}
    </div>
  );
}
