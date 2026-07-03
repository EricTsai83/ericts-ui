"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { OTPInput, type OTPStatus } from "@/registry/base/ui/otp-input";

const demoValidOtp = "248917";
const demoExpiredOtp = "123456";
const maxOtpAttempts = 3;

export default function Preview() {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<OTPStatus>("idle");
  const [attemptsLeft, setAttemptsLeft] = useState(maxOtpAttempts);
  const [isVerifying, setIsVerifying] = useState(false);
  const verificationTimer = useRef<number | null>(null);
  const isLocked = attemptsLeft === 0;

  useEffect(() => {
    return () => {
      if (verificationTimer.current) {
        window.clearTimeout(verificationTimer.current);
      }
    };
  }, []);

  const clearVerificationTimer = () => {
    if (!verificationTimer.current) return;

    window.clearTimeout(verificationTimer.current);
    verificationTimer.current = null;
  };

  const verify = (code: string) => {
    if (isVerifying || isLocked || status === "success") return;

    clearVerificationTimer();
    setIsVerifying(true);
    setStatus("idle");

    verificationTimer.current = window.setTimeout(() => {
      verificationTimer.current = null;
      setIsVerifying(false);

      if (code === demoValidOtp) {
        setStatus("success");
        return;
      }

      setValue("");
      setAttemptsLeft((current) => Math.max(current - 1, 0));
      setStatus("error");
    }, 650);
  };

  const pasteCode = (code: string) => {
    if (isVerifying || isLocked || status === "success") return;

    setValue(code);
    verify(code);
  };

  const reset = () => {
    clearVerificationTimer();
    setValue("");
    setStatus("idle");
    setAttemptsLeft(maxOtpAttempts);
    setIsVerifying(false);
  };

  const attemptsMessage =
    attemptsLeft === 1
      ? "1 attempt remaining."
      : `${attemptsLeft} attempts remaining.`;
  const errorMessage =
    attemptsLeft > 0
      ? `Code expired. ${attemptsMessage}`
      : "Code expired. No attempts remaining.";

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4">
      <OTPInput
        label="Security code"
        value={value}
        onChange={(nextValue) => {
          setValue(nextValue);
          if (status === "error") {
            setStatus("idle");
          }
        }}
        onComplete={verify}
        status={status}
        disabled={isVerifying || isLocked}
        errorMessage={errorMessage}
      />

      <div
        role="group"
        aria-label="OTP demo actions"
        className="flex flex-wrap justify-center gap-2"
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isVerifying || isLocked || status === "success"}
          onClick={() => pasteCode(demoValidOtp)}
        >
          Paste valid code
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isVerifying || isLocked || status === "success"}
          onClick={() => pasteCode(demoExpiredOtp)}
        >
          Paste expired code
        </Button>
        {status === "success" || isLocked ? (
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            Reset
          </Button>
        ) : null}
      </div>
    </div>
  );
}
