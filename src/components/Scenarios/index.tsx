import React, { useState, useReducer } from "react";
import { withRouter } from "react-router";
import { Tooltip, Modal, Button, Row, Col, Input, Drawer } from "antd";
import { updateStudy } from "../../utils/ajax-proxy";
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
  "Schedule of Events": {},
};

const SceneriosDashbaord = (props: any) => {
  const [newScenarioVisiable, setNewScenarioVisiable] = useState(false);
  const [scenarioType, setScenarioType] = useState();
  const [scenarioId, setScenarioId] = useState('');
  const [editFlag, setEditFlag] = useState(false);
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
    pathname: "/scenario",
    state: props.record,
  };

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
    );
  };

  const viewScenario = (s) =>{
    setScenarioId(s['scenario_id'])
    setScenario(s);
    //TODO to be updated for the actual scenario
    setScenarioType(s['scenario_type'])
    setNewScenarioVisiable(true)
    setEditFlag(true)
  }
  const addNewScenario =(scenarioType) => {
    const newScenarioId = '' + (props.record.scenarios.length + 1)
    setScenarioId(newScenarioId)
    setScenario({
      ['scenario_id']: newScenarioId,
      ['scenario_type']:scenarioType
    });
    setScenarioType(scenarioType)
    setNewScenarioVisiable(true)
    setEditFlag(false)
  }

  const handleOk = async () => {
      setNewScenarioVisiable(false)
      const tempScenarios = props.record.scenarios
      
      if(editFlag){
        const index = tempScenarios.indexOf((e) => e['scenario_id'] === scenarioId)
        tempScenarios.splice(index, 1, scenario)
      } else {
        tempScenarios.push(scenario)
      }

      const tempTrial = props.record
      tempTrial.scenarios = tempScenarios

      const resp = await updateStudy(tempTrial);
      if (resp.statusCode == 200) {
          props.history.push({
            pathname: '/scenario',
            state: { trial_id: props.record['_id'] , scenarioId: scenarioId, editFlag: editFlag, scenarioType: scenarioType}
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
      <div className="container-top">What would you like to explore today?</div>
      <div className="module-wrapper">
        <div className="module-item">
          <div className="top">
            <div className="module-name">Protocol Design</div>
            {props.record.scenarios && props.record.scenarios.length > 0 ? (
              <div>
                <span className="scenario-status">IN PROGRESS</span>
                <Button
                  type="primary"
                  onClick={() => addNewScenario('Protocol Design')}
                >
                  CREATE SCENARIO
                </Button>
              </div>
            ) : (
              <Button
                type="primary"
                onClick={() => setNewScenarioVisiable(true)}
              >
                START MODULE
              </Button>
            )}
          </div>
          {props.record.scenarios && props.record.scenarios.length > 0 ? (
            <div className="scenarios-list-container">
              <div className="count">
                <span>{props.record.scenarios.length}</span>
                <br /> Scenarios
              </div>
              <div className="scenarios-list">
                {props.record.scenarios.map((s, idx) => {
                  return (
                    <div className="item-wrapper">
                      <div className="scenario-item">
                        <div className="title">
                          <p>Scenario {idx + 1}</p>
                          <span>{s["scenario_description"]}</span>
                        </div>
                        <div className="item-values">
                          <div>
                            {s["protocol_amendment_rate"]}{" "}
                            <span className="status poor">POOR</span>
                          </div>
                          <div>
                            {s["screen_failure_rate"]}
                            <span className="status fair">FAIR</span>
                          </div>
                          <div>
                            {s["patient_burden"]}
                            <span className="status good">GOOD</span>
                          </div>
                          <div>
                            {s["cost"]}
                            <span className="status good">POOR</span>
                          </div>
                          <div>
                            <Button onClick={() => viewScenario(s)}>EDIT SCENARIO</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="item-wrapper average-item">
                  <div className="scenario-item">
                    <div className="title average-title">
                      Average from Similar Historical Trials
                    </div>
                    <div className="item-values average">
                      <div>
                        40%{" "}
                        <span className="column">Protocal Amendment Rate</span>
                      </div>
                      <div>
                        18% <span className="column">Screen Failure Rate</span>
                      </div>
                      <div>
                        40 <span className="column">Patient Burden</span>
                      </div>
                      <div>
                        $15-20M <span className="column">Cost</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bottom">Duis pretium gravida enim,</div>
          )}
        </div>
        <div className="module-item">
          <div className="top">
            <div className="module-name">Country Allocation</div>
            <Button type="primary">START MODULE</Button>
          </div>
          <div className="bottom">Duis pretium gravida enim,</div>
        </div>
        <div className="module-item">
          <div className="top">
            <div className="module-name">Site Selection</div>
            <Button type="primary">START MODULE</Button>
          </div>
          <div className="bottom">Duis pretium gravida enim,</div>
        </div>
        <div className="module-item">
          <div className="top">
            <div className="module-name">Trial Budgeting</div>
            <Button type="primary">START MODULE</Button>
          </div>
          <div className="bottom">Duis pretium gravida enim,</div>
        </div>
      </div>

      {/* <div className="scenario-dashboard">
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
      </div> */}

      <Drawer
        title={scenarioType + " - Scenario Builder"}
        placement="right"
        closable={false}
        onClose={handleCancel}
        visible={newScenarioVisiable}
        footer={[
          <Button key="cancel" type="text" onClick={handleCancel} style={{float:'left'}}>CANCEL</Button>,
          <Button key="submit" type="primary" onClick={handleOk}>{editFlag? 'UPDATE SCENARIO':'CREATE SCENARIO'}</Button>
        ]}
      >
        <Row style={{ minHeight: "300px" }}>
          <Col span={24}>
            <Row>
              <h5>Scenario Details</h5>
            </Row>
            <Row>
              <span>Scenario Name</span>
            </Row>
            <Row>
              <Input
                onChange={(e) => handleInputChange("scenario_name", e)}
                value={scenario["scenario_name"]}
              />
            </Row>
            <br />
            <Row>
              <span>Description</span>
            </Row>
            <Row>
              <TextArea
                value={scenario["scenario_description"]}
                onChange={(e) => handleInputChange("scenario_description", e)}
                autoSize={{ minRows: 3, maxRows: 5 }}
              />
            </Row>
          </Col>
        </Row>
      </Drawer>
    </div>
  );
};

export default withRouter(SceneriosDashbaord);
