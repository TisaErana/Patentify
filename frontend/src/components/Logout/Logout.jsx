import React from 'react';
import axios from "axios";

const Logout = (props) => {
    // clear frontend sotrage:
    localStorage.clear();
    
    // let the backend know we are logging out:
    axios({
        url: "/patents-api/logout",
        method: "GET"
      })
        .then(() => {
            window.location = '/'; // send user to the home page; triggers a refresh to update navbar.
        })
        .catch((error) => {
          console.log("error: ", error.data);
        });

    return (
        <div></div>
    );
};

export default Logout;