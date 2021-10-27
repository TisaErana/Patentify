import React, { useState } from "react";
import { Card, ListGroup } from "react-bootstrap";
import Iframe from 'react-iframe';


const PatentQueue = (props) => {
  return (
    <Card style={{marginTop: "2%", width: "52%"}}>
        <ListGroup>
            <h1 style={{textAlign: "center"}}>Patent Queue</h1>
            { 
                (props.patents !== undefined) ? // make sure we've loaded the patent from the database first.
                    props.patents[1].map((item, index) => ( // patents[0]: current patent, patents[1]: queue of patents.
                        <ListGroup.Item 
                            key={index} 
                            active={item === props.patents[0].documentId}
                            action variant="dark"
                        >{item}</ListGroup.Item>
                )) : "Loading..." 
            }
            {
                (props.patents !== undefined && props.patents[1].length === 0) ? // let the user know if the queue is empty.
                <h4>Empty</h4> : ""
            }
        </ListGroup>
    </Card>
  );
}

export default PatentQueue;
