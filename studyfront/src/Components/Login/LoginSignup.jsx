import './LoginSignup.css';
import email_icon from '../Assets/icons8-email-30.png';
import user_icon from '../Assets/icons8-name-30.png';
import password_icon from '../Assets/icons8-password-24.png';
import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';

// helper function to check each password rule
const checkPassword = (password) => {
  return {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    digit: /\d/.test(password),
    special: /[!@#$%^&*]/.test(password)
  };
};

const meetsThreeCriteria = (criteria) => {
  const count = ["lowercase", "uppercase", "digit", "special"].reduce(
    (total, key) => total + (criteria[key] ? 1 : 0),
    0
  );
  return count >= 3;
};

const LoginSignup = () => {
  const [action, setAction] = useState("Sign Up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmPassword, setConfirmedPassword] = useState("");
  // const [loginConfirmed, setLoginConfirmed] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const navigate = useNavigate();

  // Compute password criteria
  const criteria = checkPassword(password);

  const handleNameChange = (event) => setName(event.target.value);
  const handleEmailChange = (event) => setEmail(event.target.value);
  const handlePasswordChange = (event) => setPassword(event.target.value);
  const handleConfirmChange = (event) => setConfirmedPassword(event.target.value);

  const handleSignup = async () => {
    setErrorMsg(""); // Clear previous errors

    if(password !== confirmPassword) {
      setErrorMsg({ general: "Passwords do not match!" });
      return;
    }

    const payload = {
      username: name,
      email: email,
      password: password,
      confirm_password: password
    };

    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (response.ok) {
      // If registration is successful, switch to Login screen.
      setErrorMsg({ general: result.message });
      setAction("Login");
    } else {
      setErrorMsg(result.errors || result.message || { general: 'Invalid registration' });
    }
  };

  const handleLogin = async () => {
    setErrorMsg(""); // Clear previous errors

    // if (!loginConfirmed) {
    //   setLoginConfirmed(true);
    //   return;
    // }

    if (!email || !password) {
      setErrorMsg({ general: 'Email and password are required' });
      return;
    }

    const payload = { email, password };
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (response.ok) {
      setErrorMsg({ general: result.message });
      navigate("/dashboard");
    } else {
      setErrorMsg(result.errors || result.message || { general: 'Invalid credentials' });
    }
  };

  // The single submit button calls the appropriate function based on the current action.
  const handleSubmit = async () => {
    if (action === "Sign Up") {
      await handleSignup();
    } else if (action === "Login") {
      await handleLogin();
    }
  };

  return (
    <div>
      <div className="container">
        {/* Toggle header at the top with "Sign Up" and "Login" buttons */}
        <div className="toggle-container">
          <div 
            className={action === "Sign Up" ? "submit gray" : "submit"}
            onClick={() => setAction("Sign Up")}>
            Sign Up
          </div>
          <div 
            className={action === "Login" ? "submit gray" : "submit"}
            onClick={() => setAction("Login")}>
            Login
          </div>
        </div>

        <div className="header">
          <div className="text">{action}</div>
          <div className="underline"></div>
        </div>
        <div className="inputs">
          {action === "Login" ? null : (
            <div className="input">
              <img src={user_icon} alt="User Icon" />
              <input type="text" placeholder="Username" value={name} onChange={handleNameChange} />
            </div>
          )}
          {errorMsg && errorMsg.username && (
            <div className="error">{errorMsg.username.join(', ')}</div>
          )}
          <div className="input">
            <img src={email_icon} alt="Email Icon" />
            <input type="email" placeholder="Email" value={email} onChange={handleEmailChange} />
          </div>
          {errorMsg && errorMsg.email && (
            <div className="error">{errorMsg.email.join(', ')}</div>
          )}
          <div className="input">
            <img src={password_icon} alt="Password Icon" />
            <input type="password" placeholder="Password" value={password}
              onChange={handlePasswordChange}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}/>
          </div>
          {errorMsg && errorMsg.password && (
            <div className="error">
              <ul>
                {errorMsg.password.map((msg, index) => (
                  <li key={index}>{msg}</li>
                ))}
              </ul>
            </div>
          )}
          {errorMsg && errorMsg.general && (
            <div className="error">{errorMsg.general}</div>
          )}
          {/* Only show live password criteria box during Sign Up when the password field is focused */}
          {action === "Sign Up" && passwordFocused && (
            <div className="error">
              <p>Your password must contain:</p>
              <ul>
                <li>{criteria.length ? "✅" : "❌"} At least 8 characters</li>
                <li>
                  {meetsThreeCriteria(criteria) ? "✅" : "❌"} At least three of the following:
                  <ul style={{ marginLeft: "20px" }}>
                    <li>{criteria.lowercase ? "✅" : "❌"} Lowercase letters (a-z)</li>
                    <li>{criteria.uppercase ? "✅" : "❌"} Uppercase letters (A-Z)</li>
                    <li>{criteria.digit ? "✅" : "❌"} Numbers (0-9)</li>
                    <li>{criteria.special ? "✅" : "❌"} Special characters (!@#$%^&*)</li>
                  </ul>
                </li>
              </ul>
            </div>
          )}
          {/* Only for Sign Up: show the Confirm Password input */}
          {action === "Sign Up" && (
            <>
              <div className="input">
                <img src={password_icon} alt="Password Icon" />
                <input 
                  type="password" 
                  placeholder="Confirm Password" 
                  value={confirmPassword} 
                  onChange={handleConfirmChange} 
                />
              </div>
              {errorMsg && errorMsg.confirmPassword && (
                <div className="error">{errorMsg.confirmPassword}</div>
              )}
            </>
          )}
        </div>
        {/* Single Submit button */}
        <div className="submit-container">
          <button className='submit' onClick={handleSubmit}>Submit</button>
        </div>
      </div>
    </div>
  );
};

export default LoginSignup;