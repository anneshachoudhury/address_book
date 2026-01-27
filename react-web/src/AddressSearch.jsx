//  react-web/src/AddressSearch.jsx

import React, { useState, useEffect } from 'react';
import './AddressSearch.css';

const AddressSearch = ({ onAddressSelect, currentAddress }) => {
  const [query, setQuery] = useState(currentAddress || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isValid, setIsValid] = useState(!!currentAddress);

  // Initialize with current address
  useEffect(() => {
    if (currentAddress) {
      setQuery(currentAddress);
      setIsValid(true);
    }
  }, [currentAddress]);

  // Fetch address suggestions
  const fetchSuggestions = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
        { headers: { 'User-Agent': 'my-contact-app (your-email@example.com)' } }
      );

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      }
    } catch (err) {
      console.error('Address search error:', err);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle input change with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle address selection
  const handleSelect = (suggestion) => {
    const displayName = suggestion.display_name;
    setQuery(displayName);
    setIsValid(true);
    setShowSuggestions(false);
    
    if (onAddressSelect) {
      onAddressSelect(displayName, {
        lat: parseFloat(suggestion.lat),
        lon: parseFloat(suggestion.lon)
      });
    }
  };

  // Handle input change
  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setIsValid(false);
    setShowSuggestions(value.length >= 3);
  };

  // Handle input click
  const handleInputClick = (e) => {
    e.stopPropagation();
    if (query.length >= 3 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSuggestions(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="address-search-container">
      <input
        type="text"
        placeholder="Type address to search..."
        value={query}
        onChange={handleChange}
        onClick={handleInputClick}
        className={`address-search-input ${isValid ? 'valid' : 'invalid'}`}
      />

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="address-suggestions" onClick={(e) => e.stopPropagation()}>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="address-suggestion-item"
              onClick={() => handleSelect(suggestion)}
              // onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
              // onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
            >
              {suggestion.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressSearch;