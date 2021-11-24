import React, { useState, useEffect, Fragment } from "react";

import { Tab, Row, Col, Container, Nav as NavBar } from 'react-bootstrap';
import axios from 'axios';
import Nav from "../components/DashboardNavigation";

const ViewQueues = () => {
    const [queuesPerUser, setQueuesPerUser] = useState(new Map())
    const [loaded, setLoaded] = useState(false)
    const [error, setError] = useState("")


    useEffect(() => {

        function fetchActiveQueues() {
            try {
                axios("/patents-api/getAllQueues")
                .then((res) => {
                    if (res.message) {
                        setError(res.data.message)
                    } else {
                        findQueueUsers(res.data[0]) // findQueueUsers(queues)
                    }
                }).catch(err => setError(err))
            } catch (e) { }
        };

        function findQueueUsers(queues) {
            try {
                let usersArray = []
                for (const queue of queues) {
                    usersArray.push(queue.userId)
                }
                axios.post("/users/findUser", {IDs: usersArray})
                .then((res) => {
                    if (res.data.message) { 
                        setError(res.data.message)
                    } else {
                        sortQueuesByUsers(queues, res.data) // sortQueuesByUsers(queues, users)
                    }
                }).catch(err => setError(err))

            } catch (e) { }

        };

        function sortQueuesByUsers(queues, users) {
            let map = new Map()
            for (const user of users) {
                map.set(`${user._id}`, [])
            }
            for (const queue of queues) {
                map.get(queue.userId).push(queue)
            }
            setQueuesPerUser(map)
            setLoaded(true)
        };

        fetchActiveQueues()

    }, [])


    function printInfo() {
        if (!(queuesPerUser.size > 0)) {
            return (<div>{error}</div>)
        }else{
            return Array.from(queuesPerUser).map(([key,values])=>{
                return(
                      <Fragment>
                            <Col sm={3} md={3} lg={3}>
                                <NavBar variant="pills" className="flex-column">
                                    <NavBar.Item>
                                        {/* print user name */}
                                        <NavBar.Link eventKey={key}>User Id: {key}</NavBar.Link>  
                                    </NavBar.Item>
                                </NavBar>
                            </Col>
                            <Col sm={9} md={7} lg={8} >
                                <Tab.Content>
                                    {
                                        values.map((q) => {
                                            return (
                                                        <Tab.Pane eventKey={key} >
                                                            <Container className="text-center">
                                                                <p>Queue ID: {q._id}</p>
                                                                <ul style={{'list-style-type': 'none'}} >
                                                                    { q.items.length > 0?
                                                                         q.items.map( (item) => {
                                                                            return <li>Patent Number: {item}</li>
                                                                         })
                                                                      :
                                                                         <li>This queue is empty</li>
                                                                    }
                                                                </ul>
                                                            </Container>
                                                        </Tab.Pane>
                                            )})
                                    }
                                </Tab.Content>
                            </Col>
                      </Fragment>
       
                )})
        }            
    };

    return (
        <Container>
            <Nav />
            <h1 className="text-center">Active Queues by User</h1>
            <Fragment>
                {
                    loaded?
                        <Container fluid>
                            <Tab.Container id="left-tabs-example" defaultActiveKey="first">
                                <Row className="justify-content-sm-center">
                                   {printInfo()}
                                </Row>
                            </Tab.Container>  
                        </Container>
                    :
                    <Container>Loading...</Container>
                }
            </Fragment>
        </Container>

    );


}

export default ViewQueues;