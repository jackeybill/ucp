import React, { useState, useEffect } from "react";
import { Button, Collapse, Select, Input, message, } from "antd";
import { withRouter } from 'react-router';
import { CheckCircleFilled, CheckCircleTwoTone } from "@ant-design/icons";
import { updateStudy,getStudy } from '../../utils/ajax-proxy';
import "./index.scss";

const { Panel } = Collapse;
const { Option } = Select;

const LABS = 'Labs';
const PHYSICAL_EXAMINATION = 'Physical Examination';
const PROCEDURES = 'Procedures';
const QUESTIONNAIRES = 'Questionnaires';
const STUDY_PROCEDURES = 'Study Procedures';



const endpoints_map = [
  "Change in weight from baseline",
  "Change in FPG from baseline",
  "24-hour glucose profile",
  "Total number of weekly insulin injections to achieve glycemic",
];

const addedMetrics = [
  {
    "Standard Event": "12-lead ECG (central or local)",
    Categories: "Procedures",
    "Dummy Cost": "140",
    "Anxiety Inducing": "1",
    "Hospital dependent": "0",
    "Physically Invasiveness": "1",
    "Blood Draw": "0",
    Sedation: "0",
    Injection: "0",
    Urine: "0",
    "Requires Fasting": "0",
    "Longer than 2 hours": "0",
    Questionnaire: "0",
    selected: "false",
    condition: [],
  },
  {
    "Standard Event":
      "Chest x-ray (posterior-anterior and lateral view) (local)",
    Categories: "Procedures",
    "Dummy Cost": "60",
    "Anxiety Inducing": "1",
    "Hospital dependent": "0",
    "Physically Invasiveness": "1",
    "Blood Draw": "0",
    Sedation: "0",
    Injection: "1",
    Urine: "0",
    "Requires Fasting": "0",
    "Longer than 2 hours": "0",
    Questionnaire: "0",
    selected: "false",
    condition: [
      {
        visits: 1,
        weeks: 3,
        checked: true,
      },
      {
        visits: 2,
        weeks: 6,
        checked: true,
      },
      {
        visits: 3,
        weeks: 9,
        checked: true,
      },
      {
        visits: 4,
        weeks: 12,
        checked: true,
      },
      {
        visits: 5,
        weeks: 15,
        checked: true,
      },
      {
        visits: 6,
        weeks: 18,
        checked: true,
      },
      {
        visits: 7,
        weeks: 21,
        checked: true,
      },
      {
        visits: 8,
        weeks: 24,
        checked: true,
      },
      {
        visits: 9,
        weeks: 26,
        checked: true,
      },
    ],
  },
  {
    "Standard Event": "Dilated fundoscopic examination",
    Categories: "Procedures",
    "Dummy Cost": "100",
    "Anxiety Inducing": "1",
    "Hospital dependent": "0",
    "Physically Invasiveness": "1",
    "Blood Draw": "0",
    Sedation: "0",
    Injection: "0",
    Urine: "0",
    "Requires Fasting": "0",
    "Longer than 2 hours": "0",
    Questionnaire: "0",
    selected: "false",
    condition: [],
  },
];

