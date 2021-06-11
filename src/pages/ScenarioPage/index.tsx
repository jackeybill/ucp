import React, { useState, useReducer, useEffect} from 'react';
import {addScenario} from "../../utils/ajax-proxy";
import { withRouter } from 'react-router';
import {Input, Button, Row, Col, Steps, Divider} from "antd";
import {LeftOutlined } from "@ant-design/icons";
import "./index.scss";

import NewScenarioStepTwo from "../../components/NewScenarioStepTwo";

const { TextArea } = Input;
const { Step } = Steps;

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
    console.log(props.location.state)

    const [currentStep, setCurrentStep] = useState(0)
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

    const next = async () =>{
        console.log(currentStep)
        const step = currentStep + 1
        props.location.state.scenarios.push(scenario)
        if(currentStep == 0){
            const resp = await addScenario(props.location.state);
            console.log(props.location.state)
            if (resp.statusCode == 200) {
                setCurrentStep(step)
            }
        }
    }

    const handleInputChange = (key, e) => {
        setScenario({
          [key]: e.target.value,
        });
        setScenario({
            ['scenario_id']: ''+scenarioSize,
        });
    };
    
    return (
        <div className="scenario-container">
            <div className="process-container">
            <Row style={{paddingTop: 10}}>
                <Col span={2} style={{borderRight: '1.5px solid #c4bfbf'}}>
                    <div className="action-title" onClick={()=>props.history.push('/trials')}>
                        <span><LeftOutlined /> Trial Page</span>
                    </div>
                </Col>
                <Col span={3}></Col>
                <Col span={14}>
                    <Steps current={currentStep} size="small" className="step-bar">
                        <Step disabled title="Scenario Details"/>
                        <Step disabled title="Add Inclusion / Exclusion Criteria"/>
                        <Step disabled title="Add Schedule of Events"/>
                    </Steps>
                </Col>
                <Col span={5}></Col>
                
            </Row>
            </div>
            
            {currentStep == 0 ? (
            <div className="ie-container">
            <Row style={{alignItems: 'center', paddingTop: 60}}>
                <Col span={10}></Col>
                <Col span={4}>
                    <Row><h5>Scenario Details</h5></Row>
                    <Row><span>Scenario Name</span></Row>
                    <Row>
                        <Input style={{ width: 200, height: 30 }} 
                            onChange={(e) => handleInputChange("scenario_name", e)}
                            value={scenario["scenario_name"]}/>
                    </Row>
                    <br/>
                    <Row><span>Description</span></Row>
                    <Row>
                        <TextArea value={scenario["scenario_description"]} 
                            onChange={(e) => handleInputChange("scenario_description", e)}
                            autoSize={{ minRows: 3, maxRows: 5 }}/>
                    </Row>
                </Col>
                <Col span={10}></Col>
            </Row>
            </div>
            ) : currentStep == 1 ? (
                <>
                    <NewScenarioStepTwo record={props.location.state}/>
                </>
            ) : (
                <>
                <h3>step3</h3>
                </>
            )}
            <Row style={{bottom: 38, height: 50, width: '100%', 
                            backgroundColor: '#000', alignItems: 'center'}}>
                <Col flex="auto">
                    <Button type="primary" onClick={()=>next()}>NEXT</Button>
                    <Button className="view-btn" onClick={()=>props.history.push('/trials')}>CANCEL</Button>
                </Col>
                <Col flex="50px">
                    <div style={{ bottom: '0' }}></div>
                </Col>
            </Row>
        </div>
    )
}

export default withRouter(ScenarioPage);
