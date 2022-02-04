import React, { useEffect, useState } from "react";
import { Button, Form, FormCheck} from "react-bootstrap";
import { useForm } from "react-hook-form";
import axios from "axios";
import { AiFillQuestionCircle } from 'react-icons/ai';
import { useHistory } from "react-router";
import ReactTooltip from "react-tooltip";

const PatentForm = (props) => {
  const history = useHistory();
  const { register, handleSubmit, formState: {isDirty} } = useForm();

  const [mal, setMal] = useState("No");
  const [hdw, setHdw] = useState("No");
  const [evo, setEvo] = useState("No");
  const [nlp, setNlp] = useState("No");
  const [spc, setSpc] = useState("No");
  const [vis, setVis] = useState("No");
  const [kpr, setKpr] = useState("No");
  const [pln, setPln] = useState("No");
  const [none, setNone] = useState("No");

  // Load the values (if-any) from the annotation into the form:
  useEffect(() => {
    if(props.patents !== undefined)
    {
      const patents = props.patents;
      console.log(patents)
      if(patents.mal !== undefined && patents.mal !== mal) { setMal(patents.mal); }
      if(patents.hdw !== undefined && patents.hdw !== hdw) { setHdw(patents.hdw); }
      if(patents.evo !== undefined && patents.evo !== evo) { setEvo(patents.evo); }
      if(patents.nlp !== undefined && patents.nlp !== nlp) { setNlp(patents.nlp); }
      if(patents.spc !== undefined && patents.spc !== spc) { setSpc(patents.spc); }
      if(patents.vis !== undefined && patents.vis !== vis) { setVis(patents.vis); }
      if(patents.kpr !== undefined && patents.kpr !== kpr) { setKpr(patents.kpr); }
      if(patents.pln !== undefined && patents.pln !== pln) { setPln(patents.pln); }
      if(patents.none !== undefined && patents.none !== none) { setNone(patents.none); }
    }
  }, [props.patents]);

  const onSubmit = (data) => {
    // This is using axios to make a post request to our backend and send {name,email,password}
    // and store it in mongoDB
    axios({
      url: "/patents-api/labels", // route in backend
      method: "POST",
      data: {
        documentId: props.patents.documentId,
        mal: data.mal,
        hdw: data.hdw,
        evo: data.evo,
        spc: data.spc,
        vis: data.vis,
        nlp: data.nlp,
        pln: data.pln,
        kpr: data.kpr,
        none: data.none
      },
    })
      .then((response) => {
        window.location.reload(false);
      })
      .catch((error) => {
        console.log("error: ", error.data);
      });
  };
  const dequeue = () => {
    axios({
      url: "/patents-api/queue/remove", // route in backend
      method: "POST",
      data: {
        documentId: props.patents.documentId,
      },
    })
      .then((response) => {
        props.updatePatentId(response.data.documentId);
        props.updatePatents(response.data);
        
        resetForm();
      })
      .catch((error) => {
        console.log("error: ", error);
      });
  };

  const updateFormCheck = (val, setFunction) => {
    setFunction((val === "Yes") ? "No" : "Yes");
  }

  const resetForm = () => {
    setMal("No");
    setHdw("No");
    setEvo("No");
    setNlp("No");
    setSpc("No");
    setVis("No");
    setKpr("No");
    setPln("No");
    setNone("No");
  }

  return (
    <div>
      <Form
        className="container mt-5"
        method="POST"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Form.Group>
          <Form.Label>
          Machine Learning Patent <AiFillQuestionCircle data-tip data-for="machineLearningTip"/>
          <ReactTooltip id="machineLearningTip" place="top" effect="solid">
            Any patents related to refining AI systems to automatically learn and improve from experience via input and output
          </ReactTooltip>
          </Form.Label>
          <div className='row-2'>
          <FormCheck name="mal" inline type="radio" label="Yes" value='Yes' ref={register} checked={mal === "Yes"} onChange={() => {updateFormCheck(mal, setMal)}}/>
          <FormCheck name="mal" inline type="radio" label="No"  value= 'No' ref={register} checked={mal === "No"} onChange={() => {updateFormCheck(mal, setMal)}}/>
          </div>
        </Form.Group>

        <Form.Group>
          <Form.Label>
          AI Hardware Patent <AiFillQuestionCircle data-tip data-for="aiHardwareTip"/>
          <ReactTooltip id="aiHardwareTip" place="top" effect="solid">
            Any patents related to computers and components that make an AI 
          </ReactTooltip>
          </Form.Label>
          <div className='row-2'>
          <FormCheck  name="hdw" inline type="radio" label="Yes"  value='Yes' ref={register} checked={hdw === "Yes"} onChange={() => {updateFormCheck(hdw, setHdw)}}/>
          <FormCheck  name="hdw"inline type="radio" label="No"  value= 'No' ref={register} checked={hdw === "No"} onChange={() => {updateFormCheck(hdw, setHdw)}}/>
          </div>
        </Form.Group>
        
        <Form.Group>
          <Form.Label>
          Evolutionary Computation Patent <AiFillQuestionCircle data-tip data-for="evolCompTip"/>
          <ReactTooltip id="evolCompTip" place="top" effect="solid">
            Any patents related to computational routines that create models while improving its own algorithm
          </ReactTooltip>
          </Form.Label>
          <div className='row-2'>
          <FormCheck  name="evo" inline type="radio" label="Yes" value='Yes' ref={register} checked={evo === "Yes"} onChange={() => {updateFormCheck(evo, setEvo)}}/>
          <FormCheck  name="evo" inline type="radio" label="No" value= 'No' ref={register} checked={evo === "No"} onChange={() => {updateFormCheck(evo, setEvo)}}/>
          </div>
        </Form.Group>

        <Form.Group>
          <Form.Label>
          Natural Language Processing Patent <AiFillQuestionCircle data-tip data-for="natLangTip"/>
          <ReactTooltip id="natLangTip" place="top" effect="solid">
            Any patents related to understanding and using data found in written langauge
          </ReactTooltip>
          </Form.Label>
          <div className='row-2'>
          <FormCheck name="nlp" inline type="radio" label="Yes" value='Yes' ref={register} checked={nlp === "Yes"} onChange={() => {updateFormCheck(nlp, setNlp)}}/>
          <FormCheck name="nlp" inline type="radio" label="No"  value= 'No' ref={register} checked={nlp === "No"} onChange={() => {updateFormCheck(nlp, setNlp)}}/>
          </div>
        </Form.Group>

        <Form.Group>
          <Form.Label>
          Speech Patent <AiFillQuestionCircle data-tip data-for="speechTip"/>
          <ReactTooltip id="speechTip" place="top" effect="solid">
            Any patents related to techniques in understanding words, phrases, or language 
          </ReactTooltip>
          </Form.Label>
          <div className='row-2'>
          <FormCheck name="spc" inline type="radio" label="Yes" value='Yes' ref={register} checked={spc === "Yes"} onChange={() => {updateFormCheck(spc, setSpc)}}/>
          <FormCheck name="spc" inline type="radio" label="No"  value= 'No' ref={register} checked={spc === "No"} onChange={() => {updateFormCheck(spc, setSpc)}}/>
          </div>
        </Form.Group>

        <Form.Group>
          <Form.Label>
          Vision Patent <AiFillQuestionCircle data-tip data-for="visionTip"/>
          <ReactTooltip id="visionTip" place="top" effect="solid">
            Any patents related to the extraction or understanding of images and videos through computer vision 
          </ReactTooltip>
          </Form.Label>
          <div className='row-2'>
          <FormCheck name="vis" inline type="radio" label="Yes" value='Yes' ref={register} checked={vis === "Yes"} onChange={() => {updateFormCheck(vis, setVis)}}/>
          <FormCheck name="vis" inline type="radio" label="No"  value= 'No' ref={register} checked={vis === "No"} onChange={() => {updateFormCheck(vis, setVis)}}/>
          </div>
        </Form.Group>

        <Form.Group>
          <Form.Label>
          Knowledge Processing Patent <AiFillQuestionCircle data-tip data-for="knowProcTip"/>
          <ReactTooltip id="knowProcTip" place="top" effect="solid">
            Any patents related to deriving facts about the world and using those facts in automated systems
          </ReactTooltip>
          </Form.Label>
          <div className='row-2'>
          <FormCheck name="kpr" inline type="radio" label="Yes" value='Yes' ref={register} checked={kpr === "Yes"} onChange={() => {updateFormCheck(kpr, setKpr)}}/>
          <FormCheck name="kpr" inline type="radio" label="No"  value= 'No' ref={register} checked={kpr === "No"} onChange={() => {updateFormCheck(kpr, setKpr)}}/>
          </div>
        </Form.Group>

        <Form.Group>
          <Form.Label>
          Planning/Control Patent <AiFillQuestionCircle data-tip data-for="planControlTip"/>
          <ReactTooltip id="planControlTip" place="top" effect="solid">
            Any patents related to identifying, creating, or executing tasks in order to achieve a specific goal
          </ReactTooltip>
          </Form.Label>
          <div className='row-2'>
          <FormCheck  name="pln" inline type="radio" label="Yes" value='Yes' ref={register} checked={pln === "Yes"} onChange={() => {updateFormCheck(pln, setPln)}}/>
          <FormCheck  name="pln" inline type="radio" label="No"  value= 'No' ref={register} checked={pln === "No"} onChange={() => {updateFormCheck(pln, setPln)}}/>
          </div>
        </Form.Group>

        <Form.Group>
          <Form.Label>
          None of the Above 
          </Form.Label>
          <div className='row-2'>
          <FormCheck  name="none" inline type="radio" label="Yes" value='Yes' ref={register} checked={none === "Yes"} onChange={() => {updateFormCheck(none, setNone)}}/>
          <FormCheck  name="none" inline type="radio" label="No"  value= 'No' ref={register} checked={none === "No"} onChange={() => {updateFormCheck(none, setNone)}}/>
          </div>
        </Form.Group>

        <div className="justify-content-around mt-5">
          <Button 
            disabled={!isDirty} 
            type="submit" 
            variant="primary" 
            size="lg" 
            className="col-3" 
            style={{marginBottom: "2%"}}
          >
            {" "}
            Submit
          </Button>
          <Button
            variant="danger"
            size="lg"
            className="col-3"
            onClick={dequeue}
            style={{display: "block"}}
            disabled={history.location.pathname==="/Search"}
          >
            {" "}
            Skip
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default PatentForm;
