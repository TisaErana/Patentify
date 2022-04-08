import React, { useEffect, useState } from "react";
import Nav from "../components/DashboardNavigation";
import MaterialTable from "material-table";
import { useHistory } from 'react-router';

import {Form} from "react-bootstrap";
import Button from "react-bootstrap/Button";

const ViewPatent = () => {
  const history = useHistory();

  const [selectedUser, setSelectedUser] = useState();

  const [users, setUsers] = useState([]);
  const [allPatents, setAllPatents] = useState([]);
  const [uncertainPatents, setUncertainPatents] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // fetch all users and uncertain documents in the database:
        const fast = await fetch("/patents-api/patents/fast");
        const body = await fast.json();

        setUsers(body.users);
        setSelectedUser(body.users[0].email);

        setUncertainPatents(body.uncertain);
      } catch (error) {}
    }

    fetchData();
  }, []);

  useEffect(() => {
    async function fetchAllPatents() {
      try {
        // fetch all patents in the database:
        const allPatents = await fetch("/patents-api/patents/slow");
        const patentIds = await allPatents.json();

        setAllPatents(patentIds);
      } catch (error) {}
    }

    fetchAllPatents();
  }, []);

  return (
    <div>
      <Nav />
      <div className="container-fluid mt-5" style={{ paddingBottom: '5%' }}>
        <Form>
            <h3>Choose an Annotator to Assign</h3>
            <Form.Control 
              as="select"
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
            >
                {
                   users.map((user) => (
                    <option key={user.email} value={user.email}>{user.name + ' <' + user.email + '>'}</option>
                   ))
                }
            </Form.Control>
        </Form>

        <br/>
        <br/>

        <MaterialTable
          title="Uncertain Patents"
          columns={[
            { title: "DocumentId", field: "documentId" },
            { title: "title", field: "title" },
            { title: "abstract", field: "abstract" },
          ]}
          data={uncertainPatents}
          isLoading={uncertainPatents.length === 0}
          actions={[
            {
              icon: 'people',
              tooltip: 'Assign',
              onClick: (event, rowData) => {
                alert(selectedUser)
              }
            },
            {
                icon: 'search',
                tooltip: 'View Patent',
                position: 'row',
                onClick: (event, rowData) => {
                    history.push({
                        pathname: '/Search',
                        state: { 
                            patentSearchId: rowData.documentId,
                            weAreSearching: true 
                        }
                    })
                    history.go(0);
                }
            }
          ]}
          options={{
              selection: true, 
              exportButton: true, 
              exportAllData: true
            }}
        />
        <br/>
        <MaterialTable
          title="All Patents"
          columns={[
            { title: "DocumentId", field: "documentId" },
            { title: "Title", field: "title" }
          ]}
          data={allPatents}
          isLoading={allPatents.length === 0}
          actions={[
            {
              icon: 'people',
              tooltip: 'Assign',
              onClick: (event, rowData) => {

              }
            },
            {
                icon: 'search',
                tooltip: 'View Patent',
                position: 'row',
                onClick: (event, rowData) => {
                    history.push({
                        pathname: '/Search',
                        state: { 
                            patentSearchId: rowData.documentId,
                            weAreSearching: true 
                        }
                    })
                    history.go(0);
                }
            }
          ]}
          options={{
              selection: true, 
              exportButton: true, 
              exportAllData: true
            }}
        />
      </div>
    </div>
  );
};

export default ViewPatent;
