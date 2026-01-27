// react-web/src/CAPtcha.jsx

import React, { useState, useRef, useEffect } from 'react';
import './CAPtcha.css';

  const CAPtcha = ({ onVerify, onCancel, inline = false }) => {
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const canvasRef = useRef(null);

  // Generate random CAPTCHA text
  const generateCaptcha = () => {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setCaptchaText(result);
    setUserInput('');
    setIsVerified(false);
  };

  // Draw CAPTCHA on canvas
  const drawCaptcha = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Text
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add some distortion
    for (let i = 0; i < captchaText.length; i++) {
      const x = 20 + i * 20;
      const y = 20 + Math.random() * 10 - 5;
      const rotation = Math.random() * 0.4 - 0.2;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.fillText(captchaText[i], 0, 0);
      ctx.restore();
    }
    
    // Noise
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.2})`;
      ctx.fillRect(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        1,
        1
      );
    }
  };

  // Verify user input
  const verifyCaptcha = () => {
    if (userInput.toLowerCase() === captchaText.toLowerCase()) {
      setIsVerified(true);
      if (onVerify) onVerify();
    } else {
      alert('CAPTCHA incorrect. Please try again.');
      generateCaptcha();
    }
  };

  // Initialize
  useEffect(() => {
    generateCaptcha();
  }, []);

  useEffect(() => {
    if (captchaText) {
      drawCaptcha();
    }
  }, [captchaText]);

   // If inline mode, return without the overlay - MOVED THIS AFTER FUNCTION DEFINITIONS
  if (inline) {
    return (
      <div className="captcha-inline">
        <div className="captcha-container">
          <canvas 
            ref={canvasRef} 
            width="150" 
            height="40"
            className="captcha-canvas"
          />
          <button 
            type="button" 
            onClick={generateCaptcha}
            className="captcha-refresh"
          >
            ↻
          </button>
        </div>
        <div className="captcha-input-container">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Enter the text above"
            className="captcha-input"
          />
          <button 
            type="button" 
            onClick={verifyCaptcha}
            className="captcha-verify-btn"
          >
            Verify
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="captcha-overlay">
      <div className="captcha-modal">
        <h3>Verify you're human</h3>
        <div className="captcha-container">
          <canvas 
            ref={canvasRef} 
            width="150" 
            height="40"
            className="captcha-canvas"
          />
          <button 
            type="button" 
            onClick={generateCaptcha}
            className="captcha-refresh"
          >
            ↻
          </button>
        </div>
        <div className="captcha-input-container">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Enter the text above"
            className="captcha-input"
          />
          <button 
            type="button" 
            onClick={verifyCaptcha}
            className="captcha-verify-btn"
          >
            Verify
          </button>
        </div>
        <div className="captcha-actions">
          <button 
            type="button" 
            onClick={onCancel}
            className="captcha-cancel-btn"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CAPtcha;