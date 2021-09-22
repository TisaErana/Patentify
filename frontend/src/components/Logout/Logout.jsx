import React from 'react';

const Logout = (props) => {
    localStorage.clear(); // log the user out.
    window.location = '/'; // send user to the home page; triggers a refresh to update navbar.
    return (
        <div></div>
    );
};

export default Logout;