// react-web/src/App.jsx

import React, { useState, useEffect } from "react";
import ContactForm from "./ContactForm";
import ContactList from "./ContactList";
import { saveContactsAsXML } from "./xmlUtils";
import MapAddress from "./MapAddress";
import "./styles.css";
import { FaMoon, FaSun, FaDownload, FaUsers, FaPlus, FaSync } from "react-icons/fa";
import paul_lichtblau_unsplash from "./assets/dark/paul_lichtblau_unsplash.jpg";
import rasmus from "./assets/light/rasmus.jpg";

function App() {
  const [contacts, setContacts] = useState([]);
  const [activeTab, setActiveTab] = useState("contacts");
  const [activeSection, setActiveSection] = useState("addressBook");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Preload dark/light mode image
  useEffect(() => {
    const darkImg = new Image();
    darkImg.src = paul_lichtblau_unsplash;
    const lightImg = new Image();
    lightImg.src = rasmus;
  }, []);

  // Fetch contacts from backend when app loads
  useEffect(() => {
    fetchContacts();
  }, []);

  // Function to fetch contacts from backend
  const fetchContacts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5000/contacts");
      if (!res.ok) {
        throw new Error(`Failed to fetch contacts: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setContacts(data);
      console.log("Loaded contacts from backend:", data.length);
    } catch (err) {
      console.error("Failed to fetch contacts:", err);
      setError("Failed to load contacts. Please check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

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

      // Refresh the contact list from backend
      await fetchContacts();
      
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

  // Function to delete a contact
  const deleteContact = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/contacts/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete contact");
      }

      // Refresh the contact list from backend
      await fetchContacts();
    } catch (err) {
      console.error("Error deleting contact:", err);
      alert("Failed to delete contact. Please try again.");
    }
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
                  <div className="badge-with-refresh">
                    <button 
                      className="contacts-badge clickable-badge"
                      onClick={goToSavedContacts}
                      title="View Saved Contacts"
                    >
                      <FaUsers className="badge-icon" />
                      <span className="badge-count">{contacts.length}</span>
                    </button>
                    <button
                      className="refresh-btn"
                      onClick={fetchContacts}
                      title="Refresh Contacts"
                      disabled={loading}
                    >
                      <FaSync className={loading ? "spin" : ""} />
                    </button>
                  </div>
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

              {/* Loading indicator */}
              {loading && (
                <div className="loading-indicator">
                  <FaSync className="spin" /> Loading contacts...
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="error-message">
                  <p>{error}</p>
                  <button onClick={fetchContacts} className="retry-btn">
                    Retry
                  </button>
                </div>
              )}

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
                  Saved Contacts ({contacts.length})
                </h1>
                
                <div className="header-buttons">
                  <button
                    className="icon-btn"
                    onClick={fetchContacts}
                    title="Refresh Contacts"
                    disabled={loading}
                  >
                    <FaSync className={loading ? "spin" : ""} />
                  </button>
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

              {/* Loading indicator */}
              {loading && (
                <div className="loading-indicator">
                  <FaSync className="spin" /> Loading contacts...
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="error-message">
                  <p>{error}</p>
                  <button onClick={fetchContacts} className="retry-btn">
                    Retry
                  </button>
                </div>
              )}

              {!loading && !error && contacts.length > 0 ? (
                <>
                  <div className="contacts-grid-container">
                    <ContactList 
                      contacts={contacts} 
                      cardView={true} 
                      onDeleteContact={deleteContact}
                    />
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
              ) : !loading && !error ? (
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
              ) : null}
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
          initialAddress={selectedAddress}
          key={selectedAddress}
        />
      )}
    </div>
  );
}

export default App;