const EventList = (props) => {
  const [weeks, setWeeks] = useState([])
  const { visitNumber, weekNumber } = props.numbers;
  const [labs, setLabs] = useState(props.labs||[]);
  const [examination, setExamination] = useState(props.examination||[])
  const [procedures, setProcedures] = useState(props.procedures||[])
  const [questionnaire, setQuestionnaire] = useState(props.questionnaire||[])
  const [studyProcedures, setStudyProcedures] = useState(props.studyProcedures||[])

  useEffect(() => {
    let tmpLabs = props.labs.slice(0);
    let tmpExamination = props.examination.slice(0);
    let tmpProcedures = props.procedures.slice(0);
    let tmpQuestionnaire = props.questionnaire.slice(0);
    let tmpStudyProcedures = props.studyProcedures.slice(0);

    let visitsArr = [];
    let weeksArr
      
    for (var i = 1; i <= visitNumber; i++) {
      visitsArr.push(i);
    }
    if (weeks.length == 0) {
      weeksArr = [];

      let week = Math.floor(weekNumber / visitNumber);
      let remainder = weekNumber % visitNumber;
      if (remainder > 0) week = week + 1;
      let sum = 0;
      for (var i = 1; i <= visitNumber; i++) {
        sum = sum + week;
        if (sum > weekNumber) sum = weekNumber;
        weeksArr.push(sum);
      }
    } else {
      weeksArr=weeks
     }

    tmpLabs.forEach((ele) => {
      let condition = [];
      visitsArr.forEach((e, idx) => {
        condition.push({
          visits: e,
          weeks: weeksArr[idx],
          checked: false,
        });
      });
      ele.condition = condition;
    });

     tmpExamination.forEach((ele) => {
      let condition = [];
      visitsArr.forEach((e, idx) => {
        condition.push({
          visits: e,
          weeks: weeksArr[idx],
          checked: false,
        });
      });
      ele.condition = condition;
     });
    
     tmpProcedures.forEach((ele) => {
      let condition = [];
      visitsArr.forEach((e, idx) => {
        condition.push({
          visits: e,
          weeks: weeksArr[idx],
          checked: false,
        });
      });
      ele.condition = condition;
     });
    
    tmpQuestionnaire.forEach((ele) => {
      let condition = [];
      visitsArr.forEach((e, idx) => {
        condition.push({
          visits: e,
          weeks: weeksArr[idx],
          checked: false,
        });
      });
      ele.condition = condition;
    });
    
    tmpStudyProcedures.forEach((ele) => {
      let condition = [];
      visitsArr.forEach((e, idx) => {
        condition.push({
          visits: e,
          weeks: weeksArr[idx],
          checked: false,
        });
      });
      ele.condition = condition;
    });
    

    setLabs(tmpLabs);
    setExamination(tmpExamination);
    setProcedures(tmpProcedures);
    setQuestionnaire(tmpQuestionnaire);
    setStudyProcedures(tmpStudyProcedures);

  }, [
    props.labs,
    props.studyProcedures,
    props.procedures,
    props.questionnaire,
    props.examination,
    visitNumber,
    weekNumber,
    weeks
  ]);

  useEffect(() => {
    getWeeks()
  }, [visitNumber])



  const onEndpointChange = (value, evt,idx) => {
    const Categories = evt.Categories
    let tmpCategories;
    switch (Categories){
      case LABS:
        tmpCategories = labs.slice(0);
        tmpCategories[idx].endpoint = value
        setLabs(tmpCategories)
        break
      case PHYSICAL_EXAMINATION:
        tmpCategories = examination.slice(0);
        tmpCategories[idx].endpoint = value;
        setExamination(tmpCategories)
        break
      case PROCEDURES:
        tmpCategories = procedures.slice(0);
        tmpCategories[idx].endpoint = value;
        setProcedures(tmpCategories)
        break
      case QUESTIONNAIRES:
        tmpCategories = questionnaire.slice(0);
        tmpCategories[idx].endpoint = value;
        setQuestionnaire(tmpCategories)
        break
      case STUDY_PROCEDURES:
        tmpCategories = studyProcedures.slice(0);
        tmpCategories[idx].endpoint = value;
        setStudyProcedures(tmpCategories);
        break 
      default:
        tmpCategories = labs.slice(0);
        tmpCategories[idx].endpoint = value;
        setLabs(tmpCategories)
    }
  }

  const toggleChecked = (evt, idx) => {
    const { Categories, condition } = evt;
    const tmpCon = condition.slice(0);
    tmpCon[idx].checked = !tmpCon[idx].checked;

    switch (Categories) {
      case LABS:     
        const tmpLabs = labs.slice(0);
        tmpLabs.find(
          (ele) => ele["Standard Event"] == evt["Standard Event"]
        ).condition = tmpCon;
        setLabs(tmpLabs);
        break;
      
      case PHYSICAL_EXAMINATION:       
        const tmpExamination = examination.slice(0);
        tmpExamination.find(
          (ele) => ele["Standard Event"] == evt["Standard Event"]
        ).condition = tmpCon;
        setExamination(tmpExamination);
        break;
      
      case PROCEDURES:       
        const tmpProcedures= procedures.slice(0);
        tmpProcedures.find(
          (ele) => ele["Standard Event"] == evt["Standard Event"]
        ).condition = tmpCon;
        setProcedures(tmpProcedures);
        break;
      
       case QUESTIONNAIRES:       
        const tmpQuestionnaire= questionnaire.slice(0);
        tmpQuestionnaire.find(
          (ele) => ele["Standard Event"] == evt["Standard Event"]
        ).condition = tmpCon;
        setQuestionnaire(tmpQuestionnaire);
        break;
      
       case STUDY_PROCEDURES:       
        const tmpStudyProcedures= studyProcedures.slice(0);
        tmpStudyProcedures.find(
          (ele) => ele["Standard Event"] == evt["Standard Event"]
        ).condition = tmpCon;
        setStudyProcedures(tmpStudyProcedures);
        break;
      
      default:
    }
  };

  const renderVisit = () => {
    let visits = [];
    for (var i = 1; i <= visitNumber; i++) {
      visits.push(<div className="td">{i}</div>);
    }
    return <>{visits}</>;
  };
  const getWeeks = () => {
    let weeksArr = [];
    let week = Math.floor(weekNumber / visitNumber);
    let remainder = weekNumber % visitNumber;
    if (remainder > 0) week = week + 1;
    let sum = 0;
    for (var i = 1; i <= visitNumber; i++) {
      sum = sum + week;
      if (sum > weekNumber) sum = weekNumber;
      weeksArr.push(sum)
    }
    setWeeks(weeksArr)
  };


  const endpointsSelector = (evt,idx) => {
    return (
      <Select
        showSearch
        style={{ width: "100%" }}
        placeholder="Search to Select"
        optionFilterProp="children"
        filterOption={(input, option) =>
          option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
        }
        filterSort={(optionA, optionB) =>
          optionA.children
            .toLowerCase()
            .localeCompare(optionB.children.toLowerCase())
        }
        onChange={(value)=> onEndpointChange(value,evt,idx)}
      >
        {endpoints_map.map((e, idx) => (
          <Option value={e} key={idx}>
            {e}
          </Option>
        ))}
      </Select>
    );
  };

  const onWeekChange = (e,idx) => {
    const tmpWeeks = weeks.slice(0)
    tmpWeeks[idx] = Number(e.target.value)
    setWeeks(tmpWeeks)
  }

  const onSave = async () => {
    const scenarioId = props.location.state.scenarioId
    
    const result = await getStudy(props.location.state.trial_id);
    if (result.statusCode == 200) {
      const currentTrial = result.body
      const currentScenario = result.body.scenarios.find(s=>s.scenario_id==scenarioId)

      currentScenario['Schedule of Events'] = {
      "Labs": labs,
      "Physical Examination": examination,
      "Procedures": procedures,
      "Questionnaires": questionnaire,
      "Study Procedures": studyProcedures,
      "Weeks":weeks,
      "Visits": visitNumber
    }

    const resp = await updateStudy(currentTrial)
    if (resp.statusCode == 200) {
      message.success('Save successfully')
    }
    }
  }

  return (
    <div className="event-list-container">
      <div className="container-top">
        <span>Schedule of Events</span>
        <Button type="primary" size="small" onClick={onSave}>
          Save
        </Button>
      </div>

      <div className="event-dashboard">
        <div className="dashboard-head">
          <div className="event-list-head">
            <div className="head-row">
              <div className="colunm-row e-row"></div>
              <div className="visit-row e-row number">
                <div className="colunm td">Visits</div>
                {renderVisit()}
              </div>
            </div>

            <div className="head-row">
              <div className="colunm-row week-row e-row">
                <div className="f-2">My Events</div>
                <div className="f-2">Trial Endpoint</div>
                <div className="f-1-small">Cost per patient</div>
                <div className="f-1-small">Total Visits</div>
              </div>
              <div className="week-row e-row number">
                <div className="colunm td ">Weeks</div>
                {/* {getWeeks()} */}
                {
                  weeks.map((week, idx) => {
                    return <Input className="td" value={week} onChange={(e)=>onWeekChange(e,idx)} />
                    
                  })
                }
              </div>
            </div>
          </div>
        </div>
        <Collapse defaultActiveKey={["1"]}>
          <Panel
            header={
              <div className="event-panel-head">
                <div className="event-title e-row">
                  <div className="name">
                    {`${LABS} (${labs.length})`}
                  </div>
                  <div className="cost">
                    $ {
                      labs.reduce(function (accumulator, currentValue) {
                        return accumulator + Number(currentValue['Dummy Cost'])
                      },0)
                    }
                    </div>
                  <div></div>
                </div>
                <div></div>
              </div>
            }
            key="1"
          >
            <div className="shedule-of-event-panel-body">
              {labs.map((evt, idx) => {
                const totalVisits = evt.condition.filter(c => c.checked).reduce(function (accumulator, currentValue) {
                  return accumulator + Number(currentValue.visits)
                },0)
                return (
                  <div className="event-item">
                    <div className="events-wrapper e-row">
                      <div className="my-event-td td f-2">
                        {evt["Standard Event"]}
                      </div>
                      <div className="endpoint-td td f-2">
                        {endpointsSelector(evt,idx)}
                      </div>
                      <div className="cost-td td f-1-small">
                        ${evt["Dummy Cost"]}
                      </div>
                      <div className="visits-td td f-1-small">{totalVisits}</div>
                    </div>
                    <div className="status-row e-row">
                      <div className="colunm td"></div>
                      {evt.condition.length > 0 &&
                        evt.condition.map((con, idx) => {
                          return (
                            <div className="td">
                              <span
                                className="incon-wrapper"
                                onClick={() => toggleChecked(evt, idx)}
                              >
                                {con.checked ? (
                                  <CheckCircleFilled />
                                ) : (
                                  <CheckCircleTwoTone twoToneColor="#ddd" />
                                )}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
          <Panel
            header={
              <div className="event-panel-head">
                <div className="event-title e-row">
                  <div className="name">
                    {`${PHYSICAL_EXAMINATION} (${examination.length})`}
                  </div>
                  <div className="cost">
                    $ {
                      examination.reduce(function (accumulator, currentValue) {
                        return accumulator + Number(currentValue['Dummy Cost'])
                      },0)
                    }
                    </div>
                  <div></div>
                </div>
                <div></div>
              </div>
            }
            key="2"
          >
            <div className="shedule-of-event-panel-body">
              {examination.map((evt, idx) => {
                const totalVisits = evt.condition.filter(c => c.checked).reduce(function (accumulator, currentValue) {
                  return accumulator + Number(currentValue.visits)
                },0)
                return (
                  <div className="event-item">
                    <div className="events-wrapper e-row">
                      <div className="my-event-td td f-2">
                        {evt["Standard Event"]}
                      </div>
                      <div className="endpoint-td td f-2">
                        {endpointsSelector(evt,idx)}
                      </div>
                      <div className="cost-td td f-1-small">
                        ${evt["Dummy Cost"]}
                      </div>
                      <div className="visits-td td f-1-small">{totalVisits}</div>
                    </div>
                    <div className="status-row e-row">
                      <div className="colunm td"></div>
                      {evt.condition.length > 0 &&
                        evt.condition.map((con, idx) => {
                          return (
                            <div className="td">
                              <span
                                className="incon-wrapper"
                                onClick={() => toggleChecked(evt, idx)}
                              >
                                {con.checked ? (
                                  <CheckCircleFilled />
                                ) : (
                                  <CheckCircleTwoTone twoToneColor="#ddd" />
                                )}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
           <Panel
            header={
              <div className="event-panel-head">
                <div className="event-title e-row">
                  <div className="name">
                    {`${PROCEDURES} (${procedures.length})`}
                  </div>
                  <div className="cost">
                    $ {
                      procedures.reduce(function (accumulator, currentValue) {
                        return accumulator + Number(currentValue['Dummy Cost'])
                      },0)
                    }
                    </div>
                  <div></div>
                </div>
                <div></div>
              </div>
            }
            key="3"
          >
            <div className="shedule-of-event-panel-body">
              {procedures.map((evt, idx) => {
                const totalVisits = evt.condition.filter(c => c.checked).reduce(function (accumulator, currentValue) {
                  return accumulator + Number(currentValue.visits)
                },0)
                return (
                  <div className="event-item">
                    <div className="events-wrapper e-row">
                      <div className="my-event-td td f-2">
                        {evt["Standard Event"]}
                      </div>
                      <div className="endpoint-td td f-2">
                        {endpointsSelector(evt,idx)}
                      </div>
                      <div className="cost-td td f-1-small">
                        ${evt["Dummy Cost"]}
                      </div>
                      <div className="visits-td td f-1-small">{totalVisits}</div>
                    </div>
                    <div className="status-row e-row">
                      <div className="colunm td"></div>
                      {evt.condition.length > 0 &&
                        evt.condition.map((con, idx) => {
                          return (
                            <div className="td">
                              <span
                                className="incon-wrapper"
                                onClick={() => toggleChecked(evt, idx)}
                              >
                                {con.checked ? (
                                  <CheckCircleFilled />
                                ) : (
                                  <CheckCircleTwoTone twoToneColor="#ddd" />
                                )}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
           <Panel
            header={
              <div className="event-panel-head">
                <div className="event-title e-row">
                  <div className="name">
                    {`${QUESTIONNAIRES} (${questionnaire.length})`}
                  </div>
                  <div className="cost">
                    $ {
                      questionnaire.reduce(function (accumulator, currentValue) {
                        return accumulator + Number(currentValue['Dummy Cost'])
                      },0)
                    }
                    </div>
                  <div></div>
                </div>
                <div></div>
              </div>
            }
            key="4"
          >
            <div className="shedule-of-event-panel-body">
              {questionnaire.map((evt, idx) => {
                const totalVisits = evt.condition.filter(c => c.checked).reduce(function (accumulator, currentValue) {
                  return accumulator + Number(currentValue.visits)
                },0)
                return (
                  <div className="event-item">
                    <div className="events-wrapper e-row">
                      <div className="my-event-td td f-2">
                        {evt["Standard Event"]}
                      </div>
                      <div className="endpoint-td td f-2">
                        {endpointsSelector(evt,idx)}
                      </div>
                      <div className="cost-td td f-1-small">
                        ${evt["Dummy Cost"]}
                      </div>
                      <div className="visits-td td f-1-small">{totalVisits}</div>
                    </div>
                    <div className="status-row e-row">
                      <div className="colunm td"></div>
                      {evt.condition.length > 0 &&
                        evt.condition.map((con, idx) => {
                          return (
                            <div className="td">
                              <span
                                className="incon-wrapper"
                                onClick={() => toggleChecked(evt, idx)}
                              >
                                {con.checked ? (
                                  <CheckCircleFilled />
                                ) : (
                                  <CheckCircleTwoTone twoToneColor="#ddd" />
                                )}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
           <Panel
            header={
              <div className="event-panel-head">
                <div className="event-title e-row">
                  <div className="name">
                    {`${STUDY_PROCEDURES} (${studyProcedures.length})`}
                  </div>
                  <div className="cost">
                    $ {
                      studyProcedures.reduce(function (accumulator, currentValue) {
                        return accumulator + Number(currentValue['Dummy Cost'])
                      },0)
                    }
                    </div>
                  <div></div>
                </div>
                <div></div>
              </div>
            }
            key="5"
          >
            <div className="shedule-of-event-panel-body">
              {studyProcedures.map((evt, idx) => {
                const totalVisits = evt.condition.filter(c => c.checked).reduce(function (accumulator, currentValue) {
                  return accumulator + Number(currentValue.visits)
                },0)
                return (
                  <div className="event-item">
                    <div className="events-wrapper e-row">
                      <div className="my-event-td td f-2">
                        {evt["Standard Event"]}
                      </div>
                      <div className="endpoint-td td f-2">
                       {endpointsSelector(evt,idx)}
                      </div>
                      <div className="cost-td td f-1-small">
                        ${evt["Dummy Cost"]}
                      </div>
                      <div className="visits-td td f-1-small">{totalVisits}</div>
                    </div>
                    <div className="status-row e-row">
                      <div className="colunm td"></div>
                      {evt.condition.length > 0 &&
                        evt.condition.map((con, idx) => {
                          return (
                            <div className="td">
                              <span
                                className="incon-wrapper"
                                onClick={() => toggleChecked(evt, idx)}
                              >
                                {con.checked ? (
                                  <CheckCircleFilled />
                                ) : (
                                  <CheckCircleTwoTone twoToneColor="#ddd" />
                                )}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>


        </Collapse>
      </div>
    </div>
  );
};

export default withRouter(EventList);
