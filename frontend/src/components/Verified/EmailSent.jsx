import React from 'react';
import image from '../../assests/25372 [Converted].png';

const EmailSent = () => {
    return (
        

        <div className="d-flex justify-content-center" style= {{backgroundImage:`url("${image}")`, height: '100vh' , backgroundSize: "cover"}}>
        <div className= "text-center mt-5" >
        <h5> An email has been sent to you regarding verification,</h5>
        <h5> you will be able to login once your email has been verified.</h5>
        </div>

        </div>
        
    );
};

export default EmailSent;