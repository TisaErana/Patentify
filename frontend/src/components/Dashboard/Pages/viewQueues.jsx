import React, { useState, useEffect, Fragment } from "react";

import { Tab, Table, Row, Col, Container, Nav as NavBar } from 'react-bootstrap';
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
                        findQueueUsers(res.data) // findQueueUsers(queues)
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
            let map = new Map();
            for (const user of users) {
                map.set(`${user._id}`, [])
            }
            for (const queue of queues) {
                queue.details = users.find(user => user._id === queue.userId);
                map.get(queue.userId).push(queue);
            }
            setQueuesPerUser(map)
            setLoaded(true)
        };

        fetchActiveQueues()

    }, [])

    function padTo2Digits(num) {
        return num.toString().padStart(2, '0');
    }

    function convertMsToTime(milliseconds) {
        let seconds = Math.floor(milliseconds / 1000);
        let minutes = Math.floor(seconds / 60);
        let hours = Math.floor(minutes / 60);
      
        seconds = seconds % 60;
        minutes = minutes % 60;
      
        return `${padTo2Digits(hours)}:${padTo2Digits(minutes)}:${padTo2Digits(
          seconds,
        )}`;
      }

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
                                        <NavBar.Link eventKey={key}>
                                            <li>{values[0].details.name}</li>
                                            <li>{key}</li>
                                        </NavBar.Link>  
                                    </NavBar.Item>
                                </NavBar>
                            </Col>
                            <Col sm={9} md={7} lg={8} >
                                <Tab.Content>
                                    {
                                        values.map((q) => {
                                            const updatedAt = (new Date(q.updatedAt));
                                            return (
                                                    <Tab.Pane eventKey={key} >
                                                        <Container className="text-center">
                                                            <h5>Queue ID: {q._id}</h5>
                                                            <ul style={{'list-style-type': 'none'}} >
                                                                <Table>
                                                                    <tbody>
                                                                        <tr>
                                                                            <td>
                                                                                Patent Number: 
                                                                            </td>
                                                                            <td>
                                                                                {q.documentId}
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td>
                                                                                Elapsed Time: 
                                                                            </td>
                                                                            <td>
                                                                                { convertMsToTime(new Date() - updatedAt) }
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td>
                                                                                Expires In: 
                                                                            </td>
                                                                            <td> 
                                                                                {
                                                                                    // 864,000,000ms = 10 days
                                                                                    convertMsToTime(864000000 - (new Date() - updatedAt))
                                                                                } 
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td>
                                                                                Last Updated At: 
                                                                            </td>
                                                                            <td> 
                                                                                { updatedAt.toString() }
                                                                            </td>
                                                                        </tr>                                                                       
                                                                    </tbody>
                                                                </Table>
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
        <div style={{ paddingBottom: '5%' }}>
            <Nav />
            <h1 className="text-center" style={{paddingTop: '2%', paddingBottom: '3%' }}>Active Queues by User</h1>
            <div className="custom-box-component"
            style={{  
                padding: '2%', 
                backgroundColor: 'white', 
                maxWidth: '95%', 
                marginLeft: '2%'
            }}>
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
            </div>
        </div>
    );


}

export default ViewQueues;