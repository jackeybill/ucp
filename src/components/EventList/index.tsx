import React, { useState, useEffect } from "react";
import { Button, Collapse, Select, Input, message, } from "antd";
import { withRouter } from 'react-router';
import { CheckCircleFilled, CheckCircleTwoTone,CaretUpOutlined,CaretDownOutlined } from "@ant-design/icons";
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


const EventList = (props) => {
  const { visitNumber, weekNumber } = props.numbers;
  const [sort,setSort] = useState("")
  const [weeks, setWeeks] = useState([])
  let [labs, setLabs] = useState(props.labs||[]);
  let [examination, setExamination] = useState(props.examination||[])
  let [procedures, setProcedures] = useState(props.procedures||[])
  let [questionnaire, setQuestionnaire] = useState(props.questionnaire||[])
  let [studyProcedures, setStudyProcedures] = useState(props.studyProcedures||[])

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
      getWeeks()
      // weeksArr = [];

      // let week = Math.floor(weekNumber / visitNumber);
      // let remainder = weekNumber % visitNumber;
      // if (remainder > 0) week = week + 1;
      // let sum = 0;
      // for (var i = 1; i <= visitNumber; i++) {
      //   sum = sum + week;
      //   if (sum > weekNumber) sum = weekNumber;
      //   weeksArr.push(sum);
      // }
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
      const totalVisit = condition.filter(e=>e.checked).length
      ele.condition = condition;
      ele.totalVisit = totalVisit;

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
    weeks,
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
    let weeksArr = [1];
    let week = Math.floor((weekNumber-1) / (visitNumber-1));
    let sum = 1;
    for (var i = 1; i <= visitNumber-1; i++) {
      sum = sum + week;
      if (sum > weekNumber) sum = weekNumber;
      if (i == visitNumber - 1) {
        sum=weekNumber
      }
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

  const getTotalCost = (array) => {
    return array.reduce(function (accumulator, currentValue) {
      return accumulator + Number(currentValue['Dummy Cost'])*Number(currentValue['totalVisit'])
    }, 0)
  }
  
  const onSort = (a,b) => {
    if (sort == "ascend") return (a['Dummy Cost'] - b['Dummy Cost'])
    if (sort == "descend") return (b['Dummy Cost'] - a['Dummy Cost'])
    return 0
  }

  const onSave = async () => {
    const scheduleOfEvents = {
      "Labs": {
        entities: labs,
        totalCost: getTotalCost(labs)
        },
      "Physical Examination": {
        entities: examination,
        totalCost: getTotalCost(examination)
        },
      "Procedures": {
        entities: procedures,
        totalCost:  getTotalCost(procedures)
        },
      "Questionnaires": {
        entities: questionnaire,
        totalCost: getTotalCost(questionnaire)
        },
      "Study Procedures": {
        entities: studyProcedures,
        totalCost: getTotalCost(studyProcedures)
      },
      "Weeks":weeks,
      "Visits": visitNumber
    }
    // console.log('----save--',scheduleOfEvents )
    props.onSave(scheduleOfEvents)
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
                <div className="f-1-small sortable-item">Cost per patient
                <span className="sort-icon-wrapper">
                    <CaretUpOutlined onClick={() => setSort("ascend")}  style={{color:sort=="ascend"?"#ca4a04":"rgb(85,85,85)"}}/>
                    <CaretDownOutlined onClick={ ()=>setSort("descend")} style={{color:sort=="descend"?"#ca4a04":"rgb(85,85,85)"}}/>
                </span>
                </div>
                <div className="f-1-small">Total Visits</div>
              </div>
              <div className="week-row e-row number">
                <div className="colunm td ">Weeks</div>
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
                    $ {getTotalCost(labs)}
                    </div>
                  <div></div>
                </div>
                <div></div>
              </div>
            }
            key="1"
          >
            <div className="shedule-of-event-panel-body">
              {labs.sort((a, b) => {
                return onSort(a,b)
                })
                .map((evt, idx) => {
                const totalVisit = evt.condition.filter(c => c.checked).length
                evt.totalVisit = totalVisit
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
                      <div className="visits-td td f-1-small">{totalVisit}</div>
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
                    $ {getTotalCost(examination)}
                    </div>
                  <div></div>
                </div>
                <div></div>
              </div>
            }
            key="2"
          >
            <div className="shedule-of-event-panel-body">
              {examination.sort((a, b) => {
                return onSort(a,b)
                })
                .map((evt, idx) => {
                const totalVisit = evt.condition.filter(c => c.checked).length
                evt.totalVisit = totalVisit
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
                      <div className="visits-td td f-1-small">{totalVisit}</div>
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
                     $ {getTotalCost(procedures)}
                    </div>
                  <div></div>
                </div>
                <div></div>
              </div>
            }
            key="3"
          >
            <div className="shedule-of-event-panel-body">
              {procedures.sort((a, b) => {
                return onSort(a,b)
              })
                .map((evt, idx) => {
                const totalVisit = evt.condition.filter(c => c.checked).length
                evt.totalVisit = totalVisit
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
                      <div className="visits-td td f-1-small">{totalVisit}</div>
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
                     $ {getTotalCost(questionnaire)}                 
                    </div>
                  <div></div>
                </div>
                <div></div>
              </div>
            }
            key="4"
          >
            <div className="shedule-of-event-panel-body">
              {questionnaire.sort((a, b) => {
                return onSort(a,b)
                })
                .map((evt, idx) => {
                const totalVisit = evt.condition.filter(c => c.checked).length
                evt.totalVisit = totalVisit
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
                      <div className="visits-td td f-1-small">{totalVisit}</div>
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
                   $ {getTotalCost(studyProcedures)}   
                    </div>
                  <div></div>
                </div>
                <div></div>
              </div>
            }
            key="5"
          >
            <div className="shedule-of-event-panel-body">
              {studyProcedures.sort((a, b) => {
                return onSort(a,b)
                })
                .map((evt, idx) => {
                const totalVisit = evt.condition.filter(c => c.checked).length
                evt.totalVisit = totalVisit
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
                      <div className="visits-td td f-1-small">{totalVisit}</div>
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
