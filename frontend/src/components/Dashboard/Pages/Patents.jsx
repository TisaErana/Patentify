import React, { useEffect, useState } from "react";
import Nav from "../components/DashboardNavigation";
import MaterialTable from "material-table";

import { useHistory } from 'react-router';
import { Form } from "react-bootstrap";

import axios from "axios";

const ViewPatent = () => {
  const history = useHistory();

  const [selectedUser, setSelectedUser] = useState();

  const [data, setData] = useState({ users: [], preventDefault: true });
  const [allPatents, setAllPatents] = useState();
  const [assignedPatents, setAssignedPatents] = useState();
  const [uncertainPatents, setUncertainPatents] = useState();


  const assignPatents = (rowData) => {
    axios({
      url: "/patents-api/assignments/assign", // route in backend
      method: "POST",
      data: {
        user: selectedUser,
        documents: rowData.map(document => (document.documentId))
      }
    })
    .then((response) => {
      if (response.status === 200) {
        alert('Patents have been assigned.');
        data.assigned = response.data.assigned
        setAssignedPatents([]); // trigger table refresh
      }
    })
    .catch((error) => {
      alert(error.response.data.error);
    });
  }

  const removeAssignments = (rowData) => {
    // when only one document is selected only that object is returned:
    if(!Array.isArray(rowData))
    {
      rowData = [rowData] // let's make the format consistent
    }
    
    axios({
      url: "/patents-api/assignments/remove", // route in backend
      method: "POST",
      data: {
        assignments: rowData
      }
    })
    .then((response) => {
      if (response.status === 200) {
        data.assigned = response.data.assigned
        setAssignedPatents([]); // trigger table refresh
      }
    })
    .catch((error) => {
      alert(error.response.data.error);
    });
  }

  const tableFormatAssignments = () => {
    data.assigned.forEach(document => {
      document.assignments.forEach(d => {
        d.user = data.users.find(user => user._id === document.user);
        data.assigned.tableFormat.push(d); 
      });
    });
  }

  useEffect(() => {
    async function fetchData() {
      try {
        // fetch all users, uncertain documents, assigned documents in the database:
        const fast = await fetch("/patents-api/patents/fast");
        const body = await fast.json();
        
        setData(body);
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

  // save selected user and set uncertain patent list: 
  useEffect(() => {
    if(!data.preventDefault)
    {
      setSelectedUser(data.users[0].email);
      setUncertainPatents(data.uncertain);
    }
  }, [data.users, data.uncertain]);

  // format assigned patent data:
  useEffect(() => {
    if(!data.preventDefault)
    {
      // make table information easier to understand:
      // each entry will be a new row:
      data.assigned.tableFormat = []
      tableFormatAssignments();
  
      setAssignedPatents(data.assigned.tableFormat);
    }
  }, [data.assigned]);

  return (
    <div>
      <Nav />
      <div className="container-fluid mt-5" style={{ paddingBottom: '5%' }}>
        <MaterialTable
          title="Assigned Patents"
          columns={[
            { title: "User", field: "user.email", defaultGroupOrder:0, customSort: (a, b) => 0},
            { title: "DocumentId", field: "documentId" },
            { title: "title", field: "title" },
            { title: "abstract", field: "abstract" }
          ]}
          data={assignedPatents}
          isLoading={assignedPatents === undefined}
          actions={[
            {
              icon: 'delete',
              tooltip: 'Remove Selected Assignments',
              onClick: (event, rowData) => {
                removeAssignments(rowData);
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
            },
            {
              icon: 'delete',
              position: 'row',
              tooltip: 'Remove Assignment',
              onClick: (event, rowData) => {
                removeAssignments(rowData);
              }
            }
          ]}
          options={{
              selection: true,
              grouping: true, 
              exportButton: true, 
              exportAllData: true
            }}
        />
        
        <br/>
        <br/>
        
        <Form>
            <h3>Choose an Annotator to Assign</h3>
            <Form.Control 
              as="select"
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
            >
                {
                   data.users.map((user) => (
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
          isLoading={uncertainPatents === undefined}
          actions={[
            {
              icon: 'people',
              tooltip: 'Assign',
              onClick: (event, rowData) => {
                assignPatents(rowData);
              }
            },
            {
              icon: 'download',
              tooltip: 'Export Uncertain Patents from Database as JSON File',
              isFreeAction: true,
              onClick: (event, rowData) => {
                window.location = '/patents-api/export/uncertainPatents';
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
          localization={{
            toolbar: {
              exportTitle: "Export Table Data",
              exportCSVName: "Export Table Data as CSV",
              exportPDFName: "Export Table Data as PDF"
            }
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
          isLoading={allPatents === undefined}
          actions={[
            {
              icon: 'people',
              tooltip: 'Assign',
              onClick: (event, rowData) => {
                assignPatents(rowData);
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
              selection: true
            }}
        />
      </div>
    </div>
  );
};

export default ViewPatent;
