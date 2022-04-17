import React from "react";
import { Form } from "react-bootstrap";
import { Link, Redirect } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "axios";


const Reset = (props) => {
  const { register, handleSubmit } = useForm(); // initialize the hook

  //register is a function to be used as a ref provided by the useForm hook. We can assign it to each input field so that the react-hook-form can track the changes for the input field value.

  const onSubmit = (data) => {
    // This is using axios to make a post request to our backend and sends {email,password}
    // and checks if user is in our Database

    axios({
      url: "passwordReset/verify/update", // route in backend
      method: "POST",
      data: {
        token: data.token,
        password: data.password,
        passwordConfirm: data.passwordConfirm,
      },
    })
      .then((response) => {
        if (response.status === 200) {
          alert(response.data);
          console.log("Sucess: ", response.data)
          window.location = "/Login"
        }
      })
      .catch((error) => {
        alert(error.response.data);
        console.log("Error:", error.response.data);
      });
  };
      
    
  
  return (
    <div>
      <div className="d-flex justify-content-center ">
        <div className="login-box" style={{ marginTop: "6%" }}>
          <div className="login-logo">
            <b>Password Reset</b>
          </div>
          <div className="card">
            <div className="card-body login-card-body">
              <p className="login-box-msg">Enter New Password</p>
              <Form
                onSubmit={handleSubmit(onSubmit)}
              >
                <div className="input-group mb-3">
                <input
                    type="token"
                    id="token"
                    name="token"
                    className="form-control"
                    placeholder="Enter code"
                    autoComplete = "off"
                    ref={register({ required: true })}
                    required
                  />
                     <div className="input-group-append">
                    <div className="input-group-text">
                      <span className="fas fa-lock" />
                    </div>
                      </div>
                      </div>
                 <div className="input-group mb-3">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className="form-control"
                    placeholder="Enter Password"
                    autoComplete = "off"
                    ref={register({ required: true })}
                    required
                  />
                  <div className="input-group-append">
                    <div className="input-group-text">
                      <span className="fas fa-lock" />
                    </div>
                  </div>
                  </div>
                  <div className="input-group mb-3">
                  <input
                    type="password"
                    id="passwordConfirm"
                    name="passwordConfirm"
                    className="form-control"
                    placeholder="Re-enter Password"
                    autoComplete = "off"
                    ref={register({ required: true })}
                    required
                  />
                  <div className="input-group-append">
                    <div className="input-group-text">
                      <span className="fas fa-lock" />
                    </div>
                  </div>
                  </div>
                <div className="row">
                  <div className="col">
                    <button type="submit" className="btn btn-primary btn-block">
                      Reset Password
                    </button>
                    <div className=" mt-2">
                    </div>
                  </div>
                </div>
              </Form>
              <p className="mt-2">
                Don't have An Account?{" "}
                <Link to="/signup" className="text-center">
                  SignUp
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reset;
