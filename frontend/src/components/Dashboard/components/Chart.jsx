import React, { useEffect } from "react";
import { useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import axios from "axios";

import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";

const Chart = (props) => {

  const [data, setData] = useState({ svm_metrics: { 
    model_filename: 'Loading...',
    initializedAt: 'Loading...'  
  }});  

  const [chartData, setChartData] = useState({});
  const [chartData2, setChartData2] = useState({});
  const [svmMetrics, setSvmMetrics] = useState({});

  const chart = async () => {
    axios({
      url: "/patents-api/chart", // route in backend
      method: "GET"
    })
    .then((response) => {
      if (response.status === 200) {
        console.log(response.data)
        setData(response.data)
      }
    })
    .catch((error) => {
      alert(error.response.data);
    });
  };

  const update_f1_score = async () => {
    axios({
      url: "/patents-api/svm/calc_f1_score", // route in backend
      method: "GET"
    })
    .then((response) => {
      if (response.status === 200) {
        setData({ svm_metrics: { 
          model_filename: 'Loading...',
          initializedAt: 'Loading...'  
        }}); // trigger table refresh
        chart()
      }
    })
    .catch((error) => {
      alert(error.response.data);
    });
  };

  useEffect(() => {
    chart();
  }, []);

  // update chart data once data has been retrieved:
  useEffect(() => {
    setChartData({
      labels:["Annotated Patents", "Agreed Patents", "Disagreed Patents", "Total" ], // name of category
      datasets: [{
          label: '# of Patents Annotated',
          data: [data.unique, data.agreed, data.disagreed, data.total], // number of patents annotated
          backgroundColor:'rgba(121, 173, 220,1)',
         
        }],
      borderWidth: 0,
    });
    setSvmMetrics({
      labels:['Uncertain Patents Sampled', 'Service Start', 'Current Score'], // name of category
      datasets: [{
          label: 'F1 Score',
          data: [data.svm_metrics.uncertain_F1_score, data.svm_metrics.init_F1_score, data.svm_metrics.current_F1_score],
          backgroundColor:'rgba(121, 173, 220,1)'         
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
  }, [data]);

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
          <div className="row" style={{ marginBottom: '5%' }}>
            <div className="col-lg-6 col-sm-6">
              <Card>
                <Card.Header>
                  <Card.Title>Active Learning Metrics</Card.Title>
                  <br/>
                  <br/>
                  <table style={{ width: '100%' }}>
                    <tr>
                      <td>
                        <Card.Subtitle className="mb-4 text-muted">
                          Model Loaded:
                        </Card.Subtitle>
                      </td>
                      <td style={{textAlign: 'center'}}>
                        <Card.Subtitle className="mb-2">
                          {data.svm_metrics.model_filename}
                        </Card.Subtitle>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Card.Subtitle className="mb-2 text-muted">
                          Service {data.svm_metrics.model_filename == 'offline' ? 'Last' : ''} Started:
                        </Card.Subtitle>
                      </td>
                      <td style={{textAlign: 'center'}}>
                        <Card.Subtitle className="mb-2">
                          {new Date(data.svm_metrics.initializedAt).toString()}
                        </Card.Subtitle>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Card.Subtitle className="mb-2 text-muted">
                          Current Score Last Updated:
                        </Card.Subtitle>
                      </td>
                      <td style={{textAlign: 'center'}}>
                        <Card.Subtitle className="mb-2">
                          {new Date(data.svm_metrics.updatedAt).toString()}
                        </Card.Subtitle>
                      </td>
                      <td>
                        <Card.Subtitle className="mb-2">
                          <Button 
                            variant="success"
                            onClick={update_f1_score}
                            disabled={data.svm_metrics.model_filename == 'offline'}>
                            Update F1 Score
                          </Button>
                        </Card.Subtitle>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Card.Subtitle className="mb-2 text-muted">
                          Uncertain Patents were Sampled:
                        </Card.Subtitle>
                      </td>
                      <td style={{textAlign: 'center'}}>
                        <Card.Subtitle className="mb-2">
                          {new Date(data.svm_metrics.uncertainUpdatedAt).toString()}
                        </Card.Subtitle>
                      </td>
                    </tr>
                  </table>
                </Card.Header>
                <Card.Body>
                  <Bar 
                  data={svmMetrics}
                  options={{
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            }
                        }]
                    }
                }}/>
                </Card.Body>
              </Card>
            </div>
          </div>
        </div>
        {/* /.container-fluid */}
      </div>
      {/* /.content */}
    </div>
  );
};

export default Chart;
