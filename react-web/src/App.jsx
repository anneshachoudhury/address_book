// react-web/src/App.jsx

import React, { useState, useEffect } from "react";
import ContactForm from "./ContactForm";
import ContactList from "./ContactList";
import { saveContactsAsXML } from "./xmlUtils";
import MapAddress from "./MapAddress";
import "./styles.css";
import { FaMoon, FaSun, FaDownload, FaUsers, FaPlus } from "react-icons/fa";
import paul_lichtblau_unsplash from "./assets/dark/paul_lichtblau_unsplash.jpg";
import rasmus from "./assets/light/rasmus.jpg";

function App() {
  const [contacts, setContacts] = useState([]);
  const [activeTab, setActiveTab] = useState("contacts");
  const [activeSection, setActiveSection] = useState("addressBook");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  // Preload dark/light mode image
  useEffect(() => {
    const darkImg = new Image();
    darkImg.src = paul_lichtblau_unsplash;
    const lightImg = new Image();
    lightImg.src = rasmus;
  }, []);

  const addContact = async (contact) => {
    try {
      const res = await fetch("http://localhost:5000/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contact),
      });

      if (!res.ok) {
        throw new Error("Failed to save contact to server");
      }

      const result = await res.json();
      console.log("Contact saved to MongoDB:", result);

      // Only update local state after successful save
      setContacts([...contacts, contact]);
      setSelectedAddress("");
    } catch (err) {
      console.error("Error saving contact:", err);
      alert("Failed to save contact. Please try again.");
    }
  };

  const handleSave = () => {
    saveContactsAsXML(contacts);
  };

  const toggleTheme = () => setDarkMode(!darkMode);

  const goToSavedContacts = () => {
    setActiveSection("savedContacts");
  };

  const goToAddressBook = () => {
    setActiveSection("addressBook");
  };

  return (
    <div
      className={`app-wrapper ${darkMode ? "dark-mode" : ""}`}
      style={{
        backgroundImage: `url(${darkMode ? paul_lichtblau_unsplash : rasmus})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        minHeight: "100vh",
      }}
    >
      {activeTab === "contacts" && (
        <div className="contacts-layout">
          {/* ---- Address Book Block ---- */}
          {activeSection === "addressBook" && (
            <div className="address-book-block">
              {/* Header Row - Title + Buttons */}
              <div className="address-book-header">
                <div className="title-with-badge">
                  <h1 className="app-title" style={{ margin: 0 }}>
                    Address Book
                  </h1>
                  <button 
                    className="contacts-badge clickable-badge"
                    onClick={goToSavedContacts}
                    title="View Saved Contacts"
                  >
                    <FaUsers className="badge-icon" />
                    <span className="badge-count">{contacts.length}</span>
                  </button>
                </div>
                
                <div className="header-buttons">
                  {contacts.length > 0 && (
                    <button
                      className="icon-btn"
                      onClick={handleSave}
                      title="Save as XML"
                    >
                      <FaDownload />
                    </button>
                  )}
                  <button
                    className="icon-btn"
                    onClick={toggleTheme}
                    title="Toggle Theme"
                  >
                    {darkMode ? <FaSun /> : <FaMoon />}
                  </button>
                </div>
              </div>

              <ContactForm
                addContact={addContact}
                initialAddress={selectedAddress}
                onAddressSelect={(selectedAddress) => {
                  setSelectedAddress(selectedAddress);
                }}
              />
            </div>
          )}

          {/* ---- Saved Contacts Block ---- */}
          {activeSection === "savedContacts" && (
            <div className="saved-contacts-section">
              <div className="saved-contacts-header">
                <h1 className="app-title" style={{ margin: 0 }}>
                  Saved Contacts
                </h1>
                
                <div className="header-buttons">
                  {contacts.length > 0 && (
                    <button
                      className="icon-btn"
                      onClick={handleSave}
                      title="Save as XML"
                    >
                      <FaDownload />
                    </button>
                  )}
                  <button
                    className="icon-btn"
                    onClick={toggleTheme}
                    title="Toggle Theme"
                  >
                    {darkMode ? <FaSun /> : <FaMoon />}
                  </button>
                </div>
              </div>

              {contacts.length > 0 ? (
                <>
                  <div className="contacts-grid-container">
                    <ContactList contacts={contacts} cardView={true} />
                  </div>
                  {/* Add More button below the cards */}
                  <div className="add-more-container">
                    <button 
                      className="add-more-btn centered"
                      onClick={goToAddressBook}
                      title="Add More Contacts"
                    >
                      <FaPlus className="btn-icon" />
                      Add More
                    </button>
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <p className="no-contacts-message">
                    No contacts saved yet.
                  </p>
                  <button 
                    className="add-more-btn centered"
                    onClick={goToAddressBook}
                  >
                    <FaPlus className="btn-icon" />
                    Add Your First Contact
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MapAddress component*/}
      {activeTab === "map" && (
        <MapAddress
          onSelect={(addr, pos) => {
            setSelectedAddress(addr);
            setActiveTab("contacts");
          }}
          initialAddress={selectedAddress} // Make sure this is passed
          key={selectedAddress} // Add this key to force re-render when address changes
        />
      )}
    </div>
  );
}

export default App;