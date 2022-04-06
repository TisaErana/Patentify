import React, { useState, useEffect } from "react";
import Nav from "../components/DashboardNavigation";
import MaterialTable from "material-table";
const Cohen = require('cohens-kappa');

const Table = () => {
    
    const [labels, setLabels] = useState();
    const [agreedLabels, setAgreedLabels] = useState();
    const [disagreedLabels, setDisagreedLabels] = useState();

    const labelColumns = [ 
      { title:'Label ID', field:'_id'},
      { title:'Document ID', field:'document', defaultGroupOrder:0},
      { title:'User', field:'user', defaultGroupOrder:1},
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
      { title:'Users', field:'userIds', defaultGroupOrder:1},
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
      { title:'Created At', field:'createdAt'},
      { title:'Updated At', field:'updatedAt'}
    ];
  
    useEffect(() => {
      async function fetchData() {
        try {
          
          // we are using fetch to call the backend endpoint that contains all 300 patents.
          const response = await fetch("/patents-api/labels");
  
          const body = await response.json();
          // body is an object with the response 
          
          setLabels(body.labels);
          setAgreedLabels(body.agreedLabels);
          setDisagreedLabels(body.disagreedLabels);

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
              exportButton: true,
              exportAllData: true,
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

                    let group = groupByKey(rowData, 'user')
                 
                    let array = Object.keys(group).map((key) => group[key])

                    let user1 = array[0].map((x) => [x.mal, x.hdw ,x.evo ,x.spc ,x.vis, x.nlp ,x.pln, x.kpr, x.none]).flat()
                    let user2 = array[1].map((x) => [x.mal, x.hdw ,x.evo ,x.spc ,x.vis, x.nlp ,x.pln, x.kpr, x.none]).flat()
                
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
                },
              },
            ]}
          />

          <br/>
          <MaterialTable
            title="Labels in Agreement"
            columns={agreedColumns}
            data={agreedLabels}
            isLoading={agreedLabels === undefined}
            options={{
              exportButton: true,
              exportAllData: true,
              grouping: true,
              selection: true,
            }}
          />

          <br/>
          <MaterialTable
            title="Labels in Disagreement"
            columns={disagreedColumns}
            data={disagreedLabels}
            isLoading={disagreedLabels === undefined}
            options={{
              exportButton: true,
              exportAllData: true,
              grouping: true,
              selection: true,
            }}
          />
        </div>
      </div>
    );
};

export default Table;