// react-web/src/NumberInput.jsx

import React from "react";

function NumberInput({ value, onChange, maxLength, placeholder }) {
  const handleChange = (e) => {
    // Keep only digits, truncate to maxLength
    const digits = e.target.value.replace(/\D/g, "").slice(0, maxLength);
    onChange(digits);
  };

  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      maxLength={maxLength}
    />
  );
}

export default NumberInput;