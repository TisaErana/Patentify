import React from "react";
import { Navbar, Nav } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import patentifyLogo from '../../patentifyLogo.png'
import  SearchBar  from '../SearchBar/searchBar';

const navBar = (props) => {
  return (
    <div>
      <Navbar bg="primary" expand="lg" variant="light">
        <Navbar.Brand href="/Home"> <img src ={patentifyLogo} alt="Patentify logo" height='55rem' /> </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          {displayLogout(props.isAuthed, props.role)}
        </Navbar.Collapse>
      </Navbar>
    </div>
  );
};
function displayLogout(AuthStatus, Role) {
  if (AuthStatus) {
    if(Role === 'admin')
    {
      return (
        <Nav className="ml-auto">
          <NavLink className="nav-link" to="/Home">
            Home
          </NavLink>
          <NavLink className="nav-link" to="/Patents">
            Patents
          </NavLink>
          <NavLink className="nav-link" to="/Dashboard">
            Dashboard
          </NavLink>
          <SearchBar></SearchBar>
          <NavLink className="nav-link" to="/Logout">
            Logout
          </NavLink>
        </Nav>
      );
    }
    else if(Role === 'annotator')
    {
      return (
        <Nav className="ml-auto">
          <NavLink className="nav-link" to="/Home">
            Home
          </NavLink>
          <NavLink className="nav-link" to="/Patents">
            Patents
          </NavLink>
          <NavLink className="nav-link" to="/Logout">
            Logout
          </NavLink>
          <SearchBar></SearchBar>
        </Nav>
      );
    }
    
  } 
  else {
    return (
      <Nav className="ml-auto">
        <NavLink className="nav-link" to="/Home">
          Home
        </NavLink>
        <NavLink className="nav-link" to="/Signup">
          SignUp
        </NavLink>
        <NavLink className="nav-link" to="/Login">
          Login
        </NavLink>
      </Nav>
    );
  }
}

export default navBar;
