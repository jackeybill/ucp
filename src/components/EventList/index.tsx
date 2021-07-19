import React, { useState, useEffect } from "react";
import { Button, Collapse, Select, Input, message, } from "antd";
import { withRouter } from 'react-router';
import { CheckCircleFilled, CheckCircleTwoTone,CaretUpOutlined,CaretDownOutlined,MinusCircleOutlined} from "@ant-design/icons";
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
  const viewOnly = props.viewOnly ||false;
  const [sort,setSort] = useState("")
  const [weeks, setWeeks] = useState([])
  const [visits, setVisits] = useState([])
  const [expandKeys, setExpandKeys] = useState(["1"])
  let [labs, setLabs] = useState(props.labs||[]);
  let [examination, setExamination] = useState(props.examination||[])
  let [procedures, setProcedures] = useState(props.procedures||[])
  let [questionnaire, setQuestionnaire] = useState(props.questionnaire||[])
  let [studyProcedures, setStudyProcedures] = useState(props.studyProcedures||[])

  useEffect(() => {
    if(props.viewOnly) setExpandKeys(['1','2','3','4','5'])
  }, [props.viewOnly])

  useEffect(() => {
    getWeeks()
    getVisits()
  }, [visitNumber,weekNumber])

  useEffect(()=>{
    updateCondition()
  },[weeks])

  
  useEffect(()=>{
    getWeeks()

  },[props.weeks])

  const getCondition = (category) =>{
    let tmpCategory = [category].slice(0)[0];

    tmpCategory.forEach((ele) => {
      if(!ele.condition || ele.condition.length==0){
        let condition = [];
        visits.forEach((e, idx) => {
          condition.push({
            visits: e,
            weeks:weeks[idx],
            checked:false,
          });
        });
        const totalVisit = condition.filter(e=>e.checked).length
        ele.condition = condition;
        ele.totalVisit = totalVisit;
      }
    });
    return tmpCategory
  }

  const updateCondition = () =>{
    let tmpLabs = getCondition(labs)
    let tmpExamination =getCondition(examination)
    let tmpProcedures = getCondition(procedures)
    let tmpQuestionnaire =getCondition(questionnaire)
    let tmpStudyProcedures =  getCondition(studyProcedures)

    setLabs(tmpLabs);
    setExamination(tmpExamination);
    setProcedures(tmpProcedures);
    setQuestionnaire(tmpQuestionnaire);
    setStudyProcedures(tmpStudyProcedures);
  }


  useEffect(() => {
    //initial condition
    let tmpLabs = getCondition(props.labs)
    let tmpExamination =getCondition(props.examination)
    let tmpProcedures = getCondition(props.procedures)
    let tmpQuestionnaire =getCondition(props.questionnaire)
    let tmpStudyProcedures =  getCondition(props.studyProcedures)

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
  ]);

  const getInitCodition = () =>{
    let initCodition = [];
    visits.forEach((e, idx) => {
      initCodition.push({
          visits: e,
          weeks: weeks[idx],
          checked: false,
        });
      });
      return initCodition
  }

  useEffect(() => {
    if(props.submitType != 0){
      onSave()
    }
  }, [props.submitType])

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
    props.handleEventChange(evt,evt.Custom)
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
    props.handleEventChange(evt,false)
  };

  const renderVisit = () => {
    let visits = [];
    for (var i = 1; i <= visitNumber; i++) {
      visits.push(<div className="td" key={i}>{i}</div>);
    }
    return <>{visits}</>;
  };

  const getWeeks = () => {
    if (props.weeks && props.weeks.length > 0) {
      setWeeks(props.weeks)
    }else{
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
    } 
  };



  const getVisits = () =>{
    let visitArr = [];
    for (let i = 0; i <= visitNumber-1; i++) {
      visitArr.push(i+1)
    }
    setVisits(visitArr)
  }

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
        value={evt.endpoint}
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

  const onAddEvent = (e,key) =>{
    e.stopPropagation();
    let temp;
    let expandPanel=expandKeys.slice(0)
    let initCodition=getInitCodition()
    switch (key){
      case LABS:
        expandPanel.push("1")   
        temp=labs.slice(0)
        temp.push({
          "Standard Event": "",
          "Categories": LABS,
          "Count": 0,
          "Dummy Cost": 0,          
          "condition":initCodition,
          "nct_id":[],
          "Custom":true
        })
        
        setLabs(temp)
        break;

      case PHYSICAL_EXAMINATION:
        expandPanel.push("2")
        temp=examination.slice(0)
        temp.push({
          "Standard Event": "",
          "Categories": PHYSICAL_EXAMINATION,
          "Count": 0,
          "Dummy Cost": 0,          
          "condition":initCodition,
          "nct_id":[],
          "Custom":true
        })
        setExamination(temp)
        break;

      case PROCEDURES:
        expandPanel.push("3")
        temp=procedures.slice(0)
        temp.push({
          "Standard Event": "",
          "Categories": PROCEDURES,
          "Count": 0,
          "Dummy Cost": 0,          
          "condition":initCodition,
          "nct_id":[],
          "Custom":true
        })
        setProcedures(temp)
        break;

      case QUESTIONNAIRES:
        expandPanel.push("4")
        temp=questionnaire.slice(0)
        temp.push({
          "Standard Event": "",
          "Categories": QUESTIONNAIRES,
          "Count": 0,
          "Dummy Cost": 0,          
          "condition":initCodition,
          "nct_id":[],
          "Custom":true
        })
        setQuestionnaire(temp)
        break;

      case STUDY_PROCEDURES:
        expandPanel.push("5")
        temp=studyProcedures.slice(0)
        temp.push({
          "Standard Event": "",
          "Categories": STUDY_PROCEDURES,
          "Count": 0,
          "Dummy Cost": 0,          
          "condition":initCodition,
          "nct_id":[],
          "Custom":true
        })
        setStudyProcedures(temp)
        break;
        default:
        
      }
      expandPanel = Array.from(new Set(expandPanel))
      setExpandKeys(expandPanel)
  }

  const onCustomEventNameChange = (e,category, idx,key)=>{
    let temp;
    const value = e.target.value;
    switch (category){
      case LABS:
        temp=labs.slice(0)
        temp[idx][key] = value  
        setLabs(temp)
        break;

      case PHYSICAL_EXAMINATION:
        temp=examination.slice(0)
        temp[idx][key] = value  
        setExamination(temp)
        break;

      case PROCEDURES:
        temp=procedures.slice(0)
        temp[idx][key] = value  
        setProcedures(temp)
        break;

      case QUESTIONNAIRES:
        temp=questionnaire.slice(0)
        temp[idx][key] = value  
        setQuestionnaire(temp)
        break;

      case STUDY_PROCEDURES:
        temp=studyProcedures.slice(0)
        temp[idx][key] = value  
        setStudyProcedures(temp)
        break;
      }
  }
  const onRemoveCustomEvent=(category,idx) =>{
    let temp;
    switch (category){
      case LABS:
        temp=labs.slice(0)
        temp.splice(idx,1)
        setLabs(temp)
        break;

        case PHYSICAL_EXAMINATION:
          temp=examination.slice(0)
          temp.splice(idx,1)
          setExamination(temp)
          break;
  
        case PROCEDURES:
          temp=procedures.slice(0)
          temp.splice(idx,1)
          setProcedures(temp)
          break;
  
        case QUESTIONNAIRES:
          temp=questionnaire.slice(0)
          temp.splice(idx,1)
          setQuestionnaire(temp)
          break;
  
        case STUDY_PROCEDURES:
          temp=studyProcedures.slice(0)
          temp.splice(idx,1)
          setStudyProcedures(temp)
          break;
      }
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
    props.saveEvents(scheduleOfEvents)
  }

  function callback(key) {
    setExpandKeys(key)
  }

  return (
    <div className="event-list-container">
      <div className="container-top">
        <span>Schedule of Events</span>
        {
          !viewOnly&&(
            <Button type="primary" size="small" onClick={onSave}>
            Save
            </Button>
          )
        }   
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
                    return viewOnly?<span className="td">{week}</span>: <Input className="td" value={week} onChange={(e)=>onWeekChange(e,idx)} />                  
                  })
                }
              </div>
            </div>
          </div>
        </div>
        <Collapse defaultActiveKey={["1"]} activeKey={expandKeys}  onChange={callback}>
          <Panel
            header={
              <div className="event-panel-head">
                <div className="event-title e-row">
                  <div className="name">
                    {`${LABS} (${labs.length})`} {!viewOnly&&<span className="add-event" onClick={(e)=>onAddEvent(e,LABS)}>Add Event</span> } 
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
                      <div className={`${evt.Custom?"custom-event ":""}my-event-td td f-2`}>                      
                        {
                          viewOnly?evt["Standard Event"]:(
                            <>
                            {
                              !evt.Custom?evt["Standard Event"]:(
                                <>
                                  <MinusCircleOutlined onClick={()=>onRemoveCustomEvent(LABS,idx)}/> <Input value={evt["Standard Event"]} onChange={(e)=>onCustomEventNameChange(e,LABS,idx,"Standard Event")} />
                                </>
                              )                       
                            }
                            </>
                          )
                        }            
                      </div>
                      <div className="endpoint-td td f-2">
                        {
                          viewOnly? <span>{evt.endpoint}</span>: endpointsSelector(evt,idx)
                        }                     
                      </div>
                      <div className="cost-td td f-1-small">
                        {
                          viewOnly?`$ ${evt["Dummy Cost"]}`:(
                            <>
                             {
                              !evt.Custom?`$${evt["Dummy Cost"]}`:<>$ <Input value={evt["Dummy Cost"]} onChange={(e)=>onCustomEventNameChange(e,LABS,idx,"Dummy Cost")} /></>
                              } 
                            </>
                          )
                        }                   
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
                                className={`${viewOnly?'viewOnly':''} incon-wrapper`}
                                onClick={!viewOnly?() => toggleChecked(evt, idx):null}
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
                    {`${PHYSICAL_EXAMINATION} (${examination.length})`} {!viewOnly&&<span className="add-event" onClick={(e)=>onAddEvent(e,PHYSICAL_EXAMINATION)}>Add Event</span> }
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
                      <div className={`${evt.Custom?"custom-event":""} my-event-td td f-2`}>
                        {
                          viewOnly?evt["Standard Event"]:(
                            <>
                            {
                              !evt.Custom?evt["Standard Event"]:(
                                <>
                                  <MinusCircleOutlined onClick={()=>onRemoveCustomEvent(PHYSICAL_EXAMINATION,idx)}/> <Input value={evt["Standard Event"]} onChange={(e)=>onCustomEventNameChange(e,PHYSICAL_EXAMINATION,idx,"Standard Event")} />
                                </>
                              )                       
                            }  
                            </>
                          )
                        }                
                      </div>
                      <div className="endpoint-td td f-2">
                      {
                          viewOnly? <span>{evt.endpoint}</span>: endpointsSelector(evt,idx)
                        } 
                      </div>
                      <div className="cost-td td f-1-small">
                        {
                          viewOnly?`$ ${evt["Dummy Cost"]}`:(
                            <>
                             {
                              !evt.Custom?`$${evt["Dummy Cost"]}`:<>$ <Input value={evt["Dummy Cost"]} onChange={(e)=>onCustomEventNameChange(e,PHYSICAL_EXAMINATION,idx,"Dummy Cost")} /></>
                              } 
                            </>
                          )
                        } 
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
                                onClick={!viewOnly?() => toggleChecked(evt, idx):null}
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
                    {`${PROCEDURES} (${procedures.length})`} {!viewOnly&&<span className="add-event" onClick={(e)=>onAddEvent(e,PROCEDURES)}>Add Event</span>}
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
                      <div className={`${evt.Custom?"custom-event ":""}my-event-td td f-2`}>
                      {
                        viewOnly?evt["Standard Event"]:(
                          <>
                            {
                            !evt.Custom?evt["Standard Event"]:(
                              <>
                                <MinusCircleOutlined onClick={()=>onRemoveCustomEvent(PROCEDURES,idx)}/> <Input value={evt["Standard Event"]} onChange={(e)=>onCustomEventNameChange(e,PROCEDURES,idx,"Standard Event")} />
                              </>
                            )                       
                            }
                          </>
                        )
                      }                            
                      </div>
                      <div className="endpoint-td td f-2">
                      {
                          viewOnly? <span>{evt.endpoint}</span>: endpointsSelector(evt,idx)
                        } 
                      </div>
                      <div className="cost-td td f-1-small">
                        {
                          viewOnly?`$ ${evt["Dummy Cost"]}`:(
                            <>
                             {
                              !evt.Custom?`$${evt["Dummy Cost"]}`:<>$ <Input value={evt["Dummy Cost"]} onChange={(e)=>onCustomEventNameChange(e,PROCEDURES,idx,"Dummy Cost")} /></>
                              } 
                            </>
                          )
                        }  
                        
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
                                onClick={!viewOnly?() => toggleChecked(evt, idx):null}
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
                    {`${QUESTIONNAIRES} (${questionnaire.length})`} {!viewOnly&&<span className="add-event" onClick={(e)=>onAddEvent(e,QUESTIONNAIRES)}>Add Event</span>}
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
                      <div className={`${evt.Custom?"custom-event ":""}my-event-td td f-2`}>
                      {
                        viewOnly?evt["Standard Event"]:(
                          <>
                            {
                              !evt.Custom?evt["Standard Event"]:(
                                <>
                                  <MinusCircleOutlined onClick={()=>onRemoveCustomEvent(QUESTIONNAIRES,idx)}/> <Input value={evt["Standard Event"]} onChange={(e)=>onCustomEventNameChange(e,QUESTIONNAIRES,idx,"Standard Event")} />
                                </>
                              )                       
                            }  
                          </>
                        )
                      }         
                      </div>
                      <div className="endpoint-td td f-2">
                      {
                          viewOnly? <span>{evt.endpoint}</span>: endpointsSelector(evt,idx)
                        } 
                      </div>
                      <div className="cost-td td f-1-small">
                        {
                          viewOnly?`$ ${evt["Dummy Cost"]}`:(
                            <>
                             {
                              !evt.Custom?`$${evt["Dummy Cost"]}`:<>$ <Input value={evt["Dummy Cost"]} onChange={(e)=>onCustomEventNameChange(e,QUESTIONNAIRES,idx,"Dummy Cost")} /></>
                              } 
                            </>
                          )
                        }  

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
                                onClick={!viewOnly?() => toggleChecked(evt, idx):null}
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
                    {`${STUDY_PROCEDURES} (${studyProcedures.length})`} {!viewOnly&&<span className="add-event" onClick={(e)=>onAddEvent(e,STUDY_PROCEDURES)}>Add Event</span>}
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
                      <div className={`${evt.Custom?"custom-event ":""}my-event-td td f-2`}>
                      {
                        viewOnly?evt["Standard Event"]:(
                          <>
                           {
                            !evt.Custom?evt["Standard Event"]:(
                              <>
                                <MinusCircleOutlined onClick={()=>onRemoveCustomEvent(STUDY_PROCEDURES,idx)}/> <Input value={evt["Standard Event"]} onChange={(e)=>onCustomEventNameChange(e,STUDY_PROCEDURES,idx,"Standard Event")} />
                              </>
                            )                       
                          }   
                          </>
                        )
                      }  
                      
                      </div>
                      <div className="endpoint-td td f-2">
                        {
                          viewOnly? <span>{evt.endpoint}</span>: endpointsSelector(evt,idx)
                        } 
                      </div>
                      <div className="cost-td td f-1-small">
                        {
                          viewOnly?`$ ${evt["Dummy Cost"]}`:(
                            <>
                             {
                              !evt.Custom?`$${evt["Dummy Cost"]}`:<>$ <Input value={evt["Dummy Cost"]} onChange={(e)=>onCustomEventNameChange(e,STUDY_PROCEDURES,idx,"Dummy Cost")} /></>
                              } 
                            </>
                          )
                        }  
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
                                onClick={!viewOnly?() => toggleChecked(evt, idx):null}
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
