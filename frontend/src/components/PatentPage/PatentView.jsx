import React, { useState, useEffect, Fragment } from "react";
import { useHistory } from "react-router";
import PatentCard from "../PatentPage/PatentCard";
import PatentForm from "../PatentPage/PatentForm";


const PatentView = (props) => {
  const history = useHistory();
  
  const [error, setError] = useState(); //             stores errors to display to the user.
  const [patents, setPatents] = useState(); //         object with patents assigned to user.
  const [patentId, setPatentId] = useState(); //       stores the documentId of the current patent.

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
          setPatentId(body[0].documentId);
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

        setPatentId(body.documentId);
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
      <div className="row" style={{width: "145%"}}>
        {error ? 
        <div style={{marginLeft: "1%"}}><h2>{error}</h2></div> : 
        <Fragment>
          <div className="col-sm-2 col-lg-6 col-md-6" style={{maxWidth: "58%"}}>
            <h2>Patent ID: {patentId}</h2>
            <PatentCard patents={patents} />
          </div>
          <div className="col-sm-2 col-lg-6 col-md-6">
            <PatentForm patents={patents} updatePatents={setPatents} updatePatentId={setPatentId}/>
          </div>
        </Fragment>
        }  
      </div>
    </div>
  );
  
};

export default PatentView;
