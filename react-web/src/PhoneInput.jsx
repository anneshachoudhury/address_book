// react-web/src/PhoneInput.jsx

import React, { useState, useEffect } from "react";
import { allCountries } from "country-telephone-data";
import VerifiedIcon from "@mui/icons-material/Verified";
import NotInterestedIcon from "@mui/icons-material/NotInterested";

function PhoneInput({ value, onChange, email, onVerified, resetTrigger }) {
  const [countryCode, setCountryCode] = useState("+91");

  // OTP-related state
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [message, setMessage] = useState("");
  
  // Timer + attempt state
  const [resendTimer, setResendTimer] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [lockout, setLockout] = useState(false);

  // Timer Effect
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // reset attempts after cooldown
      if (!lockout) setAttempts(0);
    }
  }, [resendTimer, lockout]);

  // Keep parent informed if otpVerified flips
  useEffect(() => {
    onVerified(otpVerified);
  }, [otpVerified, onVerified]);

  // Only clear UI fields, don't nuke verification
  useEffect(() => {
    setOtp("");
    setOtpSent(false);
    setMessage("");
    setResendTimer(0);
    setAttempts(0);
    setLockout(false);
  }, [resetTrigger]);

  // Sort countries alphabetically by name and ensure + sign
  const sortedCountries = allCountries
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((country) => ({
      ...country,
      dialCode: country.dialCode.startsWith("+")
        ? country.dialCode
        : `+${country.dialCode}`,
    }));

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    onChange(`${countryCode}${digits}`);
  };

  const handleCountryChange = (e) => {
    const newCountryCode = e.target.value;
    setCountryCode(newCountryCode);
    onChange(`${newCountryCode}${value}`);
  };

  // Request OTP for phone verification
  // Request OTP for phone verification
  const requestPhoneOtp = async () => {
    if (!email) {
      setMessage("Please enter your email first.");
      return;
    }
    
    if (lockout) return;
    if (resendTimer > 0) {
      setMessage("Wait before resending OTP");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/request-phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setMessage("");
        
        // Set timer based on server response
        const isLocked = data.lockout || data.attempts >= 3;
        const timerDuration = isLocked ? 300 : 20; // 5 min or 20 sec
        
        setResendTimer(timerDuration);
        setAttempts(data.attempts || attempts + 1);
      
        if (isLocked) {
          setLockout(true);
          setTimeout(() => {
            setLockout(false);
            setAttempts(0);
          }, 300000);
        }
        
        alert("OTP for Phone sent to your mail!"); 
      } else {
        setMessage(data.error || "Failed to send OTP.");
      }

    } catch (err) {
      setMessage("Error requesting OTP.");
    }
  };

  // Verify OTP for phone
  const verifyPhoneOtp = async () => {
    try {
      const res = await fetch("http://localhost:5000/verify-phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpVerified(true);
        setMessage("");
        setResendTimer(0);
        setAttempts(0);
        setLockout(false);
        alert("Phone verified!");
      } else {
        setMessage(data.error || "Invalid OTP.");
        setOtpVerified(false);
      }
    } catch (err) {
      setMessage("Error verifying OTP.");
      setOtpVerified(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Phone number + country code + Send OTP / Verified */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Country code select */}
          <select
            className="phone-code-select"
            value={countryCode}
            onChange={handleCountryChange}
            style={{ padding: "8px", borderRadius: "4px", width: "60px" }}
          >
            {sortedCountries.map((country) => (
              <option key={country.iso2} value={country.dialCode}>
                {countryCode === country.dialCode ? country.dialCode : `${country.name} (${country.dialCode})`}
              </option>
            ))}
          </select>

          {/* Phone number input */}
          <input
            type="text"
            placeholder="Phone number"
            value={value.replace(countryCode, "")}
            onChange={handlePhoneChange}
            maxLength={10}
            disabled={otpVerified}
            style={{ flex: 1 }}
          />
          {value.replace(countryCode, "").length > 0 && !otpVerified && (
            <NotInterestedIcon color="error" />
          )}
          {otpVerified && <VerifiedIcon color="success" />}

          {/* Show Send OTP button only before otpSent */}
          {!otpVerified && (
            <button
              type="button"
              onClick={requestPhoneOtp}
              className="action-btn"
              disabled={!value.replace(countryCode, "") || resendTimer > 0 || lockout}
            >
              {otpSent ? (
                lockout ? `Locked (${Math.floor(resendTimer/60)}:${(resendTimer%60).toString().padStart(2, '0')})` :
                resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend"
              ) : "Verify"}
            </button>
          )}          
      </div>      

      {/* OTP input row */}
      {otpSent && !otpVerified && (
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "5px" }}>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
            }}
            style={{ padding: "8px", borderRadius: "5px", width: "120px" }}
          />
          <button
            type="button"
            onClick={verifyPhoneOtp}
            style={{ padding: "8px", borderRadius: "5px", cursor: "pointer" }}
          >
            Verify OTP
          </button>
        </div>
      )}      

      {message && <p style={{ color: "red", fontSize: "0.85rem", margin: "4px 0" }}>{message}</p>}
      {attempts > 0 && !otpVerified && (
        <p style={{ fontSize: "0.8rem", color: "#666", margin: "2px 0" }}>
          Attempts: {attempts}/3 {lockout && "- 5min lockout active"}
        </p>
      )}
    </div>
  );
}

export default PhoneInput;