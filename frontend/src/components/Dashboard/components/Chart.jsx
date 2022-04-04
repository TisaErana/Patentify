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
            backgroundColor:'rgba(121, 173, 220,1)',
           
          }],
        borderWidth: 0,
      });
      setChartData2({
        labels:["Machine Learning", "AI Hardware", "Evolutionary Computation", "Natural Language Processing", "Speech", "Vision", "Knowledge Processing", "Planning/Control"], // name of annotator
        datasets: [{
            label: '# of Patents Annotated',
            data: [data.ml, data.hard, data.evol, data.natural, data.spee, data.vision, data.know, data.plan], // number of patents annotated
            backgroundColor:['rgba(255, 192, 159, 1)', 'rgba(255, 238, 147,1)', 'rgba(252, 245, 199,1)', 'rgba(160, 206, 217,1)', 'rgba(173, 247, 182,1)', 'rgba(128, 155, 206,1)', 'rgba(214, 234, 223,1)', 'rgba(234, 196, 213,1)'],
           
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
