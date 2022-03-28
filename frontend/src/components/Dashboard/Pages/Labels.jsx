import React, { useState, useEffect } from "react";
import Nav from "../components/DashboardNavigation";
import MaterialTable from "material-table";
const Cohen = require('cohens-kappa');

const Table = () => {
    
    const [rowData, setRowData] = useState([]);

    const COLUMNS = [ 
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
  ]
  
    useEffect(() => {
      async function fetchData() {
        try {
          
          // we are using fetch to call the backend endpoint that contains all 300 patents.
          const response = await fetch("/patents-api/labels");
  
          const body = await response.json();
          // body is an object with the response 
          
          setRowData(body);
          

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
            columns={COLUMNS}
            data={rowData}
            isLoading={rowData.length === 0}
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
        </div>
      </div>
    );
};

export default Table;