//  react-web/src/ContactList.jsx

import React from "react";

function ContactList({ contacts, cardView = false }) {
  if (!contacts || contacts.length === 0) {
    return <p>No contacts available. Double-tap "Address Book" to add some.</p>;
  }

  // Card view layout
  if (cardView) {
    return (
      <div className="saved-contacts-block">
        {contacts.map((contact, index) => (
          <div className="contact-card" key={index}>
            <p><strong>Name:</strong> {contact.name}</p>
            <p><strong>Email:</strong> {contact.email}{" "}
                <span className={`verification-icon ${contact.emailVerified ? "verified" : "not-verified"}`}>
                  {contact.emailVerified ? "✔" : "✖"}
                </span>
            </p>
            <p><strong>Phone:</strong> {contact.phone}{" "}
                <span className={`verification-icon ${contact.phoneVerified ? "verified" : "not-verified"}`}>
                  {contact.phoneVerified ? "✔" : "✖"}
                </span>
            </p>
            {contact.address && <p><strong>Address:</strong> {contact.address}</p>}
          </div>
        ))}
      </div>
    );
  }

  // Default table view
  return (
    <div className="contact-list">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Address</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact, index) => (
            <tr key={index}>
              <td>{contact.name}</td>
              <td>
                {contact.email}{" "}
                <span className={`verification-icon ${contact.emailVerified ? "verified" : "not-verified"}`}>
                  {contact.emailVerified ? "✔" : "✖"}
                </span>
              </td>
              <td>
                {contact.phone}{" "}
                <span className={`verification-icon ${contact.phoneVerified ? "verified" : "not-verified"}`}>
                  {contact.phoneVerified ? "✔" : "✖"}
                </span>
              </td>
              <td>{contact.address}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ContactList;