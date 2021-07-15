import React, { useState, useReducer, useEffect } from "react";
import { withRouter } from "react-router";
import { Tabs, Row, Col } from 'antd';
import { ArrowLeftOutlined} from "@ant-design/icons";
import "./index.scss";
import EditTable from "../../components/EditTable";
import EventList from '../EventList';

const { TabPane } = Tabs;
const initialNumber = {
    visitNumber: 9,
    weekNumber: 26
}

const CATEGORY_LABS = 'Labs';
const CATEGORY_PHYSICAL_EXAMINATION = 'Physical Examination';
const CATEGORY_PROCEDURES = 'Procedures';
const CATEGORY_QUESTIONNAIRES = 'Questionnaires';
const CATEGORY_STUDY_PROCEDURES = 'Study Procedures';

const defaultActiveKey = [2, 3, 4, 5, 6, 7, 8, 9]

const ScenarioDetails = (props: any) => {
  const [record, setRecord] = useState(props.record || {});
  const [scenario, setScenario] = useState({});

  // inclusion criteria data for EditTable
  let [demographicsTableData, setDemographicsTableData] = useState([])
  let [interventionTableData, setInterventionTableData] = useState([])
  let [medConditionTableData, setMedConditionTableData] = useState([])
  let [labTestTableData, setLabTestTableData] = useState([])

  // exclusion criteria data for EditTable
  let [excluDemographicsTableData, setExcluDemographicsTableData] = useState([])
  let [excluInterventionTableData, setExcluInterventionTableData] = useState([])
  let [excluMedConditionTableData, setExcluMedConditionTableData] = useState([])
  let [excluLabTestTableData, setExcluLabTestTableData] = useState([])

  //Addedd data 
  let [addedLabs, setAddedLabs] = useState([])
  let [addedExamination, setAddedExamination] = useState([])
  let [addedQuestionnaires, setAddedQuestionnaires] = useState([])
  let [addedProcedures, setAddedProcedures] = useState([])
  let [addedStudyProcedures, setAddedStudyProcedures] = useState([])

  const [numbers, setNumbers] = useReducer(
    (state, newState) => ({ ...state, ...newState }),
    { ...initialNumber }
  );
  const [weeks, setWeeks] = useState([])

  useEffect(() => {
    const scenario = props.record.scenarios.find((e) => e['scenario_id'] === props.scenarioId)
    const eventsConfigure = scenario['Schedule of Events']

    if(scenario != undefined){
        setScenario(scenario)
        if(scenario['Inclusion Criteria'].Demographics !== undefined 
            && scenario['Inclusion Criteria'].Demographics.Entities !== undefined){
            setDemographicsTableData(scenario['Inclusion Criteria'].Demographics.Entities)
            setInterventionTableData(scenario['Inclusion Criteria'].Intervention.Entities)
            setMedConditionTableData(scenario['Inclusion Criteria']['Medical Condition'].Entities)
            setLabTestTableData(scenario['Inclusion Criteria']['Lab / Test'].Entities)
            
            setExcluDemographicsTableData(scenario['Exclusion Criteria'].Demographics.Entities)
            setExcluInterventionTableData(scenario['Exclusion Criteria']['Medical Condition'].Entities)
            setExcluMedConditionTableData(scenario['Exclusion Criteria'].Intervention.Entities)
            setExcluLabTestTableData(scenario['Exclusion Criteria']['Lab / Test'].Entities)
        }
    }

    if(eventsConfigure != undefined && eventsConfigure.Labs != undefined){
        setNumbers({
          ['visitNumber']: eventsConfigure.Visits,
          ['weekNumber']: eventsConfigure.Weeks[eventsConfigure.Weeks.length -1]
        });
        setWeeks(eventsConfigure.Weeks)
        
        setAddedLabs(eventsConfigure[CATEGORY_LABS].entities)
        setAddedExamination(eventsConfigure[CATEGORY_PHYSICAL_EXAMINATION].entities)
        setAddedQuestionnaires(eventsConfigure[CATEGORY_QUESTIONNAIRES].entities)
        setAddedProcedures(eventsConfigure[CATEGORY_PROCEDURES].entities)
        setAddedStudyProcedures(eventsConfigure[CATEGORY_STUDY_PROCEDURES].entities)
      } 
  },[props.record, props.scenarioId]);
  
  return (
    <>
        <div className="trial-detail-container">
            <div className="scenario-info">
                <span className="go-back" onClick={props.handleBack}><ArrowLeftOutlined />&nbsp;BACK</span>
                <span className="scenario-type">{scenario['scenario_type']}&nbsp;:&nbsp;{scenario['scenario_name']}</span>
                <span className="scenario-desc">{scenario['scenario_description']}</span>
            </div>
            <div className="info">
                <div className="info-row">
                <div className="scenario-section">
                    <span className="section-title">Protocol Amendment Rate</span>
                    <span className="section-value">{scenario["protocol_amendment_rate"]}</span>
                    <span className={`section-level ${scenario["protocol_amendment_rate_state"]}`}>{scenario["protocol_amendment_rate_state"]}</span>
                </div>
                <div className="scenario-section">
                    <span className="section-title">Screen Failure Rate</span>
                    <span className="section-value">{scenario["screen_failure_rate"]}</span>
                    <span className={`section-level ${scenario["screen_failure_rate_state"]}`}>{scenario["screen_failure_rate_state"]}</span>
                </div>
                <div className="scenario-section">
                    <span className="section-title">Patient Burden</span>
                    <span className="section-value">{scenario["patient_burden"]}</span>
                    <span className={`section-level ${scenario["patient_burden_state"]}`}>{scenario["patient_burden_state"]}</span>
                </div>
                <div className="scenario-section">
                    <span className="section-title">Cost</span>
                    <span className="section-value">{scenario["cost"]}</span>
                    <span className={`section-level ${scenario["cost_state"]}`}>{scenario["cost_state"]}</span>
                </div>
                </div>
            </div>
        </div>
        <div className={`rationale-info ${scenario['rationale'] === undefined ? 'hidde' : ''}`}>
            <span className="title">Rationale</span>
            <span className="content">{scenario['rationale']}</span>
        </div>
        <div className="scenario-details-tab">
            <Tabs defaultActiveKey="1" centered>
                <TabPane tab="INCLUSION / EXCLUSION CRITERIA" key="1">
                <div className="criteria-container">
                    <div className="criteria-inner">
                        <div className="criteria-type">
                            <span>Inclusion Criteria</span>
                        </div>
                        <div className="criteria-header">
                            <Row>
                                <Col span={3}><div className="col-item">S/No.</div></Col>
                                <Col span={7}><div className="col-item">Eligibility Criteria</div></Col>
                                <Col span={7}><div className="col-item">Values</div></Col>
                                <Col span={7}><div className="col-item">Timeframe</div></Col>
                            </Row>
                        </div>
                        <div className="criteria-table none-click">
                            <EditTable tableIndex={2}                                
                                data={demographicsTableData} defaultActiveKey={defaultActiveKey}
                                collapsible={false} panelHeader={"Demographics"} />
                            <EditTable tableIndex={3}
                                data={medConditionTableData} defaultActiveKey={defaultActiveKey}
                                collapsible={true} panelHeader={"Medical Condition"} />
                            <EditTable tableIndex={4} 
                                data={interventionTableData} defaultActiveKey={defaultActiveKey}
                                collapsible={true} panelHeader={"Intervention"} />
                            <EditTable tableIndex={5} 
                                data={labTestTableData} defaultActiveKey={defaultActiveKey}
                                collapsible={true} panelHeader={"Lab / Test"} />
                        </div>
                        <div className="criteria-type">
                            <span>Exclusion Criteria</span>
                        </div>
                        <div className="criteria-header">
                            <Row>
                                <Col span={3}><div className="col-item">S/No.</div></Col>
                                <Col span={7}><div className="col-item">Eligibility Criteria</div></Col>
                                <Col span={7}><div className="col-item">Values</div></Col>
                                <Col span={7}><div className="col-item">Timeframe</div></Col>
                            </Row>
                        </div>
                        <div className="criteria-table none-click">
                            <EditTable tableIndex={6}                                
                                data={excluDemographicsTableData} defaultActiveKey={defaultActiveKey}
                                collapsible={false} panelHeader={"Demographics"} />
                            <EditTable tableIndex={7}
                                data={excluMedConditionTableData} defaultActiveKey={defaultActiveKey}
                                collapsible={true} panelHeader={"Medical Condition"} />
                            <EditTable tableIndex={8} 
                                data={excluInterventionTableData} defaultActiveKey={defaultActiveKey}
                                collapsible={true} panelHeader={"Intervention"} />
                            <EditTable tableIndex={9} 
                                data={excluLabTestTableData} defaultActiveKey={defaultActiveKey}
                                collapsible={true} panelHeader={"Lab / Test"} />
                        </div>
                    </div>
                </div>
                </TabPane>
                <TabPane tab="SCHEDULE OF EVENTS" key="2">
                    <EventList
                      numbers={numbers}
                      labs={addedLabs}
                      examination={addedExamination}
                      procedures={addedProcedures}
                      questionnaire={addedQuestionnaires}
                      studyProcedures={addedStudyProcedures}
                      weeks={weeks}
                      submitType={0}
                      viewOnly={true}
                    />
                </TabPane>
            </Tabs>
        </div>
    </>
  );
};

export default withRouter(ScenarioDetails);
