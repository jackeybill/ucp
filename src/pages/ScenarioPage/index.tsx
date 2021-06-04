import React, { useState, useReducer, useEffect} from 'react';
import { withRouter } from 'react-router';
import {Input, Button } from "antd";
import {LeftOutlined } from "@ant-design/icons";
import "./index.scss";

import NewScenarioStepTwo from "../../components/NewScenarioStepTwo";

const { TextArea } = Input;

const step1 = 'Scenario';
const step2 = 'Criteria';
const step3 = 'Schedule';

const initialStates = {
    scenario_id: "",
    scenario_name: "",
    scenario_description: "",
    protocol_amendment_rate: "",
    screen_failure_rate: "",
    patient_burden: "",
    cost: "",
    "Inclusion Criteria": {},
    "Exclusion Criteria": {},
    "Enrollment Feasibility": {},
    "Schedule of Events": {}
  };

  var scenarioSize = 0

const ScenarioPage = (props) => {

    const [currentAddStep, setCurrentAddStep] = useState(step1)
    const [scenario, setScenario] = useReducer(
        (state, newState) => ({ ...state, ...newState }),
        { ...initialStates }
    );

    useEffect(() => {
        if(props.location.state.scenarios == undefined){
            props.location.state.scenarios = []
        }
        scenarioSize = props.location.state.scenarios.length + 1
    });

    const next = (step) =>{
        props.location.state.scenarios.push(scenario)
        setCurrentAddStep(step)
    }

    const handleInputChange = (key, e) => {
        setScenario({
          [key]: e.target.value,
        });
        setScenario({
            ['scenario_id']: scenarioSize,
        });
    };
    

    return (
        <div className="action-container">
            <div className="action-title" onClick={()=>props.history.push('/trials')}>
                <span><LeftOutlined /> Trial Page</span>
            </div>

            <div className="action-timeline">
                <div className="step">
                    {currentAddStep == step1 ?(
                        <span className="num active">1</span>
                    ) : (
                        <span className="num passed">1</span>
                    ) }
                    <span className={`name ${currentAddStep == step1 ? 'active' : 'passed'}`}>Scenario Details</span>
                </div>
                <div className="line"></div>
                <div className="step">
                    <span className={`num ${currentAddStep == step1 ? 'in-active' : currentAddStep == step2? 'active' : 'passed'}`}>2</span>
                    <span className={`name ${currentAddStep == step1 ? 'in-active' : currentAddStep == step2? 'active' : 'passed'}`}>Add Inclusion / Exclusion Criteria</span>
                </div>
                <div className="line"></div>
                <div className="step">
                    <span className={`num ${currentAddStep == step3 ? 'active' : 'in-active'}`}>3</span>
                    <span className={`name ${currentAddStep == step3 ? 'active' : 'in-active'}`}>Add Schedule of Events</span>
                </div>
            </div>

            
            {currentAddStep == step1 ? (
                <>
                <div className="scenario-container">
                    <h3>Scenario Details</h3>
                    <div className="scenario-item">
                        <label htmlFor="">Scenario Name</label><br/>
                        <Input style={{ width: 200, height: 30 }} 
                            onChange={(e) => handleInputChange("scenario_name", e)}
                            value={scenario["scenario_name"]}/>
                    </div>
                    <div className="scenario-item">
                        <label htmlFor="">Description</label><br/>
                        <TextArea value={scenario["scenario_description"]} 
                            onChange={(e) => handleInputChange("scenario_description", e)}
                            autoSize={{ minRows: 3, maxRows: 5 }}/>
                    </div>

                    <div className="action-footer">
                        <Button type="primary" onClick={()=>next(step2)}>NEXT</Button>
                        <Button className="view-btn" onClick={()=>props.history.push('/trials')}>CANCEL</Button>
                    </div>
                </div>
                </>
            ) : currentAddStep == step2 ? (
                <>
                <NewScenarioStepTwo record={props.location.state}/>
                </>
            ) : (
                <>
                <h3>step3</h3>
                </>
            )}
            
        </div>
        
    )
    
}


export default withRouter(ScenarioPage);
