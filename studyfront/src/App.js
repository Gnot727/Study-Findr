import './App.css';
import LoginSignup from './Components/Login/LoginSignup';
import { BrowserRouter as Routes, Route } from 'react-router-dom';
import Dashboard from './Components/Mainpage/Dashboard';

function App() {
  return (
   
  
      <Routes>
        <Route path="/" element={<LoginSignup />} />
        <Route path = "/dashboard" element = {<Dashboard />} />
      </Routes>
 
  
  );
}

export default App;
