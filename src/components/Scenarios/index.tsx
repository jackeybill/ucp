import React, { useState, useReducer} from "react";
import { withRouter } from 'react-router';
import { Tooltip, Modal, Button, Row, Col, Input} from "antd";
import { updateStudy} from "../../utils/ajax-proxy";
import Scatter from "../Chart";
import addIcon from "../../assets/add.svg";
import "./index.scss";

const { TextArea } = Input;

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

const SceneriosDashbaord = (props: any) => {
  const [newScenarioVisiable, setNewScenarioVisiable] = useState(false);
  const [scenarioType, setScenarioType] = useState();
  const [scenario, setScenario] = useReducer(
    (state, newState) => ({ ...state, ...newState }),
    { ...initialStates }
);

  const renderTitle = () => {
    return (
      <div>
        <span className="scatter-title">PROTOCOL AMENDMENT</span>
        <Scatter />
      </div>
    );
  };

  const path = {
    pathname: '/scenario',
    state: props.record
  }

  const Metrics = () => {
    return (
      <Tooltip
        overlayClassName="metric-scatter"
        color="#ffffff"
        // visible={true}
        placement="right"
        title={renderTitle()}
      >
        <div className="col-value average-value">
          <span className="percent poor">--%</span>
        </div>
      </Tooltip>
    )
  }

  const addNewScenario =(scenarioType) => {
    const newScenarioId = '' + (props.record.scenarios.length + 1)
    setScenario({
      ['scenario_id']: newScenarioId,
    });
    if(scenarioType === 'Protocol Design'){
      setScenarioType(scenarioType)
      setNewScenarioVisiable(true)
    }
  }

  const handleOk = async () => {
      setNewScenarioVisiable(false)
      const tempScenarios = props.record.scenarios
      tempScenarios.push(scenario)

      const tempTrial = props.record
      tempTrial.scenarios = tempScenarios

      const resp = await updateStudy(tempTrial);
      console.log(tempTrial)
      if (resp.statusCode == 200) {
          props.history.push({
            pathname: '/scenario',
            state: { recod: resp.body}
          })
      }
  }
  const handleCancel = () =>{
      setNewScenarioVisiable(false)
      setScenario(initialStates)
  }

  const handleInputChange = (key, e) => {
    setScenario({
      [key]: e.target.value,
    });
  };

  return (
    <div className="scenarios-container">
      <div className="container-top">
        <span className="count">Scenarios({props.record.scenarios && props.record.scenarios.length || 0})</span>
        <br />
        <span>
          Summary of design scenarios and key metrics on predicted impact.
        </span>
      </div>

      <div className="scenario-dashboard">
        {props.record.scenarios && props.record.scenarios.length > 0 && (
          <div className="columns">
            <div className="title"></div>
            <div className="col-item">Protocol Amendment Rate</div>
            <div className="col-item">Screen Failure Rate</div>
            <div className="col-item">Patient Burden</div>
            <div className="col-item">Patient Burden</div>
            <div></div>
          </div>
        )}

        <div className="scenario-list">
          {props.record.scenarios &&
            props.record.scenarios.length > 0 &&
            props.record.scenarios.map((s) => {
              return (
                <div className="scenario">
                  <div className="title">
                    <span>{s["scenario_id"]}</span>
                    <br />
                    <span>{s["scenario_description"]}</span>
                  </div>
                  <div className="col-value  poor">
                    {
                      s["protocol_amendment_rate"] ? (
                        <>
                          <span className="percent poor">
                            {s["protocol_amendment_rate"]}
                          </span>
                          <br />
                          <i>POOR</i>
                        </>
                      ) : '-'
                    }
                  </div>
                  <div className="col-value fair">
                    {
                      s["screen_failure_rate"] ? (
                        <>
                          <span className="percent ">{s["screen_failure_rate"]}</span>
                          <br />
                          <i>FAIR</i>
                        </>
                      ) : '-'
                    }
                  </div>
                  <div className="col-value good">
                    {
                      s["patient_burden"] ? (
                        <>
                          <span className="percent">{s["patient_burden"]}</span>
                          <br />
                          <i>GOOD</i>
                        </>
                      ) : '-'
                    }
                  </div>
                  <div className="col-value good">
                    {
                      s["cost"] ? (
                        <>
                          <span className="percent ">{s["cost"]}</span>
                          <br />
                          <i>POOR</i>
                        </>
                      ) : '-'
                    }
                  </div>
                  <div className="footer btn-wrapper">
                    <div className="view-btn" onClick={() => props.history.push({
                      pathname: '/scenario',
                      state: { scenario_id: s['scenario_id'] }
                    })}>View Scenario</div>
                  </div>
                </div>
              );
            })}
          {
            props.record.scenarios &&
            props.record.scenarios.length > 0 && (
              <div className="average scenario">
                <div className="title average-title">
                  <span>Therapeutic Area Average</span>
                  <br />
                  <span>Endocrinology, Type 2 Diabetes Phase 3 trials</span>
                </div>
                <Metrics />
                <Metrics />
                <Metrics />
                <Metrics />
                <div className="footer btn-wrapper">
                  <div className="view-btn">View Scenario</div>
                </div>
              </div>
            )
          } 
          <div className="create-btn-wrapper">
            <div className="create-btn" onClick={() => addNewScenario('Protocol Design')}>
              <img src={addIcon} alt="" width="68px" height="68px" />
              <br />
              <span> ADD NEW SCENARIO</span>
            </div>
          </div>
        </div>
      </div>

      <Modal visible={newScenarioVisiable} title={scenarioType + ' - Scenario Builder'} 
          onOk={handleOk} onCancel={handleCancel} 
          footer={[
            <Button key="submit" type="primary" onClick={handleOk} style={{float:'left'}}>CANCEL</Button>,
            <Button key="submit" type="primary" onClick={handleOk}>CREATE SCENARIO</Button>
          ]}
          style={{ left: '20%', top:50 }} centered={false} width={200}>
          <Row style={{minHeight:'300px'}}>
            <Col span={24}>
                <Row><h5>Scenario Details</h5></Row>
                <Row><span>Scenario Name</span></Row>
                <Row>
                    <Input onChange={(e) => handleInputChange("scenario_name", e)}
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
        </Row>
      </Modal>
    </div>
  );
};

export default withRouter(SceneriosDashbaord);
