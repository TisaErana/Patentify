import React from "react";
import { NavLink } from "react-router-dom";

const DashboardNavigation = () => {
  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="collapse navbar-collapse" id="navbarTogglerDemo01">
          DashBoard V3
          <ul className="navbar-nav mr-auto mt-2 mt-lg-0">
            <li className="nav-item">
              <NavLink className="nav-link" exact to="/Dashboard">
                Overview <span className="sr-only">(current)</span>{" "}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/Dashboard/ViewLabel">
                Labels <span className="sr-only">(current)</span>{" "}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/Dashboard/ViewQueues">
                Active Queues <span className="sr-only">(current)</span>{" "}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/Dashboard/ViewUser">
                View Users <span className="sr-only">(current)</span>{" "}
                </NavLink>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
};

export default DashboardNavigation;
