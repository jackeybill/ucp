import React, { useState, useReducer,useEffect } from "react";
import { withRouter } from "react-router";
import { Tooltip,Button, Row, Col, Input, Drawer, Radio } from "antd";
import { updateStudy,getStudy } from "../../utils/ajax-proxy";
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
  const [completeModuleVisible, setCompleteModuleVisible] = useState(false);
  const [scenarioType, setScenarioType] = useState();
  const [scenarioId, setScenarioId] = useState('');
  const [editFlag, setEditFlag] = useState(false);
  const [scenario, setScenario] = useReducer(
    (state, newState) => ({ ...state, ...newState }),
    { ...initialStates }
  );
  const [scenarioList, setScenarioList] = useState([])
 
  useEffect(() => {
    setScenarioList(JSON.parse(JSON.stringify(props.record.scenarios)))
  }, [props.record.scenarios])

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
            state: { 
              trial_id: props.record['_id'] , 
              scenarioId: scenarioId, 
              editFlag: editFlag, 
              scenarioType: scenarioType,
              similarHistoricalTrials: props.record['similarHistoricalTrials']
            }
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

  const handleCheck = (e, idx) => {
    const tmpList = scenarioList.slice(0)
    if (e.target.checked) {
      tmpList.forEach(ele =>
        delete ele.rationale
      )
      tmpList[idx].rationale = ""
    } else {
      delete tmpList[idx].rationale
    }
    setScenarioList(tmpList) 
  }
 

  const onRationaleChange = (e, idx) => {  
    const tmpList = scenarioList.slice(0)
    tmpList[idx].rationale = e.target.value
    setScenarioList(tmpList)

  }
  const showCompleteModule = (type) => {
    setCompleteModuleVisible(true)
    setScenarioType(type)
  }

  const handleCompleteModule = async() => {
    const tempTrial =JSON.parse(JSON.stringify(props.record)) 
    tempTrial.scenarios = scenarioList
    const trialId=tempTrial["_id"]
    
    const resp = await updateStudy(tempTrial);
    if (resp.statusCode == 200) {
      props.updateRecord(tempTrial)
      const study = await getStudy(trialId)
      if (study.statusCode == 200) {
        const newScenarios = study.body.scenarios
        setScenarioList(newScenarios)
        setCompleteModuleVisible(false)  
      }
    }  
  }
  const cancelCompleteModule = () => {
    setCompleteModuleVisible(false)
    setScenario(props.record.scenarios)
  }

   const noEdit = props.record.scenarios.find(sce=>sce.rationale!=undefined)
  return (
    <div className="scenarios-container">
      <div className="container-top">What would you like to explore today?</div>
      <div className="module-wrapper">
        <div className="module-item">
          <div className="top">
            <div className="module-name">
              Protocol Design
              <span className="scenario-status">
                <i className={`${props.record.status=="In Progress"?"in-progress-icon":'complete-icon'} my_icon`}></i>
                {props.record.status}
              </span>
            </div>
            {props.record.scenarios && props.record.scenarios.length > 0 ? (
              <div>
                <Button
                  size="small"
                  className="complete-module-btn"
                  type="link"
                  onClick={() => showCompleteModule("Protocol Design")}
                >
                  COMPLETE MODULE
                </Button>
                <Button
                  size="small"                 
                  danger
                  onClick={() => addNewScenario("Protocol Design")}
                >
                  CREATE SCENARIO
                </Button>
              </div>
            ) : (
              <Button
                size="small"
                type="primary"
                onClick={() => addNewScenario("Protocol Design")}
              >
                START MODULE
              </Button>
            )}
          </div>
          {props.record.scenarios && props.record.scenarios.length > 0 ?        
            (
              <div className="scenarios-list-container">
                <div className="count">
                  <span>{props.record.scenarios.length}</span>
                  <br /> Scenarios
              </div>
                <div className="scenarios-list">
                  <div className="scenario-item  scenario-header">
                    <div className="title"></div>
                    <div className="item-values col-names">
                      <div>Protocol Amendment Rate</div>
                      <div>Screen Failure Rate</div>
                      <div>Patient Burden</div>
                      <div>Cost</div>
                      <div></div>
                    </div>
                  </div>
                  {props.record.scenarios.map((s, idx) => {
                    return (
                      <div className="item-wrapper" key={s["scenario_id"] + idx}>
                        <div className="scenario-item">
                          <div className="title">
                            <p>Scenario {idx + 1}</p>
                            <span>{s["scenario_description"]}</span>
                          </div>
                          <div className="item-values">
                            <div>
                              {s["protocol_amendment_rate"]}
                              <span className={`status ${s["protocol_amendment_rate_state"].toLowerCase()}`}>{s["protocol_amendment_rate_state"].toUpperCase()}</span>
                              {/* <span className={`status ${s["protocol_amendment_rate_state"]}`}>{s["protocol_amendment_rate_state"]}</span> */}
                            
                            </div>
                            <div>
                              {s["screen_failure_rate"]}
                              <span className={`status ${s["screen_failure_rate_state"].toLowerCase()}`}>{s["screen_failure_rate_state"].toUpperCase()}</span>
                               {/* <span className={`status ${s["screen_failure_rate_state"]}`}>{s["screen_failure_rate_state"]}</span> */}
                            </div>
                            <div>
                              {s["patient_burden"]}
                              <span className={`status ${s["patient_burden_state"].toLowerCase()}`}>{s["patient_burden_state"].toUpperCase()}</span>
                               {/* <span className={`status ${s["patient_burden_state"]}`}>{s["patient_burden_state"]}</span> */}
                            </div>
                            <div>
                              {s["cost"]}
                              <span className={`status ${s["cost_state"].toLowerCase()}`}>{s["cost_state"].toUpperCase()}</span>
                               {/* <span className={`status ${s["cost_state"]}`}>{s["cost_state"]}</span> */}
                            </div>
                            <div>
                              {
                                noEdit==undefined && (
                                  <Button
                                    size="small"
                                    onClick={() => viewScenario(s)}
                                  >
                                    EDIT SCENARIO
                                  </Button>
                                )
                              }
                            </div>
                          </div>
                        </div>
                        {s.hasOwnProperty("rationale") && s['rationale'] != "" && (
                          <div className="rationale-content">
                            <span>Rationale</span>
                            <p>{s.rationale}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )
           : (
            <div className="bottom">Duis pretium gravida enim,</div>
          )}
          {
             props.record.scenarios.length>0 && props.record['Therapeutic Area Average'] !==undefined && (
              <div className="item-wrapper average-item">
                <div className="scenario-item">
                  <div className="title average-title">
                    Average from Similar Historical Trials
                  </div>
                  <div className="item-values average">
                    <div>{props.record['Therapeutic Area Average'].protocol_amendment_rate }</div>
                    <div>{props.record['Therapeutic Area Average'].screen_failure_rate }</div>
                    <div>{props.record['Therapeutic Area Average'].patient_burden }</div>
                    <div>{props.record['Therapeutic Area Average'].cost}</div>
                    <div></div>
                  </div>
                </div>
              </div>        
            )
          }       
        </div>
        <div className="module-item">
          <div className="top">
            <div className="module-name">Country Allocation</div>
            <Button type="primary" size="small">
              START MODULE
            </Button>
          </div>
          <div className="bottom">Duis pretium gravida enim,</div>
        </div>
        <div className="module-item">
          <div className="top">
            <div className="module-name">Site Selection</div>
            <Button type="primary" size="small">
              START MODULE
            </Button>
          </div>
          <div className="bottom">Duis pretium gravida enim,</div>
        </div>
        <div className="module-item">
          <div className="top">
            <div className="module-name">Trial Budgeting</div>
            <Button type="primary" size="small">
              START MODULE
            </Button>
          </div>
          <div className="bottom">Duis pretium gravida enim,</div>
        </div>
      </div>

      <Drawer
        title={scenarioType + " - Scenario Builder"}
        placement="right"
        closable={false}
        onClose={handleCancel}
        visible={newScenarioVisiable}
        footer={[
          <Button
            key="cancel"
            type="text"
            onClick={handleCancel}
            style={{ float: "left" }}
          >
            CANCEL
          </Button>,
          <Button key="submit" type="primary" onClick={handleOk} className="create-update-btn">
            {editFlag ? "UPDATE SCENARIO" : "CREATE SCENARIO"}
          </Button>,
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

      <Drawer
        className="complete-module-drawer"
        title={"Complete Module:" + scenarioType}
        placement="right"
        onClose={() => setCompleteModuleVisible(false)}
        visible={completeModuleVisible}
        footer={[
          <Button
            key="cancel"
            type="text"
            onClick={cancelCompleteModule}
            style={{ float: "left" }}
          >
            CANCEL
          </Button>,
          <Button
            type="primary"
            className="submit-complete-btn"
            onClick={handleCompleteModule}
          >
            COMPLETE MODULE
          </Button>,
        ]}
      >
        <div className="module-tip">
          Note: Once marked as completed, you will not be able to edit this
          trial further.
        </div>
        <div className="select-scenario-wrapper">
          <div className="scenario-table-header">
            <div className="scenario-col scenario-name">Select Scenario</div>
            <div className="scenario-col">Protocol Amendment Rate</div>
            <div className="scenario-col">Screen Failure Rate</div>
            <div className="scenario-col">Patient Burden</div>
            <div className="scenario-col">Cost</div>
          </div>
          <div className="scenario-table-body">
            {scenarioList.map((scenario, idx) => {
              return (
                <div
                  className={`scenario-table-row-wrapper ${
                    scenario.hasOwnProperty("rationale") ? "checked" : ""
                  }`}
                >
                  <div className="scenario-table-row">
                    <div
                      className={`scenario-col scenario-name ${
                        scenario.hasOwnProperty("rationale") ? "checked" : ""
                      }`}
                    >
                      <div>
                        <Radio
                          checked={scenario.hasOwnProperty("rationale")}
                          onChange={(e) => handleCheck(e, idx)}
                        >Scenario {idx + 1}</Radio>
                      </div>
                      <span className="scenario-desc">
                        {scenario["scenario_description"]}
                      </span>
                    </div>
                    <div className="scenario-col">
                      {scenario["protocol_amendment_rate"]}
                      <span className={`status ${scenario["protocol_amendment_rate_state"].toLowerCase()}`}>{scenario["protocol_amendment_rate_state"].toUpperCase()}</span>
                       {/* <span className={`status ${scenario["protocol_amendment_rate_state"]}`}>{scenario["protocol_amendment_rate_state"]}</span> */}
                    
                    </div>
                    <div className="scenario-col">
                      {scenario['screen_failure_rate']}
                      <span className={`status ${scenario["screen_failure_rate_state"].toLowerCase()}`}> {scenario['screen_failure_rate_state'].toUpperCase()}</span>
                      {/* <span className={`status ${scenario["screen_failure_rate_state"]}`}> {scenario['screen_failure_rate_state']}</span> */}
                    </div>
                    <div className="scenario-col">
                      {scenario['patient_burden']}
                      <span className={`status ${scenario["patient_burden_state"].toLowerCase()}`}> {scenario['patient_burden_state'].toUpperCase()}</span>
                     {/* <span className={`status ${scenario["patient_burden_state"]}`}> {scenario['patient_burden_state']}</span> */}
                    </div>
                    <div className="scenario-col">
                      {scenario['cost']}
                      
                      <span className={`status ${scenario["cost_state"].toLowerCase()}`}>{scenario['cost_state'].toUpperCase()}</span>
                       {/* <span className={`status ${scenario["cost_state"]}`}>{scenario['cost_state']}</span> */}

                    </div>
                  </div>
                  {scenario.rationale!==undefined ? (
                    <div className="rationale-mark">
                      <span>Provide Rationale</span>
                      <div>
                        <TextArea
                          value={scenario.rationale}
                          onChange={(e) => onRationaleChange(e, idx)}
                          autoSize={{ minRows: 3, maxRows: 5 }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default withRouter(SceneriosDashbaord);
