import './LoginSignup.css';
import email_icon from '../Assets/icons8-email-30.png'
import user_icon from '../Assets/icons8-name-30.png'
import password_icon from '../Assets/icons8-password-24.png'
import React, {useState} from "react";
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
    const [loginConfirmed, setLoginConfirmed] = useState(false);
  
    const navigate = useNavigate();

    // Compute password criteria
    const criteria = checkPassword(password);
  
    const handleNameChange = (event) => setName(event.target.value);
    const handleEmailChange = (event) => setEmail(event.target.value);
    const handlePasswordChange = (event) => setPassword(event.target.value);
    const handleConfirmChange = (event) => setConfirmedPassword(event.target.value);
    
    
    const handleSubmit = async () =>{
      /*
      if(action === "Sign Up"){
        await handleSignup();
        if(!errorMsg){
          navigate("/dashboard");
        }
      }else if(action === "Login"){
        await handleLogin();
        if(!errorMsg){
          navigate("/dashboard");
        }
      }*/
      navigate("/dashboard");
    }
    const handleSignup = async () => {
      setErrorMsg(""); // Clear previous errors
      
      if(password !== confirmPassword){
        setErrorMsg({general: "Passwords do not match!"});
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
        // Instead of alert, you might simply clear the form
        // or set a success message inline.
        // alert(result.message);
        setErrorMsg({ general: result.message });
      } else {
        setErrorMsg(result.errors || result.message || { general: 'Invalid registration' });
      }
    };
  
    const handleLogin = async () => {
      setErrorMsg(""); // Clear previous errors
  
      if (!loginConfirmed) {
        setLoginConfirmed(true);
        return;
      }
  
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
        // Instead of alert, update state accordingly.
        // alert(result.message);
        setErrorMsg({ general: result.message });
      } else {
        setErrorMsg(result.errors || result.message || { general: 'Invalid credentials' });
      }
    };
  
    return (
      <div>
        <div className="container">
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
              <input type="password" placeholder="Password" value={password} onChange={handlePasswordChange} />
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
  
            {/* Only show live password criteria box during Signup */}
            {action === "Sign Up" && (
              <>
              <div className="input">
                <img src={password_icon} alt = "Password Icon"/>
                <input type = "password"
                placeholder='Confirm Password'
                value = {confirmPassword}
                onChange= {handleConfirmChange}
                />
                </div>

                {errorMsg && errorMsg.confirmPassword &&(
                  <div className ="error">{errorMsg.confirmPassword}</div>
                )}
               
              <div className="error">
                <p>Your password must contain:</p>
                <ul>
                  <li>{criteria.length ? "✅" : "❌"} At least 8 characters</li>
                  <li>
                    {meetsThreeCriteria(criteria) ? "✅" : "❌"} At least three of the following:
                    <ul>
                      <li>{criteria.lowercase ? "✅" : "❌"} Lowercase letters (a-z)</li>
                      <li>{criteria.uppercase ? "✅" : "❌"} Uppercase letters (A-Z)</li>
                      <li>{criteria.digit ? "✅" : "❌"} Numbers (0-9)</li>
                      <li>{criteria.special ? "✅" : "❌"} Special characters (!@#$%^&*)</li>
                    </ul>
                  </li>
                </ul>
              </div>
              </>
            )}
          </div>
          <div className="submit-container">
            <div className={action === "Login" ? "submit gray" : "submit"}
              onClick={() => {
                setAction("Sign Up");
                handleSignup();
              }}>
              Sign Up
            </div>
            <div className={action === "Sign Up" ? "submit gray" : "submit"}
              onClick={() => {
                setAction("Login");
                handleLogin();
              }}>
              Login
            </div>
          </div>
          <button className = 'submit' onClick = {handleSubmit}>Submit</button>
        </div>
      </div>
    );
  };
  
  export default LoginSignup;