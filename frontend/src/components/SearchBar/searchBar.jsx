import React from 'react';
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'

const SearchBar = ()=> {
    
    return(
        
        <Form>
            <Form.Control type="text" placeholder="Search by Patent Number" />
            <Button variant="primary" type="submit">
               Submit
            </Button>
        </Form>
      
    );

}

export default SearchBar