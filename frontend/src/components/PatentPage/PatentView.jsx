import React, { useState, useEffect, Fragment } from "react";
import { useHistory } from "react-router";
import PatentCard from "../PatentPage/PatentCard";
import PatentForm from "../PatentPage/PatentForm";

function title(str) {
  var splitStr = str.toLowerCase().split(' ');
  for (var i = 0; i < splitStr.length; i++) {
      splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
  }
 
  return splitStr.join(' '); 
}

const PatentView = (props) => {
  const history = useHistory();
  
  const [error, setError] = useState(); //                    stores errors to display to the user.
  const [patents, setPatents] = useState(); //                object with patents assigned to user.

  const [patentId, setPatentId] = useState(); //              stores the documentId of the current patent.
  const [patentTitle, setPatentTitle] = useState(); //        stores the title of the current patent.
  const [patentAbstract, setPatentAbstract] = useState(); //  stores the abstract of the current patent.

  useEffect(() => {
    const weAreSearching = history.location.state ? history.location.state['weAreSearching'] : false;
    const patentSearchId = history.location.state ? history.location.state['patentSearchId'] : undefined;

    async function searchBar(){
      try {     
        // we are using fetch to call the backend endpoint that contains all 368 patents.
        const response = await fetch(`/patents-api/search`,{
          method:'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({patentSearchId})
        });
  
        const body = await response.json();
        if(body.message) {
          setPatents(undefined)
          setError(body.message)
        }
        else {
          setPatentTitle(title(body.title));
          setPatentId(body.documentId);
          setPatentAbstract(body.abstract);
          setPatents(body);
        }
      } catch(error) {}
    }

    async function fetchData() {
      try {
        // we are using fetch to call the backend endpoint that contains all 368 patents.
        const response = await fetch("/patents-api/")
  
        const body = await response.json();
        // body is an object with the response 

        setPatentTitle(title(body.title));
        setPatentId(body.documentId);
        setPatentAbstract(body.abstract);
        setPatents(
          /* This sets the state of patents to be an object that contains only the documentID and Patent Corpus
          // we map throught the object to acxomplish this

          No longer needed but good example of using map function:

          body.map((id) => {
            return { documentId: id.documentId, patentCorpus: id.patentCorpus };
          })*/
          body
        );
      } catch (error) {}
    }
    
    if(weAreSearching) { searchBar(); }
    else { fetchData(); }

  }, []);
  
  return (
    <div className="container-fluid mt-5">
      <div className="row">
        {error ? 
        <div style={{marginLeft: "1%"}}><h2>{error}</h2></div> : 
        <Fragment>
          <div className="col-sm-8 col-lg-3 col-md-7">
            <h3 style={{ marginTop: "45%" }}>Abstract</h3>
            <div style={{ fontSize: "14px", color: 'black', weight: "bold" }}>{patentAbstract}</div>
          </div>
          <div className="col-sm-10 col-lg-6 col-md-8">
            <h3>Patent ID: {patentId}</h3>
            <h4>{patentTitle}</h4>
            <PatentCard patents={patents} />
          </div>
          <div className="col-sm-7 col-lg-3 col-md-4">
            <PatentForm patents={patents} updatePatents={setPatents} updatePatentId={setPatentId}/>
          </div>
        </Fragment>
        }  
      </div>
    </div>
  );
  
};

export default PatentView;
