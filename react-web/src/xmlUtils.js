// src/xmlUtils.js

export function saveContactsAsXML(contacts) {
  if (!contacts || contacts.length === 0) {
    console.warn("No contacts to save!");
    return;
  }

  // Start XML with declaration
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n\n';
  xml += "<contacts>\n\n";

  contacts.forEach((c) => {
    xml += "  <contact>\n";
    xml += `    <name>${escapeXML(c.name)}</name>\n`;
    xml += `    <phone>${escapeXML(c.phone)}</phone>\n`;
    xml += `    <email>${escapeXML(c.email)}</email>\n`;
    xml += `    <address>${escapeXML(c.address || "")}</address>\n`;
    xml += `    <phoneVerified>${c.phoneVerified ? "Yes" : "No"}</phoneVerified>\n`;
    xml += `    <emailVerified>${c.emailVerified ? "Yes" : "No"}</emailVerified>\n`;
    xml += "  </contact>\n\n";
  });

  xml += "</contacts>\n";

  // Download
  const blob = new Blob([xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "contacts.xml";
  a.click();
  URL.revokeObjectURL(url); //CLEAN UP
}

// Escape special XML characters to avoid breaking the file
function escapeXML(str) {
  if (str === null || str === undefined) {
    return "";
  }
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;") //g=global flag
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}