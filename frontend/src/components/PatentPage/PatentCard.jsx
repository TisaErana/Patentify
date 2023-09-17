import React, { useState } from "react";
import { Card, Button } from "react-bootstrap";
import Iframe from 'react-iframe';

// This is a card component that is from bootstrap used to display the patent via an IFrame
const PatentCard = (props) => {

  return (
    <Iframe
      id="patent-pdf"
      url={checkID(props.patents)}
      width="100%"
      height="1000px"
      className="size"
      display="initial"
      postion="relative"
    />
  );
}

// This function is used to check the patent documentID and append it to the correct url needed to dispaly.
// The if statement was created to avoid a sync issue with the state from the parent component

function checkID(patents){

   if(patents !== undefined && patents !== []){
       //console.log(patents)

       // pdfpiw.uspto.gov: expects 'RE' is converted -> '00' for API call
       var id = patents.documentId.toString()
       //id = id.replace('RE', '00');

       if(patents.patentCorpus === "USPAT") // ex: 04021701 
       {

         // while(id.length < 8) // pad the patent number to 8 characters.
         // {
         //   id = "0" + id;
         // }

         //return ("https://pimg-fpiw.uspto.gov/fdd/"+id.substring(6, 8)+"/"+id.substring(3, 6)+"/"+id.substring(0, 3)+"/0.pdf")
         return ("https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/" + id)

       }
       else if (patents.patentCorpus === "PGPUB") // ex: 20170205789
       {
         //return ("https://pdfaiw.uspto.gov/fdd/"+id.substring(9,11)+"/"+id.substring(0,4)+"/"+id.substring(7,9)+"/"+id.substring(4,7)+"/0.pdf")
         return ("https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/" + id)
       }
  } 
}

export default PatentCard;


// DO NOT REMOVE: these websites allows us to search for patents by number and extract the API by inspecting the frame URL:
// https://www.uspto.gov/patents/search#toc-uspto-patent-full-text-and-image-database-patft-
// https://appft.uspto.gov/netacgi/nph-Parser?Sect1=PTO2&Sect2=HITOFF&u=%2Fnetahtml%2FPTO%2Fsearch-adv.html&r=1&f=G&l=50&d=PG01&p=1&S1="+id+".PGNR.&OS=DN/"+id+"&RS=DN/"+id

// Examples of API usage:
// https://pimg-fpiw.uspto.gov/fdd/21/787/040/0.pdf
// https://pdfaiw.uspto.gov/fdd/98/2018/85/012/0.pdf