// react-web/src/ContactList.jsx

import React from "react";
import { FaTrash, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

function ContactList({ contacts, cardView = false, onDeleteContact }) {
  if (!contacts || contacts.length === 0) {
    return (
      <div className="empty-contacts">
        <p>No contacts available. Double-tap "Address Book" to add some.</p>
      </div>
    );
  }

  // Handle delete contact
  const handleDelete = (contactId, contactName) => {
    if (window.confirm(`Are you sure you want to delete ${contactName}?`)) {
      if (onDeleteContact) {
        onDeleteContact(contactId);
      }
    }
  };

  // Card view layout
  if (cardView) {
    return (
      <div className="saved-contacts-block">
        {contacts.map((contact) => (
          <div className="contact-card" key={contact._id || contact.email}>
            <div className="contact-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Dynamic Avatar */}
                <div className="contact-avatar">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="contact-name">{contact.name}</h3>
              </div>
              
              {onDeleteContact && (
                <button 
                  className="delete-btn"
                  onClick={() => handleDelete(contact._id, contact.name)}
                  title="Delete Contact"
                >
                  <FaTrash size={14} />
                </button>
              )}
            </div>
            
            <div className="contact-card-content">
              <div className="contact-field">
                <span className="field-label">Email:</span>
                <div className="field-value">
                  {contact.email}
                  <span className={`verification-icon ${contact.emailVerified ? "verified" : "not-verified"}`}>
                    {contact.emailVerified ? <FaCheckCircle /> : <FaTimesCircle />}
                    <span className="verification-text">
                      {contact.emailVerified ? " Verified" : " Not Verified"}
                    </span>
                  </span>
                </div>
              </div>
              
              <div className="contact-field">
                <span className="field-label">Phone:</span>
                <div className="field-value">
                  {contact.phone}
                  <span className={`verification-icon ${contact.phoneVerified ? "verified" : "not-verified"}`}>
                    {contact.phoneVerified ? <FaCheckCircle /> : <FaTimesCircle />}
                    <span className="verification-text">
                      {contact.phoneVerified ? " Verified" : " Not Verified"}
                    </span>
                  </span>
                </div>
              </div>
              
              {contact.address && (
                <div className="contact-field">
                  <span className="field-label">Address:</span>
                  <span className="field-value address-text">
                    {contact.address}
                  </span>
                </div>
              )}
            </div>
            
            {/* Display MongoDB ID for debugging */}
            {contact._id && (
              <div className="contact-id">
                <small>ID: {contact._id.substring(0, 8)}...</small>
              </div>
            )}
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
            {onDeleteContact && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact._id || contact.email}>
              <td>{contact.name}</td>
              <td>
                {contact.email}
                <span className={`verification-icon ${contact.emailVerified ? "verified" : "not-verified"}`}>
                  {contact.emailVerified ? <FaCheckCircle /> : <FaTimesCircle />}
                </span>
              </td>
              <td>
                {contact.phone}
                <span className={`verification-icon ${contact.phoneVerified ? "verified" : "not-verified"}`}>
                  {contact.phoneVerified ? <FaCheckCircle /> : <FaTimesCircle />}
                </span>
              </td>
              <td>{contact.address}</td>
              {onDeleteContact && (
                <td>
                  <button 
                    className="table-delete-btn"
                    onClick={() => handleDelete(contact._id, contact.name)}
                    title="Delete Contact"
                  >
                    <FaTrash />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ContactList;



















// // react-web/src/ContactList.jsx

// import React from "react";
// import { FaTrash, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

// function ContactList({ contacts, cardView = false, onDeleteContact }) {
//   if (!contacts || contacts.length === 0) {
//     return (
//       <div className="empty-contacts">
//         <p>No contacts available. Double-tap "Address Book" to add some.</p>
//       </div>
//     );
//   }

//   // Handle delete contact
//   const handleDelete = (contactId, contactName) => {
//     if (window.confirm(`Are you sure you want to delete ${contactName}?`)) {
//       if (onDeleteContact) {
//         onDeleteContact(contactId);
//       }
//     }
//   };

//   // Card view layout
//   if (cardView) {
//     return (
//       <div className="saved-contacts-block">
//         {contacts.map((contact) => (
//           <div className="contact-card" key={contact._id || contact.email}>
//             <div className="contact-card-header">
//               <h3 className="contact-name">{contact.name}</h3>
//               {onDeleteContact && (
//                 <button 
//                   className="delete-btn"
//                   onClick={() => handleDelete(contact._id, contact.name)}
//                   title="Delete Contact"
//                 >
//                   <FaTrash />
//                 </button>
//               )}
//             </div>
            
//             <div className="contact-card-content">
//               <div className="contact-field">
//                 <span className="field-label">Email:</span>
//                 <span className="field-value">
//                   {contact.email}
//                   <span className={`verification-icon ${contact.emailVerified ? "verified" : "not-verified"}`}>
//                     {contact.emailVerified ? <FaCheckCircle /> : <FaTimesCircle />}
//                     <span className="verification-text">
//                       {contact.emailVerified ? " Verified" : " Not Verified"}
//                     </span>
//                   </span>
//                 </span>
//               </div>
              
//               <div className="contact-field">
//                 <span className="field-label">Phone:</span>
//                 <span className="field-value">
//                   {contact.phone}
//                   <span className={`verification-icon ${contact.phoneVerified ? "verified" : "not-verified"}`}>
//                     {contact.phoneVerified ? <FaCheckCircle /> : <FaTimesCircle />}
//                     <span className="verification-text">
//                       {contact.phoneVerified ? " Verified" : " Not Verified"}
//                     </span>
//                   </span>
//                 </span>
//               </div>
              
//               {contact.address && (
//                 <div className="contact-field">
//                   <span className="field-label">Address:</span>
//                   <span className="field-value address-text">
//                     {contact.address}
//                   </span>
//                 </div>
//               )}
//             </div>
            
//             {/* Display MongoDB ID for debugging */}
//             {contact._id && (
//               <div className="contact-id">
//                 <small>ID: {contact._id.substring(0, 8)}...</small>
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     );
//   }

//   // Default table view
//   return (
//     <div className="contact-list">
//       <table>
//         <thead>
//           <tr>
//             <th>Name</th>
//             <th>Email</th>
//             <th>Phone</th>
//             <th>Address</th>
//             {onDeleteContact && <th>Actions</th>}
//           </tr>
//         </thead>
//         <tbody>
//           {contacts.map((contact) => (
//             <tr key={contact._id || contact.email}>
//               <td>{contact.name}</td>
//               <td>
//                 {contact.email}
//                 <span className={`verification-icon ${contact.emailVerified ? "verified" : "not-verified"}`}>
//                   {contact.emailVerified ? <FaCheckCircle /> : <FaTimesCircle />}
//                 </span>
//               </td>
//               <td>
//                 {contact.phone}
//                 <span className={`verification-icon ${contact.phoneVerified ? "verified" : "not-verified"}`}>
//                   {contact.phoneVerified ? <FaCheckCircle /> : <FaTimesCircle />}
//                 </span>
//               </td>
//               <td>{contact.address}</td>
//               {onDeleteContact && (
//                 <td>
//                   <button 
//                     className="table-delete-btn"
//                     onClick={() => handleDelete(contact._id, contact.name)}
//                     title="Delete Contact"
//                   >
//                     <FaTrash />
//                   </button>
//                 </td>
//               )}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// export default ContactList;

