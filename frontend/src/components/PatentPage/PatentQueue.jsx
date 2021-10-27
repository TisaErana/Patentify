import React from "react";
import { useHistory } from "react-router";
import { Card, ListGroup } from "react-bootstrap";

const PatentQueue = (props) => {
    const history = useHistory()
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
                                onClick={() => {
                                    history.push({
                                        pathname: '/Patents',
                                        state: { 
                                            patentId: item,
                                            queueIndex: index 
                                        }
                                    })
                                    history.go(0);
                                }}
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
