import React, { useState } from "react";
import { Card, Button } from "react-bootstrap";
import Iframe from 'react-iframe';

// This is a card component that is from bootstrap used to display the patent via an IFrame
const PatentCard = (props) => {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <Card style={{ width: "105%" }}>
        <Card.Body>
        <Button 
          disabled={
            currentPage <= 1
          } 
          onClick={
            () => { 
              setCurrentPage(currentPage - 1);
              document.getElementById("patent-pdf").src = checkID(props.patents, currentPage);
            }
          }
          style={{marginBottom: "1%"}}
        >Previous Page</Button>
        <Button
          style={{marginLeft: "80%"}} 
          onClick={
            () => { 
              setCurrentPage(currentPage + 1);
              document.getElementById("patent-pdf").src = checkID(props.patents, currentPage); 
            }
          }
        >Next Page</Button>
        <Iframe
            id="patent-pdf"
            url={checkID(props.patents, currentPage)}
            width="100%"
            height="1000px"
            className="size"
            display="initial"
            postion="relative"
        />
      </Card.Body>
    </Card>
  );
}

// This function is used to check the patent documentID and append it to the correct url needed to dispaly.
// The if statement was created to avoid a sync issue with the state from the parent component

function checkID(patents, currentPage){

   if(patents !== undefined && patents !== []){
       //console.log(patents)

       // pdfpiw.uspto.gov: expects 'RE' is converted -> '00' for API call
       var id = patents[0].documentId.toString()
       id = id.replace('RE', '00');

       if(patents[0].patentCorpus === "USPAT") // ex: 04021701 
       {

         while(id.length < 8) // pad the patent number to 8 characters.
         {
           id = "0" + id;
         }

         return ("https://pdfpiw.uspto.gov/"+id.substring(6, 8)+"/"+id.substring(3, 6)+"/"+id.substring(0, 3)+"/"+currentPage+".pdf")
       
       }
       else if (patents[0].patentCorpus === "PGPUB") // ex: 20170205789
       {
         return ("https://pdfaiw.uspto.gov/"+id.substring(9,11)+"/"+id.substring(0,4)+"/"+id.substring(7,9)+"/"+id.substring(4,7)+"/"+currentPage+".pdf")

         // DO NOT REMOVE: this website allows us to search for patents by number and extract the API by inspecting the frame URL.
         //return ("https://appft.uspto.gov/netacgi/nph-Parser?Sect1=PTO2&Sect2=HITOFF&u=%2Fnetahtml%2FPTO%2Fsearch-adv.html&r=1&f=G&l=50&d=PG01&p=1&S1="+id+".PGNR.&OS=DN/"+id+"&RS=DN/"+id);
       }
  } 
}

export default PatentCard;
