import React, {useState} from 'react';
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import { useHistory } from 'react-router';

const SearchBar = ()=> {
    const [patentNumber, setPatentNum] = useState("");
    const history = useHistory();

    const handleSubmit= (evt)=>{
        evt.preventDefault()
        history.push({
            pathname: '/Search',
            state: { 
                patentSearchId: patentNumber,
                weAreSearching: true 
            }
        })
        history.go(0);
    }

    return(
        <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formSearchBar">
                <Form.Control type="text" placeholder="Search by Document Number" onChange={e => setPatentNum(e.target.value)} style={{width: "280px"}}/>
                <Button variant="primary" type="submit" style={{ marginLeft: "5%", paddingLeft: "4%", paddingRight: "4%" }} >
                     Submit
                </Button>
            </Form.Group>  
        </Form>
    );

}




export default SearchBar