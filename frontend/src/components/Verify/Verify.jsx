import React, { useState, useEffect } from "react";
import image from '../../assests/25372 [Converted].png';
import { Link, Redirect, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "axios";


const Verify = (props) => {
  const params = useParams();

  const [message, setMessage] = useState("Your email has been successfully verified."); //   stores the main response.
  const [info, setInfo] = useState("You may now login."); //   stores the extra info for the user.
  
  useEffect(() => {
    axios({
      url: "/users/verify/"+ params.userId + "/" + params.uniqueString, // route in backend
      method: "GET",
    })
    .catch((error) => {
      setMessage(error.response.data.error)
      setInfo("Please check the link and try again.")
    });
  }, []);
  
    return (

        <div className="d-flex justify-content-center" style= {{backgroundImage:`url("${image}")`, height: '100vh' , backgroundSize: "cover"}}>
        <div className= "text-center mt-5" >
          <h4>{ message }</h4>
          <h5>{ info }</h5>
        </div>

        </div>
        
    );
};

export default Verify;