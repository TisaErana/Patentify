import React from 'react';
import image from '../../assests/25372 [Converted].png';
import { Link, Redirect, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "axios";


const Verified = (props) => {
  const params = useParams();
  axios({
    url: "/users/verify/"+ params.userId + "/" + params.uniqueString, // route in backend
    method: "GET",
  })
  
    return (

        <div className="d-flex justify-content-center" style= {{backgroundImage:`url("${image}")`, height: '100vh' , backgroundSize: "cover"}}>
        <div className= "text-center mt-5" >
          <h4> Your email has been successfully verified.</h4>
          <h5>You may now login.</h5>
        </div>

        </div>
        
    );
};

export default Verified;