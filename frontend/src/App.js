// Import Helpers
import axios from "axios";
import React, { useEffect, useState } from 'react';
import { Switch, Route,Redirect } from "react-router-dom";


// Imports of Components here
import Home from './components/Home/Home';
import Navbar from './components/NavigationBar/navBar';
import ViewPatent from './components/PatentPage/PatentView';
import DashBoard from './components/Dashboard/dashboard';
import SignUp from './components/Signup/signup';
import Login from './components/Login/Login';
import ViewUser from './components/Dashboard/Pages/viewUser';
import Logout from './components/Logout/Logout';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Labels from './components/Dashboard/Pages/Labels';
import Patents from './components/Dashboard/Pages/Patents';
import ViewQueues from './components/Dashboard/Pages/viewQueues';
import Forgot from './components/Forgot/Forgot';
import ResetPage from './components/ResetPage/ResetPage';
import Verify from './components/Verify/Verify';
import EmailSent from './components/Verify/EmailSent';

// Import Styles
import './App.css';


const App = () => {
  
  // Set this into state using react hooks
  const [Auth] = useState(window.localStorage.getItem("isAuthenticated"))
  const [Role] = useState(window.localStorage.getItem("role"))

  useEffect(() => {
    if(Auth !== null)
    {
      axios({
        url: "/patents-api/status",
        method: "GET"
      })
        .then((response) => { 
          if(response.data.status === 'unauthenticated')
            {
              localStorage.clear();
              window.location = '/Login';
            }
        })
        .catch((error) => {
          console.log("error: ", error.data);
        });
    }

  }, []);

  return (
    <div>
        <Navbar isAuthed={Auth} role={Role}/>
        
        <Switch>
          <Redirect exact from="/" to="/Home" />
          <Route exact path="/Home" render ={Home}/>
          <Route exact path="/EmailSent" render ={EmailSent}/>
          <Route path="/Signup" render={(props) => <SignUp {...props} />} />
          <Route path="/Login" render={(props) => <Login {...props} />} />
          <Route path="/Forgot" render={(props) => <Forgot {...props} />} />
          <Route path="/ResetPage" render={(props) => <ResetPage {...props} />} />
          <Route path="/verify/:userId/:uniqueString" component={Verify}/>  
          <Route exact path="/Logout" render={(props) => <Logout {...props} />} />
          <Route exact path="/Search" render={(props) => <ViewPatent {...props} />} />
          <ProtectedRoute exact path="/Patents"   isAuthed = {Auth}  component = {ViewPatent}/> 

          {/* Only Admins can acess the pages below */}

          {Role === "admin" ? 
          (<ProtectedRoute exact path='/Dashboard' isAuthed = {Auth}  component= {DashBoard} /> ) : (<Redirect to="/" />)}

          {Role === "admin" ? 
          (<ProtectedRoute exact path="/Dashboard/ViewUser" isAuthed = {Auth} component={ViewUser} /> ) : (<Redirect to="/" />)}

          
          {Role === "admin" ? 
          (<ProtectedRoute exact path="/Dashboard/ViewQueues" isAuthed = {Auth} component={ViewQueues} /> ) : (<Redirect to="/" />)}

          {Role === "admin" ? 
          (<ProtectedRoute exact path="/Dashboard/ViewLabel" isAuthed = {Auth} component={Labels} /> ) : (<Redirect to="/" />)}

          {Role === "admin" ? 
          (<ProtectedRoute exact path="/Dashboard/ViewPatents" isAuthed = {Auth} component={Patents} /> ) : (<Redirect to="/" />)}
          
        </Switch>
      </div>
  );
};

export default App;

