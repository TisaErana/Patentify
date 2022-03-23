import React, { useEffect } from "react";
import { useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import axios from "axios";

let data = {}
const Chart = (props) => {
  
  async function testaxios(){
    try{
  let res = await axios({
    url: "/patents-api/chart", // route in backend
    method: "GET",
  })

    return res.data
}
catch (error) {
  
};
}

  const [chartData, setChartData] = useState({});
  const [chartData2, setChartData2] = useState({});
  const chart = async () => {
   data = await testaxios();
    console.log(data);
    
    setChartData({
        labels:["Annotated Patents", "Agreed Patents", "Disagreed Patents", "Total" ], // name of category
        datasets: [{
            label: '# of Patents Annotated',
            data: [data.unique, data.agreed, data.disagreed, data.total], // number of patents annotated
            backgroundColor:'rgba(14,30,64,1)',
           
          }],
        borderWidth: 0,
      });
      setChartData2({
        labels:["Machine Learning", "AI Hardware", "Evolutionary Computation", "Natural Language Processing", "Speech", "Vision", "Knowledge Processing", "Planning/Control"], // name of annotator
        datasets: [{
            label: '# of Patents Annotated',
            data: [data.ml, data.hard, data.evol, data.natural, data.spee, data.vision, data.know, data.plan], // number of patents annotated
            backgroundColor:['rgba(30,30,30,1)', 'rgba(36,56,85,1)', 'rgba(98,60,5,1)', 'rgba(38,74,31,1)', 'rgba(70,150,18,1)', 'rgba(150,39,69,1)', 'rgba(70,46,70,1)', 'rgba(200,100,5,1)'],
           
          }],
        borderWidth: 0,
      });
    };
    


  useEffect(() => {
    chart();
  }, []);

  return (
    <div>
      {/* /.content-header */}
      {/* Main content */}
      <div className="content mt-5 ">
        <div className="container-fluid">
          <div className="row">
            <div className="col-lg-6 col-sm-6">
              <div className="card">
                <div className="card-header border-0">
                  <div className="d-flex justify-content-between">
                    <h3 className="card-title">Annotator Activity</h3>
                  </div>
                </div>
                <div className="card-body">
                  <Bar data={chartData}/>
                </div>
              </div>
              {/* /.card */}
            </div>
            {/* /.col-md-6 */}
            <div className="col-lg-6 col-sm-6">
              <div className="card">
                <div className="card-header border-0">
                  <div className="d-flex justify-content-between">
                    <h3 className="card-title">Labels Compared</h3>
                  </div>
                </div>
                <div className="card-body">
                  <Pie data={chartData2} />
                </div>
              </div>
            </div>
          </div>
          {/* /.row */}
        </div>
        {/* /.container-fluid */}
      </div>
      {/* /.content */}
    </div>
  );
};

export default Chart;
