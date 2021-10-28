import React from "react";
import { useHistory } from "react-router";
import { Card, ListGroup } from "react-bootstrap";

const PatentQueue = (props) => {
    const history = useHistory()
    const queueIndex = history.location.state ? history.location.state['queueIndex'] : undefined;

    // set the initial state of the queue:
    if(props.patents !== undefined)
    {
        if(queueIndex === undefined)
        {
            if(props.patents[1].length > 0)
            {
                history.push({ // at this point we are loading the first item on the queue:
                    pathname: history.location.pathname,
                    state: { 
                        queueIndex: 0,
                        queueLength: props.patents[1].length
                    }
                })
            }
        }
    }


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
                                        pathname: '/Patents',
                                        state: { 
                                            queueIndex: index,
                                            queueLength: props.patents[1].length
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
