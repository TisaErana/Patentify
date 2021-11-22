import React, { useState, useEffect, Fragment } from "react";

import { Tab, Row, Col, TabContainer, Nav as NavBar } from 'react-bootstrap';
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
                        sortQueuesByUsers(queues, res.data[0]) // sortQueuesByUsers(queues, users)
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
        if (queuesPerUser.size > 0) {
            for (const [key, values] of queuesPerUser.entries()) {
                return(
                    <Tab.Container id="left-tabs-example" defaultActiveKey="first">
                        <Row>
                            <Col sm={3}>
                                <NavBar variant="pills" className="flex-column">
                                    <NavBar.Item>
                                        {/* print user name */}
                                        <NavBar.Link eventKey={key}>User Id: {key}</NavBar.Link>  
                                    </NavBar.Item>
                                </NavBar>
                            </Col>
                        </Row>
                        <Col sm={9}>
                            <Tab.Content>
                                {printQueues(key, values)}
                            </Tab.Content>
                        </Col>
                    </Tab.Container>
                ) 
            }
        } else {
            return (<div>{error}</div>)
        }
    };
    function printQueues(userId, queuesArray) {

        return queuesArray.map((q) => {
            return (
                        <Tab.Pane eventKey={userId}>
                            <div>
                                <p>Queue ID: {q._id}</p>
                                <ul>
                                    { q.items.length > 0?
                                         q.items.map( (item) => {
                                            return <li>Patent Number: {item}</li>
                                         })
                                         :
                                         <li>This queue is empty</li>
                                    }
                                </ul>
                            </div>
                        </Tab.Pane>
            )
        })

    };

    return (
        <div>
            <Nav />
            <h1>Active Queues by User</h1>
            <div className="queueLists">
                {
                    loaded ?
                        <Fragment>
                            {printInfo()}
                        </Fragment>
                        :
                        <div>Loading...</div>
                }
            </div>
        </div>

    );


}

export default ViewQueues;