// react-web/src/ContactForm.jsx

import React, { useState, useEffect } from "react";
import PhoneInput from "./PhoneInput";
import MapAddress from "./MapAddress";
import AddressSearch from "./AddressSearch";
import CAPtcha from "./CAPtcha"; 
import VerifiedIcon from "@mui/icons-material/Verified";
import NotInterestedIcon from "@mui/icons-material/NotInterested";

function ContactForm({ addContact, initialAddress, onAddressSelect }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [phoneResetKey, setPhoneResetKey] = useState(0);

  // For Email OTP
  const [emailOtpRequested, setEmailOtpRequested] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpVerified, setEmailOtpVerified] = useState(false);
  const [emailOtpError, setEmailOtpError] = useState("");
  const [emailResendTimer, setEmailResendTimer] = useState(0);
  const [emailAttempts, setEmailAttempts] = useState(0);
  const [emailLockout, setEmailLockout] = useState(false);

  // For Phone OTP
  const [phoneOtpVerified, setPhoneOtpVerified] = useState(false);

  // Address/map
  const [address, setAddress] = useState(initialAddress || "");
  const [showMap, setShowMap] = useState(false);
  const [isAddressValid, setIsAddressValid] = useState(false);

  // key forces AddressSearch to re-mount on reset
  const [addressKey, setAddressKey] = useState(0);

  // For CAPTCHA
  const [showCaptcha, setShowCaptcha] = useState(true);
  const [isHumanVerified, setIsHumanVerified] = useState(false);

  // Validation state
  const [showErrors, setShowErrors] = useState(false);

  // Email OTP Timer Effect
  useEffect(() => {
    if (emailResendTimer > 0) {
      const timer = setTimeout(() => setEmailResendTimer(emailResendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [emailResendTimer]);

  useEffect(() => {
    if (initialAddress) setAddress(initialAddress);
  }, [initialAddress]);

  // Handle address selection from search
  const handleAddressSelect = (selectedAddress) => {
    setAddress(selectedAddress);
    setIsAddressValid(true);
    if (onAddressSelect) {
      onAddressSelect(selectedAddress);
    }
  };

  // Handle address selection from map
  const handleMapSelect = (selectedAddress) => {
    setAddress(selectedAddress);
    setIsAddressValid(true);
    setShowMap(false);
    if (onAddressSelect) {
      onAddressSelect(selectedAddress);
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    return name && phone && email && address && isAddressValid && isHumanVerified;
  };

  // ---------------- Email OTP ----------------
  const requestEmailOtp = async () => {
    if (emailLockout) return;
    
    try {
      const res = await fetch("http://localhost:5000/request-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailOtpRequested(true);
        setEmailOtpError("");
        
        // Timer logic
        const newAttempts = emailAttempts + 1;
        setEmailAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          setEmailLockout(true);
          setEmailResendTimer(300); // 5 minutes
          setTimeout(() => {
            setEmailLockout(false);
            setEmailAttempts(0);
          }, 300000);
        } else {
          setEmailResendTimer(20); // 20 seconds
        }
        
        alert("OTP for Email sent to your inbox!");
      } else {
        setEmailOtpError(data.error);
      }
    } catch (err) {
      setEmailOtpError("Failed to request OTP");
    }
  };

  const verifyEmailOtp = async () => {
    try {
      const res = await fetch("http://localhost:5000/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: emailOtp }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailOtpVerified(true);
        setEmailOtpError("");
        setEmailResendTimer(0);
        setEmailAttempts(0);
        setEmailLockout(false);
        alert("Email verified!");
      } else {
        setEmailOtpError(data.error);
      }
    } catch (err) {
      setEmailOtpError("Failed to verify OTP");
    }
  };

  // ---------------- Submit ----------------
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      setShowErrors(true);
      return;
    }

    // Now add the contact
    addContact({ 
      name, 
      phone, 
      email, 
      address,
      phoneVerified: phoneOtpVerified,
      emailVerified: emailOtpVerified 
    });

    // Reset only after adding a contact
    setPhone("");
    setPhoneOtpVerified(false);
    setPhoneResetKey((k) => k + 1);

    // Reset all
    setName("");
    setEmail("");
    setAddress("");
    setEmailOtp("");
    setEmailOtpRequested(false);
    setEmailOtpVerified(false);
    setIsHumanVerified(false);
    setShowCaptcha(true);
    setIsAddressValid(false);
    setAddressKey(k => k + 1);
    setShowErrors(false);
    setEmailResendTimer(0);
    setEmailAttempts(0);
    setEmailLockout(false);

    if (onAddressSelect) {
      onAddressSelect("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="contact-form">
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={showErrors && !name ? "input-error" : ""}
      />

      {/* Phone field */}
      <PhoneInput 
        key={phoneResetKey}
        value={phone} 
        onChange={setPhone} 
        email={email}
        onVerified={setPhoneOtpVerified}
        disabled={phoneOtpVerified}
      />

      {/* Email field */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          pattern="^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
          onChange={(e) => setEmail(e.target.value)}
          disabled={emailOtpRequested}
          style={{ flex: 1 }}
          className={showErrors && !email ? "input-error" : ""}
        />
        {email && !emailOtpVerified && <NotInterestedIcon color="error" />}
        {emailOtpVerified && <VerifiedIcon color="success" />}

        {!emailOtpVerified && (
          <button 
            type="button" 
            onClick={requestEmailOtp}  
            className="action-btn"
            disabled={!email || emailResendTimer > 0 || emailLockout}
          >
            {emailOtpRequested ? (
              emailLockout ? `Locked (${Math.floor(emailResendTimer/60)}:${(emailResendTimer%60).toString().padStart(2, '0')})` :
              emailResendTimer > 0 ? `Resend (${emailResendTimer}s)` : "Resend"
            ) : "Verify"}
          </button>
        )}
      </div>

      {emailOtpRequested && !emailOtpVerified && (
        <>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Enter Email OTP"
              value={emailOtp}
              onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              style={{ flex: 1 }}
            />
            <button type="button" onClick={verifyEmailOtp} className="action-btn">
              Verify OTP
            </button>
          </div>
          {emailOtpError && (
            <p style={{ color: "red", marginTop: "4px" }}>{emailOtpError}</p>
          )}
          {emailAttempts > 0 && (
            <p style={{ fontSize: "0.9rem", color: "#666", marginTop: "4px" }}>
              Attempts: {emailAttempts}/3 {emailLockout && "- 5min lockout active"}
            </p>
          )}
        </>
      )}

      {/* Rest of the component remains the same */}
      {/* Address section */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Address:
        </label>
        
        <AddressSearch 
          key={addressKey}
          onAddressSelect={handleAddressSelect}
          currentAddress={address}
        />
        
        <button 
          type="button" 
          onClick={() => setShowMap((prev) => !prev)}
          className="action-btn"
          style={{ marginTop: '10px', width: '100%' }}
        >
          {showMap ? "Close Map" : "Open Map to Select Location"}
        </button>
      </div>

      {showMap && (
        <MapAddress
          onSelect={handleMapSelect}
          switchToContacts={() => setShowMap(false)}
          initialAddress={address}
        />
      )}

      {showCaptcha && (
        <CAPtcha 
          onVerify={() => {
            setIsHumanVerified(true);
            setShowCaptcha(false);
          }} 
          onCancel={() => {
            setIsHumanVerified(false);
            setShowCaptcha(false);
          }}
          inline={true}
        />
      )}

      {isHumanVerified && (
        <p style={{ color: 'green', margin: '10px 0' }}>
          ✓ CAPTCHA verified - You can now add the contact
        </p>
      )}

      <button 
        type="submit" 
        className="save-btn"
        style={{ width: '100%' }}
        disabled={!isFormValid()}
      >
        Add Contact
      </button>
    </form>
  );
}

export default ContactForm;

