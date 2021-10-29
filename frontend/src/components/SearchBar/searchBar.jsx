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

        history.go(0)
    }
    
    
    return(
        
        <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formSearchBar">
                <Form.Control type="text" placeholder="Search by Patent Number" onChange={e => setPatentNum(e.target.value)}/>
                <Button variant="primary" type="submit" >
                     Submit
                </Button>
            </Form.Group>
            
        </Form>
      
    );

}




export default SearchBar