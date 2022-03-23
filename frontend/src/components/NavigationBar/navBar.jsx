import React from "react";
import { Navbar, Nav } from "react-bootstrap";
import { Link } from "react-router-dom";
import patentifyLogo from '../../patentifyLogo.png'



import  SearchBar  from '../SearchBar/searchBar';

const navBar = (props) => {
  return (
    <div>
      <Navbar bg="primary" expand="lg" variant="light">
        <Navbar.Brand href="/"> <img src ={patentifyLogo} alt="Patentify logo" height='100rem' /> </Navbar.Brand>
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
        <Nav.Link className="active" as={Link} to="/Home">
          Home
        </Nav.Link>
        <Nav.Link as={Link} to="/Patents">
          Patents
        </Nav.Link>
        <Nav.Link as={Link} to="/Dashboard">
          Dashboard
        </Nav.Link>
        
          <SearchBar></SearchBar>
       
        <Nav.Link as={Link} to="/Logout">
          Logout
        </Nav.Link>
      </Nav>
      );
    }
    else if(Role === 'annotator')
    {
      return (
        <Nav className="ml-auto">
        <Nav.Link className="active" as={Link} to="/Home">
          Home
        </Nav.Link>
        <Nav.Link as={Link} to="/Patents">
          Patents
        </Nav.Link>
        <Nav.Link as={Link} to="/Logout">
          Logout
        </Nav.Link>
       
        <SearchBar></SearchBar>
      
      </Nav>
      );
    }
    
  } 
  else {
    return (
      <Nav className="ml-auto">
      <Nav.Link className="active" as={Link} to="/Home">
          Home
      </Nav.Link>
        <Nav.Link as={Link} to="/Signup">
          SignUp
        </Nav.Link>
        <Nav.Link as={Link} to="/Login">
          Login
        </Nav.Link>
      </Nav>
    );
  }
}


export default navBar;
