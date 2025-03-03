import './LoginSignup.css'
import email_icon from '../Assets/icons8-email-30.png'
import user_icon from '../Assets/icons8-name-30.png'
import password_icon from '../Assets/icons8-password-24.png'
import React, {useState} from "react";

const LoginSignup = () => {
    const [action,setAction] = useState("Sign Up");
    const [name,setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleNameChange = (event) => {
        setName(event.target.value);
    }
    const handleEmailChange = (event) =>{
        setEmail(event.target.value);
    }
    const handlePasswordChange = (event)=>{
        setPassword(event.target.value);
    }

    return(
        <div>
        <div className = "title">
        <h1>StudyFindr</h1>
            </div>  
            <div className = "container">
                <div className = "header">
                    <div className = "text">{action}</div>
                    <div className="underline"></div>
                </div>
                <div className="inputs">
                    {action === "Login"?<div></div>:<div className="input">
                        <img src={user_icon} alt="" />
                        <input type="text" placeholder='Name' value = {name} onChange={handleNameChange} />
                    </div>}
                    
                    <div className="input">
                        <img src={email_icon} alt="" />
                        <input type="email" placeholder='Email' value = {email} onChange={handleEmailChange} />
                    </div>
                    <div className="input">
                        <img src={password_icon} alt="" />
                        <input type="password" placeholder='Password' value = {password} onChange={handlePasswordChange}/>
                    </div>
                    
                </div>
                <div className="submit-container">
                    <div className={action === "Login"?"submit gray":"submit"} onClick={()=>{setAction("Sign Up")}}>Sign Up</div>
                    <div className={action === "Sign Up"?"submit gray":"submit"}onClick={()=>{setAction("Login")}}>Login</div>
                </div>
            </div>
            </div>
        )

}

export default LoginSignup