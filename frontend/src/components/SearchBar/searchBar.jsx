import React, {useState} from 'react';
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'

const SearchBar = ()=> {
    const [patentNumber, setPatentNum] = useState("");

    const handleSubmit= (evt)=>{
       evt.preventDefault()
       console.log(patentNumber)
       
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