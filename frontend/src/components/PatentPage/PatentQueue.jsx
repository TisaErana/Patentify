import React from "react";
import axios from "axios";
import { useHistory } from "react-router";
import { Button, Card, ListGroup } from "react-bootstrap";

const PatentQueue = (props) => {
    const history = useHistory();

    const isQueueEmpty = props.patents !== undefined && props.patents[1].length === 0;

    const addPatent = () => {
        axios({
          url: "/patents-api/queue/add", // route in backend
          method: "POST",
          data: {
            documentId: props.patents[0].documentId,
          },
        })
          .then((response) => {
            history.push({
                pathname: history.location.pathname,
                state: { 
                    queueIndex: 0
                }
            })
            history.go(0);
          })
          .catch((error) => {
            console.log("Error: ", error.data);
          });
      };

      const removePatent = () => {
        axios({
          url: "/patents-api/queue/remove", // route in backend
          method: "POST",
          data: {
            documentId: props.patents[0].documentId,
          },
        })
          .then((response) => {
            history.push({
                pathname: history.location.pathname,
                state: { 
                    queueIndex: undefined
                }
            })
            history.go(0);
          })
          .catch((error) => {
            console.log("Error: ", error.data);
          });
      };

    return (
        <Card style={{marginTop: "2%", width: "52%"}}>
            <ListGroup>
                <h1 style={{textAlign: "center"}}>Patent Queue</h1>
                { 
                    (props.patents !== undefined) ? // make sure we've loaded the patent from the database first.
                        props.patents[1].map((item, index) => ( // patents[0]: current patent, patents[1]: queue of patents.
                            <ListGroup.Item 
                                key={index} 
                                action variant="dark"
                                active={item === props.patents[0].documentId}
                                disabled={item === props.patents[0].documentId}
                                onClick={() => {
                                    history.push({
                                        pathname: history.location.pathname,
                                        state: { 
                                            queueIndex: index
                                        }
                                    })
                                    history.go(0);
                                }}
                            >{item}</ListGroup.Item>
                    )) : "Loading..." 
                }
                {
                    (isQueueEmpty) ? <h4>Empty</h4> : ""
                }
            </ListGroup>
            <div style={{display: "flex"}}>
                <Button
                    onClick={addPatent} 
                    style={{margin: "2%", width: "50%"}}>
                    Add Patent
                </Button>
                <Button
                    onClick={removePatent} 
                    style={{margin: "2%", width: "50%"}}
                    disabled={isQueueEmpty}>
                    Remove Patent
                </Button>
            </div>
        </Card>
    );
}

export default PatentQueue;
