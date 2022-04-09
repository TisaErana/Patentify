import React, { useState, useEffect } from "react";
import Nav from "../components/DashboardNavigation";
import MaterialTable from "material-table";
import { useHistory } from 'react-router';
import { Form } from "react-bootstrap";
import axios from "axios";

const Cohen = require('cohens-kappa');

const Table = () => {
    const history = useHistory();
    
    const [data, setData] = useState({ users: [], preventDefault: true });
    const [labels, setLabels] = useState();
    const [selectedUser, setSelectedUser] = useState();

    const [agreedLabelsTableFormat, setAgreedLabelsTableFormat] = useState();
    const [disagreedLabelsTableFormat, setDisagreedLabelsTableFormat] = useState();

    const labelColumns = [ 
      { title:'Label ID', field:'_id'},
      { title:'Document ID', field:'document', defaultGroupOrder:0},
      { title:'User', field:'user.email', defaultGroupOrder:1},
      { title:'Date', field:'createdAt'},
      { title:'Machine Learning', field:'mal'},
      { title:'AI Hardware', field:'hdw'},
      { title:'Speech', field:'spc'},
      { title:'Vision', field:'vis'},
      { title:'Natural Language Processing', field:'nlp'},
      { title:'Planning/Control', field:'pln'},
      { title:'Evolutionary Computation', field:'evo'},
      { title:'Knowledge Processing', field:'kpr'},
      { title:'None', field:'none'}
    ];

    const agreedColumns = [ 
      { title:'Document ID', field:'document', defaultGroupOrder:0},
      { title:'Users', field:'user.email'},
      { title:'Date', field:'createdAt'},
      { title:'Machine Learning', field:'mal'},
      { title:'AI Hardware', field:'hdw'},
      { title:'Speech', field:'spc'},
      { title:'Vision', field:'vis'},
      { title:'Natural Language Processing', field:'nlp'},
      { title:'Planning/Control', field:'pln'},
      { title:'Evolutionary Computation', field:'evo'},
      { title:'Knowledge Processing', field:'kpr'}
    ];

    const disagreedColumns = [ 
      { title:'Document ID', field:'document', defaultGroupOrder:0},
      { title:'User', field:'user.email'},
      { title:'Machine Learning', field:'mal'},
      { title:'AI Hardware', field:'hdw'},
      { title:'Speech', field:'spc'},
      { title:'Vision', field:'vis'},
      { title:'Natural Language Processing', field:'nlp'},
      { title:'Planning/Control', field:'pln'},
      { title:'Evolutionary Computation', field:'evo'},
      { title:'Knowledge Processing', field:'kpr'},
      { title:'Created At', field:'createdAt'},
      { title:'Updated At', field:'updatedAt'}
    ];

    const assignPatents = (rowData) => {
      axios({
        url: "/patents-api/assignments/assign", // route in backend
        method: "POST",
        data: {
          user: selectedUser,
          documents: rowData.map(document => (document.document))
        }
      })
      .then((response) => {
        if (response.status === 200) {
          alert('patents have been assigned')
        }
      })
      .catch((error) => {
        alert(error.response.data);
      });
    }
  
    useEffect(() => {
      async function fetchData() {
        try {
          
          // we are using fetch to call the backend endpoint that contains all 300 patents.
          const response = await fetch("/patents-api/labels");
  
          const body = await response.json();
          // body is an object with the response 
          
          // add user information to table data:
          body.labels = body.labels.map(annotation => ({
            ...annotation,
            user: body.users.find(user => user._id === annotation.user)
          }));

          body.agreedLabels = body.agreedLabels.map(annotation => ({
            ...annotation,
            individual: annotation.individual.map(i => ({
              ...i,
              user: body.users.find(user => user._id === i.user)
            }))
          }));

          body.disagreedLabels = body.disagreedLabels.map(annotation => ({
            ...annotation,
            disagreement: annotation.disagreement.map(d => ({
              ...d,
              user: body.users.find(user => user._id === d.user)
            }))
          }));
          
          // make each annotation an individual row so it is easier to understand:
          body.agreedLabels.tableFormat = []
          body.agreedLabels.forEach(annotation => {
            annotation.individual.forEach(d => {
              d.document = annotation.document;
              d.createdAt = annotation.createdAt;
              d.updatedAt = annotation.updatedAt;
              body.agreedLabels.tableFormat.push(d);
            });
            annotation.consensus.document = annotation.document;
            annotation.consensus.createdAt = annotation.createdAt;
            annotation.consensus.updatedAt = annotation.updatedAt;
            annotation.consensus.user = { email: '[Consensus]'}
            body.agreedLabels.tableFormat.push(annotation.consensus);
          });

          body.disagreedLabels.tableFormat = []
          body.disagreedLabels.forEach(annotation => {
            annotation.disagreement.forEach(d => {
              d.document = annotation.document;
              d.createdAt = annotation.createdAt;
              d.updatedAt = annotation.updatedAt;
              body.disagreedLabels.tableFormat.push(d);
            });
            
            if(annotation.consensus !== undefined) {
              annotation.consensus.document = annotation.document;
              annotation.consensus.createdAt = annotation.createdAt;
              annotation.consensus.updatedAt = annotation.updatedAt;
              annotation.consensus.user = {email: '[Consensus] ' + body.users.find(user => user._id === annotation.consensus.user).email };
              body.disagreedLabels.tableFormat.push(annotation.consensus);
            }
          });

          setData(body);
          setLabels(body.labels);
          setSelectedUser(body.users[0].email);
          setAgreedLabelsTableFormat(body.agreedLabels.tableFormat);
          setDisagreedLabelsTableFormat(body.disagreedLabels.tableFormat);

        } catch (error) {}
      }
  
      fetchData();
    }, []);

    
    return (
      <div>
        <Nav />
        <div className="container-fluid mt-5" style={{ paddingBottom: '5%' }}>
          <MaterialTable
            title="Labels"
            columns={labelColumns}
            data={labels}
            isLoading={labels === undefined}
            options={{
              grouping: true,
              selection: true,
            }}
            actions={[
              {
                tooltip: "Calculate InterAnnotator Agreement",
                icon: "group",
                onClick: (event, rowData) => {

                  function groupByKey(array, key) {
                    return array.reduce((hash, obj) => {
                      if (obj[key] === undefined) return hash;
                      return Object.assign(hash, {
                        [obj[key]]: (hash[obj[key]] || []).concat(obj),
                      });
                    }, {});
                  }

                  function findKappa() {

                    const categories = ["Yes", "No"];

                    let values = rowData.map((x) => [x.mal, x.hdw ,x.evo ,x.spc ,x.vis, x.nlp ,x.pln, x.kpr])
                    
                    let user1 = values[0];
                    let user2 = values[1];
                
                    console.log(user1, user2)

                    let rev1numeric = Cohen.nominalConversion(categories,user1);
                    let rev2numeric = Cohen.nominalConversion(categories,user2);

                    let kappaUnweighted = Cohen.kappa(
                      rev1numeric,
                      rev2numeric,
                      2,
                      "none"
                    );

                    alert("Unweighted kappa: " + kappaUnweighted);
                    
                  }
                  findKappa();
                }
              },
              {
                icon: 'download',
                tooltip: 'Export as JSON File',
                isFreeAction: true,
                onClick: (event, rowData) => {
                  window.location = '/patents-api/export/labels';
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
                            patentSearchId: rowData.document,
                            weAreSearching: true 
                        }
                    })
                    history.go(0);
                }
            }
            ]}
          />

          <br/>
          <MaterialTable
            title="Labels in Agreement"
            columns={agreedColumns}
            data={agreedLabelsTableFormat}
            isLoading={agreedLabelsTableFormat === undefined}
            actions={[
              {
                icon: 'download',
                tooltip: 'Export as JSON File',
                isFreeAction: true,
                onClick: (event, rowData) => {
                  window.location = '/patents-api/export/agreedLabels';
                }
              }
            ]}
            options={{
              grouping: true,
              selection: false
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
            title="Labels in Disagreement"
            columns={disagreedColumns}
            data={disagreedLabelsTableFormat}
            isLoading={disagreedLabelsTableFormat === undefined}
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
                tooltip: 'Export as JSON File',
                isFreeAction: true,
                onClick: (event, rowData) => {
                  window.location = '/patents-api/export/disagreedLabels';
                }
              }
            ]}
            options={{
              grouping: true,
              selection: true
            }}
          />
        </div>
      </div>
    );
};

export default Table;