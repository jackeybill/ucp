import React, { useState, useEffect, useReducer, useRef, useMemo, useCallback, memo} from 'react';
import jsPDF from "jspdf";
import 'jspdf-autotable';
import FileSaver from 'file-saver';
import {Button, Collapse, Slider, Dropdown,Menu, Row, Col, Tabs, Tooltip, Spin, message, Steps,Drawer, Input, AutoComplete, Select,Breadcrumb,} from "antd";
import {updateStudy, getSimilarhistoricalTrialById, getStudy, getCriteriaLibByNctId, getSOAResource, getIEResource, getPatientFunnelData, checkTrialPatientFunnelData} from "../../utils/ajax-proxy";
import {withRouter } from 'react-router';
import {LeftOutlined,MenuOutlined, HistoryOutlined, CloseOutlined, EditFilled, DownOutlined,DownloadOutlined, CaretRightOutlined, LoadingOutlined, ArrowRightOutlined, SearchOutlined, HomeOutlined, UserOutlined, CheckOutlined,MinusOutlined,PlusOutlined } from "@ant-design/icons";

import ReactECharts from 'echarts-for-react';
import "./index.scss";
import CriteriaOption from "../../components/CriteriaOption";
import EditTable from "../../components/EditTable";
import SelectableTable from "../../components/SelectableTable";
import ScheduleEvents from "../../components/ScheduleEvents";
import { setFlagsFromString } from 'v8';


const { Panel } = Collapse;
const { TabPane } = Tabs;
const { Step } = Steps;
const { Option, OptGroup } = Select;
const { SubMenu } = Menu;

const frequencyFilter = [5, 100]
const inActiveChartColors = ['#DADADA', '#DADADA', '#DADADA', '#DADADA']
const activeChartColors = ['#E53500', '#F27A26', '#F5924D', '#FBD0B3']
const simliarTrialStudyStartDate = { dateFrom: 1990, dateTo: 2025}
const colorList = {
  'AMERICAN INDIAN/ALASKA NATIVE': '#CA4A04', 
  'ASIAN': '#E84F22', 
  'BLACK/AFRICAN AMERICAN': '#F27A26', 
  'HISPANIC/LATINO': '#E68700', 
  'MULTI RACE ETHNICITY': '#F5924D', 
  'NATIVE HAWAIIAN/OTHER PACIFIC ISLANDER': '#CA4A044D', 
  'OTHER': '#FBD6BD', 
  'UNKNOWN': '#FBD0B3', 
  'WHITE': '#FDECE0',
  "HIGHLIGHTED":'#FDECE0',
  "NOT HIGHLIGHTED": '#E84F22',
  "ACTIVE LEGEND": '#000000'
}

const panelHeader = () => {
    return (
        <div className="trial-panelHeader">
            <div>
                <div className="bar-desc"><span>Impact</span></div>
                <div className="item-desc"><div className="bar-item item1"></div><span>Labs / Tests</span></div>
                <div className="item-desc"><span className="bar-item item2"></span><span>Intervention</span></div>
                <div className="item-desc"><span className="bar-item item3"></span><span>Demographics</span></div>
                <div className="item-desc"><span className="bar-item item4"></span><span>Medical Condition</span></div>
            </div>
        </div>
    );
};

const defaultChartValue = [
  {value: 0, name: 'Labs / Tests'},
  {value: 0, name: 'Intervention'},
  {value: 0, name: 'Demographics'},
  {value: 0, name: 'Medical Condition'}
]

const initialTrial = {
    scenarios:[]
}
const initialScenario = {
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

const CATEGORY_LABS = 'Labs';
const CATEGORY_PHYSICAL_EXAMINATION = 'Physical Examination';
const CATEGORY_PROCEDURES = 'Procedures';
const CATEGORY_QUESTIONNAIRES = 'Questionnaires';
const CATEGORY_STUDY_PROCEDURES = 'Study Procedures';

const visitDimensionalScore = [
  {Dimension: 'AnxietyInducing', Value: 5},
  {Dimension: 'HospitalDependent', Value: 25},
  {Dimension: 'PhysicallyInvasive', Value: 10},
  {Dimension: 'BloodDraw', Value: 15},
  {Dimension: 'Sedation', Value: 35},
  {Dimension: 'Injection', Value: 15},
  {Dimension: 'Urine', Value: 5},
  {Dimension: 'RequireFasting', Value: 7},
  {Dimension: 'LongerThanTwoHours', Value: 20},
  {Dimension: 'Questionnaire', Value: 5}
]

const ScenarioPage = (props) => {
    //Common cons
    const [trialTitle, setTrialTitle] = useState('')
    const [trialRecord, setTrialRecord] = useReducer(
        (state, newState) => ({ ...state, ...newState }),
        { ...initialTrial }
    );
    const [scenario, setScenario] = useReducer(
        (state, newState) => ({ ...state, ...newState }),
        { ...initialScenario }
    );

    const [str, setStr] = useState('')

    const [scenarioId, setScenarioId] = useState('')
    const [editFlag, setEditFlag] = useState(false)
    const [avgFileKey, setAvgFileKey] = useState('')
    const [scenarioType, setScenarioType] = useState('')
    const [activeEnrollmentTabKey, setActiveEnrollmentTabKey] = useState('1')
    const [activeTabKey, setActiveTabKey] = useState('1')
    const [processStep, setProcessStep] = useState(0)
    const [submitType, setSubmitType] = useState(0)
    const [similarHistoricalTrials, setSimilarHistoricalTrials] = useState([])
    const [spinning, setSpinning] = useState(false)
    const [showChartLabel, setShowChartLabel] = useState(false)
    const [pageLoading, setPageLoading] = useState(true)

    const [showHistorical, setShowHistorical] = useState(false)
    const [historicalTrialdata, setHistoricalTrialdata] = useState([])
    const [visibleSOA, setVisibleSOA] = useState(false)
    const [soaResource, setSOAResource] = useState([])
    const [ieResource, setIEResource] = useState('')

    //------------------------INCLUSION CRITERIA CONST START-----------------------------
    
    //Original libs for filter purpose
    const [originDemographics, setOriginDemographics] = useState([])
    const [originIntervention, setOriginIntervention] = useState([])
    const [originMedCondition, setOriginMedCondition] = useState([])
    const [originLabTest, setOriginLabTest] = useState([])

    const [searchDemographics, setSearchDemographics] = useState([])
    const [searchIntervention, setSearchIntervention] = useState([])
    const [searchMedCondition, setSearchMedCondition] = useState([])
    const [searchLabTest, setSearchLabTest] = useState([])

    //Filtered libs for display and selection purpose
    const [demographics, setDemographics] = useState([])
    const [intervention, setIntervention] = useState([])
    const [medCondition, setMedCondition] = useState([])
    const [labTest, setLabTest] = useState([])
    
    //For inclusion chart data display
    const [protocolRateData, setProtocolRateData] = useState(defaultChartValue)
    const [screenRateData, setScreenRateData] = useState(defaultChartValue)
    const [therapeutic_Amend_Avg, setTherapeutic_Amend_Avg] = useState('')
    const [therapeutic_Screen_Avg, setTherapeutic_Screen_Avg] = useState('')
    const [impactColors, setImpactColors] = useState(inActiveChartColors)
    const [amend_avg_rate, setAmend_avg_rate] = useState('')
    const [screen_avg_rate, setScreen_avg_rate] = useState('')

    const [rollHeight, setRollHeight] = useState(true)            // Control editTable scroll height
    const [visible, setVisible] = useState(false)                 // Control libs filter slider bar display or not
    const [minValue, setMinValue] = useState(frequencyFilter[0])  //Slider bar minimon value
    const [maxValue, setMaxValue] = useState(frequencyFilter[1])  //Slider bar maximom value
    const [defaultActiveKey, setDefaultActiveKey] = useState([])  //default expanded collapse for edittable
    const [activeKey, setActiveKey] = useState([])                //To control chart collapse expanding
    const [collapsible, setCollapsible] = useState(true)// Set collapse can be click to collapse/expand or not
    const [criteriaLib, setCriteriaLib] = useState(6)
  
    //To store the selected inclusion criteria libs
   let [demographicsElements, setDemographicsElements] = useState([])
   let [interventionElements , setInterventionElements ] = useState([])
   let [medConditionElements, setMedConditionElements] = useState([])
   let [labTestElements, setLabTestElements] = useState([])
  
    // inclusion criteria data for EditTable
  let [demographicsTableData, setDemographicsTableData] = useState([])
  let [interventionTableData, setInterventionTableData] = useState([])
  let [medConditionTableData, setMedConditionTableData] = useState([])
  let [labTestTableData, setLabTestTableData] = useState([])

  const [searchTxt,setSearchTxt] = useState("")
  const [searchTxtExclu,setSearchTxtExclu] = useState("")
  

  const [visibleValue, setVisibleValue] = useState(false)
  const [visibleValueExclu, setVisibleValueExclu] = useState(false)

  // const [whetherClick, setWhetherClick] = useState(false)

    //------------------------INCLUSION CRITERIA CONST END-----------------------------

    //------------------------EXCLUSION CRITERIA CONST START-----------------------------
    //Original libs for filter purpose
    const [originExcluDemographics, setOriginExcluDemographics] = useState([])
    const [originExcluIntervention, setOriginExcluIntervention] = useState([])
    const [originExcluMedCondition, setOriginExcluMedCondition] = useState([])
    const [originExcluLabTest, setOriginExcluLabTest] = useState([])

    const [searchDemographicsExclu, setSearchDemographicsExclu] = useState([])
    const [searchInterventionExclu, setSearchInterventionExclu] = useState([])
    const [searchMedConditionExclu, setSearchMedConditionExclu] = useState([])
    const [searchLabTestExclu, setSearchLabTestExclu] = useState([])
    
    //Filtered libs for display and selection purpose
    const [excluDemographics, setExcluDemographics] = useState([])
    const [excluMedCondition, setExcluMedCondition] = useState([])
    const [excluIntervention, setExcluIntervention] = useState([])
    const [excluLabTest, setExcluLabTest] = useState([])
    
    //For exclusion chart data display
    const [excluProtocolRateData, setExcluProtocolRateData] = useState(defaultChartValue)
    const [excluScreenRateData, setExcluScreenRateData] = useState(defaultChartValue)
    const [exclu_Therapeutic_Amend_Avg, setExcluTherapeutic_Amend_Avg] = useState('Therapeutic Area Average - 40%')
    const [exclu_Therapeutic_Screen_Avg, setExcluTherapeutic_Screen_Avg] = useState('Therapeutic Area Average - 35%')
    const [excluImpactColors, setExcluImpactColors] = useState(inActiveChartColors)
    const [excluAmend_avg_rate, setExcluAmend_avg_rate] = useState('')
    const [excluScreen_avg_rate, setExcluScreen_avg_rate] = useState('')

    const [excluRollHeight, setExcluRollHeight] = useState(true)            // Control editTable scroll height
    const [excluVisible, setExcluVisible] = useState(false);                // Control libs filter slider bar display or not
    const [excluMinValue, setExcluMinValue] = useState(frequencyFilter[0])  //Slider bar minimon value
    const [excluMaxValue, setExcluMaxValue] = useState(frequencyFilter[1])  //Slider bar maximom value
    const [excluDefaultActiveKey, setExcluDefaultActiveKey] = useState([])  //default expanded collapse for edittable
    const [excluActiveKey, setExcluActiveKey] = useState([])                //To control chart collapse expanding
    const [excluCollapsible, setExcluCollapsible] = useState(true)          // Set collapse can be click to collapse/expand or not
    const [excluCriteriaLib, setExcluCriteriaLib] = useState(6)

    //To store the selected exclusion criteria libs
    let [excluDemographicsElements, setExcluDemographicsElements] = useState([])
    let [excluMedConditionElements , setExcluMedConditionElements ] = useState([])
    let [excluInterventionElements, setExcluInterventionElements] = useState([])
    let [excluLabTestElements, setExcluLabTestElements] = useState([])
  
    // exclusion criteria data for EditTable
  let [excluDemographicsTableData, setExcluDemographicsTableData] = useState([])
  let [excluInterventionTableData, setExcluInterventionTableData] = useState([])
  let [excluMedConditionTableData, setExcluMedConditionTableData] = useState([])
  let [excluLabTestTableData, setExcluLabTestTableData] = useState([])

  const [eliPatient, setEliPatient] = useState(0)
  const [rateEliPatient, setRateEliPatient] = useState('')
  const [rateFeEliPatient, setRateFeEliPatient] = useState('')
  const [enrollCriteriaLib, setEnrollCriteriaLib] = useState([])
  const [enrollCriteriaLibBelow, setEnrollCriteriaLibBelow] = useState([])
  const [finalEthnicityData, setFinalEthnicityData] = useState([])
  const [ethLegendColor, setEthLegendColor] = useState([])

  const [eliPatientChartTitle, setEliPatientChartTitle] = useState('')
  const [eliPatientResultData, setEliPatientResultData] = useState([])
  const [fePatientChartTitle, setFePatientChartTitle] = useState('')
  const [fePatientResultData, setFePatientResultData] = useState([])
  const [ethPatientChartTitle, setEthPatientChartTitle] = useState('')
  const [ethPatientResultData, setEthPatientResultData] = useState([])
  
  const [loadPatientFunnel, setLoadPatientFunnel] = useState(false)
  const [reloadPTData, setReloadPTData] = useState(false)
  const [initPTData, setInitPTData] = useState(true)
  const [funnelChartheight, setFunnelChartheight] = useState(200)
  // const [funnelChartheightBelow, setFunnelChartheightBelow] = useState(200)
  const [funnelChartheightOverlap, setFunnelChartheightOverlap] = useState(100)

    //------------------------EXCLUSION CRITERIA CONST END-----------------------------
  
    const getTrialById = async () => {
      const resp = await getStudy(props.location.state.trial_id);
      console.log("getlist",resp);
      
      if(resp.statusCode == 200){
          const tempRecord = JSON.parse(JSON.stringify(resp.body))
          setTrialRecord(tempRecord)
          setTrialTitle(tempRecord['trial_alias'])
          if(tempRecord.similarHistoricalTrials !== undefined){
            setSimilarHistoricalTrials(tempRecord.similarHistoricalTrials)
          }
          
          const tempScenarioId = props.location.state.scenarioId
          const tempEditFlag = props.location.state.editFlag
          const tempScenarioType = props.location.state.scenarioType
          const tempScenario = tempRecord.scenarios.find( i=> i['scenario_id'] == tempScenarioId)
          setScenarioId(tempScenarioId)
          setEditFlag(tempEditFlag)
          setScenarioType(tempScenarioType)
          setScenario(tempScenario)

          console.log('edit scenario for: ' +  tempScenarioId + ': ' +  tempEditFlag)

          if(tempEditFlag && tempScenario['Inclusion Criteria'].Demographics !== undefined
            && tempScenario['Inclusion Criteria'].Demographics.Entities !== undefined){
              demographicsElements = tempScenario['Inclusion Criteria'].Demographics.Entities
              interventionElements = tempScenario['Inclusion Criteria'].Intervention.Entities
              medConditionElements = tempScenario['Inclusion Criteria']['Medical Condition'].Entities
              labTestElements = tempScenario['Inclusion Criteria']['Lab / Test'].Entities
              
              excluDemographicsElements = tempScenario['Exclusion Criteria'].Demographics.Entities
              excluMedConditionElements = tempScenario['Exclusion Criteria']['Medical Condition'].Entities
              excluInterventionElements = tempScenario['Exclusion Criteria'].Intervention.Entities
              excluLabTestElements = tempScenario['Exclusion Criteria']['Lab / Test'].Entities

              //Get inclusion chart info
              var inclu = tempScenario["Inclusion Criteria"]
              
              setProtocolRateData([
                  {value: formatNumber(inclu['Lab / Test'].protocol_amendment_rate), name: 'Labs / Tests'},
                  {value: formatNumber(inclu.Intervention.protocol_amendment_rate), name: 'Intervention'},
                  {value: formatNumber(inclu.Demographics.protocol_amendment_rate), name: 'Demographics'},
                  {value: formatNumber(inclu['Medical Condition'].protocol_amendment_rate), name: 'Medical Condition'}
              ])
              setScreenRateData([
                  {value: formatNumber(inclu['Lab / Test'].screen_failure_rate), name: 'Labs / Tests'},
                  {value: formatNumber(inclu.Intervention.screen_failure_rate), name: 'Intervention'},
                  {value: formatNumber(inclu.Demographics.screen_failure_rate), name: 'Demographics'},
                  {value: formatNumber(inclu['Medical Condition'].screen_failure_rate), name: 'Medical Condition'}
              ])
      
              var tempScoreA = ''
              var tempScoreB = ''
                  
                  var score = formatNumber(tempScenario.protocol_amendment_rate)
                  if(score <= 33){
                    tempScoreA = '{p|' + tempScenario.protocol_amendment_rate + '}\n{good|GOOD}'
                  } else if(score > 33  && score <= 67){
                    tempScoreA = '{p|' + tempScenario.protocol_amendment_rate + '}\n{fair|FAIR}'
                  } else if(score > 67){
                    tempScoreA = '{p|' + tempScenario.protocol_amendment_rate + '}\n{poor|POOR}'
                  }

                  var scoreB = formatNumber(tempScenario.screen_failure_rate)
                  if(scoreB <= 33){
                    tempScoreB = '{p|' + tempScenario.screen_failure_rate + '}\n{good|GOOD}'
                  } else if(scoreB > 33  && scoreB <= 67){
                    tempScoreB = '{p|' + tempScenario.screen_failure_rate + '}\n{fair|FAIR}'
                  } else if(scoreB > 67){
                    tempScoreB = '{p|' + tempScenario.screen_failure_rate + '}\n{poor|POOR}'
                  }

                  setAmend_avg_rate(tempScoreA)
                  setScreen_avg_rate(tempScoreB)

              //Get exclusion chart info
              var exclu = tempScenario["Exclusion Criteria"]
              
              setExcluProtocolRateData([
                  {value: formatNumber(exclu['Lab / Test'].protocol_amendment_rate), name: 'Labs / Tests'},
                  {value: formatNumber(exclu.Intervention.protocol_amendment_rate), name: 'Intervention'},
                  {value: formatNumber(exclu.Demographics.protocol_amendment_rate), name: 'Demographics'},
                  {value: formatNumber(exclu['Medical Condition'].protocol_amendment_rate), name: 'Medical Condition'}
              ])
              setExcluScreenRateData([
                  {value: formatNumber(exclu['Lab / Test'].screen_failure_rate), name: 'Labs / Tests'},
                  {value: formatNumber(exclu.Intervention.screen_failure_rate), name: 'Intervention'},
                  {value: formatNumber(exclu.Demographics.screen_failure_rate), name: 'Demographics'},
                  {value: formatNumber(exclu['Medical Condition'].screen_failure_rate), name: 'Medical Condition'}
              ])
      
                  setExcluAmend_avg_rate(tempScoreA)
                  setExcluScreen_avg_rate(tempScoreB)

              setShowChartLabel(true)
              setImpactColors(activeChartColors)
              setExcluImpactColors(activeChartColors)
          }
          
          if(tempRecord['Therapeutic Area Average']){
            setTherapeutic_Amend_Avg('Therapeutic Area Average - ' + tempRecord['Therapeutic Area Average'].protocol_amendment_rate)
            setTherapeutic_Screen_Avg('Therapeutic Area Average - ' + tempRecord['Therapeutic Area Average'].screen_failure_rate)
            setExcluTherapeutic_Amend_Avg('Therapeutic Area Average - ' + tempRecord['Therapeutic Area Average'].protocol_amendment_rate)
            setExcluTherapeutic_Screen_Avg('Therapeutic Area Average - ' + tempRecord['Therapeutic Area Average'].screen_failure_rate)
          }
          
          if(tempEditFlag){
              updateTrial(1, 2)
              updateTrial(2, 2)
          }
      }
  };
    useEffect(() => {
      if(props.location.state.trial_id == undefined || props.location.state.trial_id == ''){
        props.history.push({pathname: '/trials'})
      } else {
       
        getTrialById();
      }
    }, []);

    useEffect(() => {

        const summaryDefaultList = async () => {
          const nctIdList = props.location.state.similarHistoricalTrials
          console.log("nctIdList",nctIdList);
          console.log("input",props.location.state.similarHistoricalTrials);
          var resp = await getCriteriaLibByNctId(props.location.state.similarHistoricalTrials, props.location.state.trial_id);
          setPageLoading(false)
            if (resp.statusCode == 200) {
                setAvgFileKey(resp.csvKey)
                // const response = JSON.parse(resp.body)
                const response = resp.body
                console.log("criteria result: ", response);
                const inclusionCriteria = response[0].InclusionCriteria
                for(var i = 0; i < inclusionCriteria.length; i ++){
                    var incluIndex = getCatorgoryIndex(i, inclusionCriteria)
                    if(incluIndex == 0){
                        setOriginMedCondition(inclusionCriteria[i]['Medical Condition'])
                        // originMedCondition
                        setMedCondition(inclusionCriteria[i]['Medical Condition'].filter((d) => {
                            return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
                        }))
                    } else if(incluIndex == 1){ 
                        setOriginDemographics(inclusionCriteria[i]['Demographics'])
                        setDemographics(inclusionCriteria[i]['Demographics'].filter((d) => {
                            return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
                        }))
                    } else if(incluIndex == 2){
                        setOriginLabTest(inclusionCriteria[i]['Lab/Test'])
                        setLabTest(inclusionCriteria[i]['Lab/Test'].filter((d) => {
                            return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
                        }))
                    } else if(incluIndex == 3){
                        setOriginIntervention(inclusionCriteria[i]['Intervention'])
                        setIntervention(inclusionCriteria[i]['Intervention'].filter((d) => {
                            return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
                        }))
                    }
                }

                const exclusionCriteria = response[1].ExclusionCriteria
                for(var i = 0; i < exclusionCriteria.length; i ++){
                    var excluIndex = getCatorgoryIndex(i, exclusionCriteria)
                    if(excluIndex == 0){
                        setOriginExcluMedCondition(exclusionCriteria[i]['Medical Condition'])
                        setExcluMedCondition(exclusionCriteria[i]['Medical Condition'].filter((d) => {
                            return d.Frequency * 100 >= excluMinValue && d.Frequency * 100 <= excluMaxValue;
                        }))
                    } else if(excluIndex == 1){ 
                        setOriginExcluDemographics(exclusionCriteria[i]['Demographics'])
                        setExcluDemographics(exclusionCriteria[i]['Demographics'].filter((d) => {
                            return d.Frequency * 100 >= excluMinValue && d.Frequency * 100 <= excluMaxValue;
                        }))
                    } else if(excluIndex == 2){
                        setOriginExcluLabTest(exclusionCriteria[i]['Lab/Test'])
                        setExcluLabTest(exclusionCriteria[i]['Lab/Test'].filter((d) => {
                            return d.Frequency * 100 >= excluMinValue && d.Frequency * 100 <= excluMaxValue;
                        }))
                    } else if(excluIndex == 3){
                        setOriginExcluIntervention(exclusionCriteria[i]['Intervention'])
                        setExcluIntervention(exclusionCriteria[i]['Intervention'].filter((d) => {
                            return d.Frequency * 100 >= excluMinValue && d.Frequency * 100 <= excluMaxValue;
                        }))
                    }
                }
            }
        };
        summaryDefaultList();
      }, []);

    const eChartsRef = React.useRef(null as any);
    const eChartsBelowRef = React.useRef(null as any);

    function getCatorgoryIndex(index, list){
      if(list[index]['Medical Condition'] != undefined){
          return 0;
      } else if(list[index]['Demographics'] != undefined){
          return 1;
      } else if(list[index]['Lab/Test'] != undefined){
          return 2;
      } else if(list[index]['Intervention'] != undefined){
          return 3;
      }
    }


    const formatter = (value) => {
      return value+'%'
    }
    
  const getFrequency = (value) => {

        setMinValue(value[0])
        setMaxValue(value[1])
    
        setMedCondition(originMedCondition.filter((d) => {
            return d.Frequency * 100 >= value[0] && d.Frequency * 100 <= value[1];
        }))
        setDemographics(originDemographics.filter((d) => {
            return d.Frequency * 100 >= value[0] && d.Frequency * 100 <= value[1];
        }))
        setLabTest(originLabTest.filter((d) => {
            return d.Frequency * 100 >= value[0] && d.Frequency * 100 <= value[1];
        }))
        setIntervention(originIntervention.filter((d) => {
            return d.Frequency * 100 >= value[0] && d.Frequency * 100 <= value[1];
        }))
    }
    
    const getExcluFrequency = (value) => {
      setExcluMinValue(value[0])
      setExcluMaxValue(value[1])
    
      setExcluMedCondition(originExcluMedCondition.filter((d) => {
          return d.Frequency * 100 >= value[0] && d.Frequency * 100 <= value[1];
      }))
      setExcluDemographics(originExcluDemographics.filter((d) => {
          return d.Frequency * 100 >= value[0] && d.Frequency * 100 <= value[1];
      }))
      setExcluLabTest(originExcluLabTest.filter((d) => {
          return d.Frequency * 100 >= value[0] && d.Frequency * 100 <= value[1];
      }))
      setExcluIntervention(originExcluIntervention.filter((d) => {
          return d.Frequency * 100 >= value[0] && d.Frequency * 100 <= value[1];
      }))
    }

    const handleOptionSelect = (item, activeType, id, key) =>{
      switch(id){
        case 0:
          var index = demographicsElements.findIndex((domain) => item.Text == domain['Eligibility Criteria']);
          if(activeType == 1){
            if(index < 0){
              var newItem = {
                "Eligibility Criteria": item.Text,
                "Values": item.Text.trim().toUpperCase() === 'INSULIN' ? '-' : formatValue(item),
                "rawValue": item.Value,
                "Timeframe": item.Text.trim().toUpperCase() === 'INSULIN' ? formatValue(item) : "-",
                "Frequency":item.Frequency
              }
              demographicsElements.push(newItem)
            }
          } else {
            if(index >= 0){
              demographicsElements.splice(index, 1)         
            }
          }
          break;
        case 1:
          var index = medConditionElements.findIndex((domain) => item.Text == domain['Eligibility Criteria']);
          if(activeType == 1){
            if(index < 0){
              var newItem = {
                "Eligibility Criteria": item.Text,
                "Values": item.Text.trim().toUpperCase() === 'INSULIN' ? '-' : formatValue(item),
                "rawValue": item.Value,
                "Timeframe": item.Text.trim().toUpperCase() === 'INSULIN' ? formatValue(item) : "-",
                "Frequency":item.Frequency
              }
              medConditionElements.push(newItem)
            }
          } else {
            if(index >= 0){
              medConditionElements.splice(index, 1)
            }
          }
          break;
        case 2:
          var index = interventionElements.findIndex((domain) => item.Text == domain['Eligibility Criteria']);
          if(activeType == 1){
            if(index < 0){
              var newItem = {
                "Eligibility Criteria": item.Text,
                "Values": item.Text.trim().toUpperCase() === 'INSULIN' ? '-' : formatValue(item),
                "rawValue": item.Value,
                "Timeframe": item.Text.trim().toUpperCase() === 'INSULIN' ? formatValue(item) : "-",
                "Frequency":item.Frequency
              }
              interventionElements.push(newItem)           
            }
          } else {
            if(index >= 0){
              interventionElements.splice(index, 1)             
            }
          }
          break;
        default:
          var index = labTestElements.findIndex((domain) => item.Text == domain['Eligibility Criteria']);
          if(activeType == 1){
            if(index < 0){
              var newItem = {
                "Eligibility Criteria": item.Text,
                "Values": item.Text.trim().toUpperCase() === 'INSULIN' ? '-' : formatValue(item),
                "rawValue": item.Value,
                "Timeframe": item.Text.trim().toUpperCase() === 'INSULIN' ? formatValue(item) : "-",
                "Frequency":item.Frequency
              }
              labTestElements.push(newItem)
            }
          } else {
            if(index >= 0){
              labTestElements.splice(index, 1)
            }
          }
          break;
      }
    }

    function formatValue(item){
      console.log(item.Text, item.Value);
      
      var tempStr
      if(item.Text.toString() === "vital signs" && item.BP_value){
        console.log(item.Text,": ", item.BP_value);
        // < 150/95 mmHg
        if (item.BP_value.avg_dbp_lower == 0 && item.BP_value.avg_sbp_lower == 0 && item.BP_value.avg_dbp_upper != 0 && item.BP_value.avg_sbp_upper != 0) {
          tempStr = "< "+ Number(item.BP_value.avg_sbp_upper.toString().match(/^\d+(?:\.\d{0,2})?/))+ " / " + Number(item.BP_value.avg_dbp_upper.toString().match(/^\d+(?:\.\d{0,2})?/)) + " " + item.BP_value.units
        // > 150/95 mmHg
        } else if (item.BP_value.avg_dbp_lower != 0 && item.BP_value.avg_sbp_lower != 0 && item.BP_value.avg_dbp_upper == 0 && item.BP_value.avg_sbp_upper == 0) {
          tempStr = "> " +  Number(item.BP_value.avg_sbp_lower.toString().match(/^\d+(?:\.\d{0,2})?/))+ " / " + Number(item.BP_value.avg_dbp_lower.toString().match(/^\d+(?:\.\d{0,2})?/)) + " " + item.BP_value.units
        // 180/90 - 200/95 mmHg
        } else if (item.BP_value.avg_dbp_lower != 0 && item.BP_value.avg_sbp_lower != 0 && item.BP_value.avg_dbp_upper != 0 && item.BP_value.avg_sbp_upper != 0) {
          tempStr = Number(item.BP_value.avg_sbp_lower.toString().match(/^\d+(?:\.\d{0,2})?/))+ " / " + Number(item.BP_value.avg_dbp_lower.toString().match(/^\d+(?:\.\d{0,2})?/)) + " - " + Number(item.BP_value.avg_sbp_upper.toString().match(/^\d+(?:\.\d{0,2})?/))+ " / " + Number(item.BP_value.avg_dbp_upper.toString().match(/^\d+(?:\.\d{0,2})?/)) + " " + item.BP_value.units
        } else {
          tempStr = '-'
        }
      } else {
          if(item.Value === ''){
            if(item.Text.toString() === "vital signs" && item.BP_value){
              return
            } else {
              tempStr = '-'
            }
          } else if (item.Value.avg_value != '' && item.Value.avg_value != 0) {
            if(item.Text.toString() === "vital signs" && item.BP_value){
              return
            } else {
              tempStr = Number(item.Value.avg_value.toString().match(/^\d+(?:\.\d{0,2})?/)) + " " + item.Value.units
            }
          } else if (item.Value.avg_lower == 0 && item.Value.avg_upper != 0) {
            if(item.Text.toString() === "vital signs" && item.BP_value){
              return
            } else {
              tempStr = "< "+ Number(item.Value.avg_upper.toString().match(/^\d+(?:\.\d{0,2})?/))+ " " + item.Value.units
            }
          } else if (item.Value.avg_lower != 0 && item.Value.avg_upper == 0) {
            if(item.Text.toString() === "vital signs" && item.BP_value){
              return
            } else {
              tempStr = "> "+ Number(item.Value.avg_lower.toString().match(/^\d+(?:\.\d{0,2})?/))+ " " + item.Value.units
            }
          } else if (item.Value.avg_lower != 0 && item.Value.avg_upper != 0) {
            if(item.Text.toString() === "vital signs" && item.BP_value){
              return
            } else {
              // if (Number(item.Value.avg_lower) == Number(item.Value.avg_upper)){
              //   tempStr = Number(item.Value.avg_upper.toString().match(/^\d+(?:\.\d{0,2})?/)) + " " + item.Value.units
              tempStr = Number(item.Value.avg_lower.toString().match(/^\d+(?:\.\d{0,2})?/))+ " - " + Number(item.Value.avg_upper.toString().match(/^\d+(?:\.\d{0,2})?/)) + " " + item.Value.units
            } 
          } else {
            if(item.Text.toString() === "vital signs" && item.BP_value){
              return
            } else {
              tempStr = '-' 
            }
          }
      }
      return tempStr
    }

    const handleExcluOptionSelect = (item, activeType, id, key) =>{
      switch(id){
        case 0:
          var index = excluDemographicsElements.findIndex((domain) => item.Text == domain['Eligibility Criteria']);
          if(activeType == 1){
            if(index < 0){
              var newItem = {
                "Eligibility Criteria": item.Text,
                // "Values": formatValue(item),
                // "Timeframe": "-",
                "Values": item.Text.trim().toUpperCase() === 'INSULIN' ? '-' : formatValue(item),
                "rawValue": item.Value,
                "Timeframe": item.Text.trim().toUpperCase() === 'INSULIN' ? formatValue(item) : "-",
                "Frequency":item.Frequency
              }
              excluDemographicsElements.push(newItem)
            }
          } else {
            if(index >= 0){
              excluDemographicsElements.splice(index,1)
            }
          }
          break;
        case 1:
          var index = excluMedConditionElements.findIndex((domain) => item.Text == domain['Eligibility Criteria']);
          if(activeType == 1){
            if(index < 0){
              var newItem = {
                "Eligibility Criteria": item.Text,
                // "Values": formatValue(item),
                // "Timeframe": "-",
                "Values": item.Text.trim().toUpperCase() === 'INSULIN' ? '-' : formatValue(item),
                "rawValue": item.Value,
                "Timeframe": item.Text.trim().toUpperCase() === 'INSULIN' ? formatValue(item) : "-",
                "Frequency":item.Frequency
              }
              excluMedConditionElements.push(newItem)
            }
          } else {
            if(index >= 0){
              excluMedConditionElements.splice(index,1)
            }
          }
          break;
        case 2:
          var index = excluInterventionElements.findIndex((domain) => item.Text == domain['Eligibility Criteria']);
          if(activeType == 1){
            if(index < 0){
              var newItem = {
                "Eligibility Criteria": item.Text,
                // "Values": formatValue(item),
                // "Timeframe": "-",
                "Values": item.Text.trim().toUpperCase() === 'INSULIN' ? '-' : formatValue(item),
                "rawValue": item.Value,
                "Timeframe": item.Text.trim().toUpperCase() === 'INSULIN' ? formatValue(item) : "-",
                "Frequency":item.Frequency
              }
              excluInterventionElements.push(newItem)
            }
          } else {
            if(index >= 0){
              excluInterventionElements.splice(index,1)
            }
          }
          break;
        default:
          var index = excluLabTestElements.findIndex((domain) => item.Text == domain['Eligibility Criteria']);
          if(activeType == 1){
            if(index < 0){
              var newItem = {
                "Eligibility Criteria": item.Text,
                // "Values": formatValue(item),
                // "Timeframe": "-",
                "Values": item.Text.trim().toUpperCase() === 'INSULIN' ? '-' : formatValue(item),
                "rawValue": item.Value,
                "Timeframe": item.Text.trim().toUpperCase() === 'INSULIN' ? formatValue(item) : "-",
                "Frequency":item.Frequency
              }
              excluLabTestElements.push(newItem)
            }
          } else {
            if(index >= 0){
              excluLabTestElements.splice(index,1)
          }
        }
        break;
      }
    }

  const updateTrial = (type: number, res: number) => {
      // res: 1, update when loading page; 2, update when update criteria
      if(res == 1){
        setReloadPTData(true)
      }
      if (type == 1) {//Inclusion
        
        let demographicsElementsTmp = demographicsElements.map((item,index) =>{
          return Object.assign(item,{Key:(index + 1) + ''})
        })
        let demographicsTableDataTmp = demographicsElementsTmp.filter(d => {
          return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
        })
        setDemographicsElements(demographicsElementsTmp)
        setDemographicsTableData(demographicsTableDataTmp.map((item, id) =>{
          item.Key = (id + 1) + ''
          return item
        }))
        console.log("demographicsElementsTmp",demographicsElementsTmp);
        
        let medConditionElementsTmp = medConditionElements.map((item,index) =>{
          return Object.assign(item,{Key:(index + 1) + ''})
        })
        let medConditionTableDataTmp = medConditionElementsTmp.filter(d => {
          return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
        })
        setMedConditionElements(medConditionElementsTmp)
        setMedConditionTableData(medConditionTableDataTmp.map((item, id) =>{
          item.Key = demographicsTableDataTmp.length + (id + 1) + ''
          return item
        }))
        console.log("medConditionElementsTmp",medConditionElementsTmp);
        

         let interventionElementsTmp = interventionElements.map((item,index) =>{
          return Object.assign(item,{Key:(index + 1) + ''})
        })
         let interventionTableDataTmp = interventionElementsTmp.filter(d => {
          return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
        }) 
        setInterventionElements(interventionElementsTmp)
        setInterventionTableData(interventionTableDataTmp.map((item, id) =>{
          item.Key = demographicsTableDataTmp.length + medConditionTableDataTmp.length + (id + 1) + ''        
          return item
        }))
        console.log("interventionElementsTmp",interventionElementsTmp);
        
       
        let labTestElementsTmp = labTestElements.map((item,index) =>{
          return Object.assign(item,{Key:(index + 1) + ''})
        })
        let labTestTableDataTmp = labTestElementsTmp.filter(d => {
          return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
        }) 
        setLabTestElements(labTestElementsTmp)
        setLabTestTableData(labTestTableDataTmp.map((item, id) =>{
          item.Key = demographicsTableDataTmp.length + medConditionTableDataTmp.length + interventionTableDataTmp.length+(id + 1) + ''
          return item
        }))
        console.log("labTestElementsTmp",labTestElementsTmp);
        

        setCollapsible(false)
        setDefaultActiveKey(['2', '3', '4', '5'])

        setRollHeight(false)
        setActiveKey(['1'])
        
      } else if (type == 2) {//Exclusion


        let excluDemographicsElementsTmp = excluDemographicsElements.map((item,index) =>{
          return Object.assign(item,{Key:(index + 1) + ''})
        })
        let excluDemographicsTableDataTmp = excluDemographicsElementsTmp.filter(d => {
          return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
        })
        setExcluDemographicsElements(excluDemographicsElementsTmp )
        setExcluDemographicsTableData(excluDemographicsTableDataTmp.map((item, id) =>{
          item.Key = (id + 1) + ''
          return item
        }))


         
        let excluMedConditionElementsTmp = excluMedConditionElements.map((item,index) =>{
          return Object.assign(item,{Key:(index + 1) + ''})
        })
         let excluMedConditionTableDataTmp = excluMedConditionElementsTmp.filter(d => {
          return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
        }) 

        setExcluMedConditionElements(excluMedConditionElementsTmp )
        setExcluMedConditionTableData(excluMedConditionTableDataTmp.map((item, id) =>{
          item.Key = excluDemographicsTableDataTmp.length + (id + 1) + ''
          return item
        }))


        let excluInterventionElementsTmp = excluInterventionElements.map((item,index) =>{
          return Object.assign(item,{Key:(index + 1) + ''})
        })
         let excluInterventionTableDataTmp = excluInterventionElementsTmp.filter(d => {
          return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
         })
        setExcluInterventionElements(excluInterventionElementsTmp )
        setExcluInterventionTableData(excluInterventionTableDataTmp.map((item, id) =>{
          item.Key = excluDemographicsTableDataTmp.length + excluMedConditionTableDataTmp.length + (id + 1) + ''
          return item
        }))


        let excluLabTestElementsTmp = excluLabTestElements.map((item,index) =>{
          return Object.assign(item,{Key:(index + 1) + ''})
        })
         let excluLabTestTableDataTmp = excluLabTestElementsTmp.filter(d => {
          return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
         })
        setExcluLabTestElements(excluLabTestElementsTmp )
        setExcluLabTestTableData(excluLabTestTableDataTmp.map((item, id) =>{
          item.Key = excluDemographicsTableDataTmp.length + excluMedConditionTableDataTmp.length + excluInterventionTableDataTmp.length + (id + 1) + ''
          return item
        }))


        setExcluCollapsible(false)
        setExcluDefaultActiveKey(['2','3','4','5'])

        setExcluRollHeight(false)
        setExcluActiveKey(['1'])
      }

    
  }


    function callback(key) {
      if(key.indexOf("1") < 0){
        setRollHeight(true)
      } else {
        setRollHeight(false)
      }
      setActiveKey(key)
    }

    function excluCallback(key) {
      if(key.indexOf("1") < 0){
        setExcluRollHeight(true)
      } else {
        setExcluRollHeight(false)
      }
      setExcluActiveKey(key)
    }

    const amendmentRateoption = {
      title : {
        text: 'Protocol Amendment Rate',
        subtext: therapeutic_Amend_Avg,
        x:'left',
        y:'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#333'
        },
        subtextStyle: {
            fontSize: 14,
            fontWeight: 'normal',
            color: '#999'
        }
      },
      animation: false,
      tooltip: {
        trigger: 'item',
        formatter: '{b} - {d}%',
        extraCssText:'background:#757373;color:white;font-size:8px'
      },
      series: [
        {
          type: 'pie',
          center: ['80%', '50%'],
          radius: ['50%', '80%'],
          avoidLabelOverlap: false,
          label: {
            show: true,
            position: 'center',
            formatter: function () {
              if(showChartLabel){
                return amend_avg_rate
              } else {
                return ''
              }
            },
            emphasis: '',
            rich: {
              p: {
                color: '#848484',
                fontSize: 20,
                backgroundColor: "white"
              },
              good: {
                color: '#00A947',
                fontSize: 12,
                fontWeight:'bold',
                backgroundColor: "white"
              },
              fair: {
                color: '#0084A9',
                fontSize: 12,
                fontWeight:'bold',
                backgroundColor: "white"
              },
              poor: {
                color: '#c33232',
                fontSize: 12,
                fontWeight:'bold',
                backgroundColor: "white"
              }
            }
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '12',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: true
          },
          color: impactColors,
          data: protocolRateData
        }
      ]
    };
  
    const screenFailureOption = {
      title : {
        text: 'Screen Failure Rate',
        subtext: therapeutic_Screen_Avg,
        x:'left',
        y:'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#333'
        },
        subtextStyle: {
          fontSize: 14,
          fontWeight: 'normal',
          color: '#999'
        }
      },
      animation: false,
      tooltip: {
        trigger: 'item',
        formatter: '{b} - {d}%',
        extraCssText:'background:#757373;color:white;font-size:8px'
      },
      series: [
        {
          type: 'pie',
          center: ['80%', '50%'],
          radius: ['50%', '80%'],
          avoidLabelOverlap: false,
          label: {
            show: true,
            position: 'center',
            formatter: function () {
              if(showChartLabel){
                return screen_avg_rate
              } else {
                return ''
              }
            },
            emphasis: '',
            rich: {
              p: {
                color: '#848484',
                fontSize: 20,
                backgroundColor: "white"
              },
              good: {
                color: '#00A947',
                fontSize: 12,
                fontWeight:'bold',
                backgroundColor: "white"
              },
              fair: {
                color: '#0084A9',
                fontSize: 12,
                fontWeight:'bold',
                backgroundColor: "white"
              },
              poor: {
                color: '#c33232',
                fontSize: 12,
                fontWeight:'bold',
                backgroundColor: "white"
              }
            }
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '12',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: true
          },
          color: impactColors,
          data: screenRateData
        }
      ]
    };
  
    const excluAmendmentRateoption = {
      title : {
        text: 'Protocol Amendment Rate',
        subtext: exclu_Therapeutic_Amend_Avg,
        x:'left',
        y:'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#333'
        },
        subtextStyle: {
          fontSize: 14,
          fontWeight: 'normal',
          color: '#999'
        }
      },
      animation: false,
      tooltip: {
        trigger: 'item',
        formatter: '{b} - {d}%',
        extraCssText:'background:#757373;color:white;font-size:8px'
      },
      series: [
        {
            type: 'pie',
            center: ['80%', '50%'],
            radius: ['50%', '80%'],
            avoidLabelOverlap: false,
            label: {
              show: true,
              position: 'center',
              formatter: function () {
                if(showChartLabel){
                  return excluAmend_avg_rate
                } else {
                  return ''
                }
              },
              emphasis: '',
              rich: {
                p: {
                  color: '#848484',
                  fontSize: 20,
                  backgroundColor: "white"
                },
                good: {
                  color: '#00A947',
                  fontSize: 12,
                  fontWeight:'bold',
                  backgroundColor: "white"
                },
                fair: {
                  color: '#0084A9',
                  fontSize: 12,
                  fontWeight:'bold',
                  backgroundColor: "white"
                },
                poor: {
                  color: '#c33232',
                  fontSize: 12,
                  fontWeight:'bold',
                  backgroundColor: "white"
                }
              }
            },
            emphasis: {
                label: {
                    show: true,
                    fontSize: '12',
                    fontWeight: 'bold'
                }
            },
            labelLine: {
                show: true
            },
            color: excluImpactColors,
            data: excluProtocolRateData
        }
      ]
    };
  
    const excluScreenFailureOption = {
      title : {
        text: 'Screen Failure Rate',
        subtext: exclu_Therapeutic_Screen_Avg,
        x:'left',
        y:'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#333'
        },
        subtextStyle: {
            fontSize: 14,
            fontWeight: 'normal',
            color: '#999'
        }
      },
      animation: false,
      tooltip: {
        trigger: 'item',
        formatter: '{b} - {d}%',
        extraCssText:'background:#757373;color:white;font-size:8px'
      },
      series: [
        {
          type: 'pie',
          center: ['80%', '50%'],
          radius: ['50%', '80%'],
          avoidLabelOverlap: false,
          label: {
            show: true,
            position: 'center',
            formatter: function () {
              if(showChartLabel){
                return excluScreen_avg_rate
              } else {
                return ''
              }
            },
            emphasis: '',
            rich: {
              p: {
                color: '#848484',
                fontSize: 20,
                backgroundColor: "white"
              },
              good: {
                color: '#00A947',
                fontSize: 12,
                fontWeight:'bold',
                backgroundColor: "white"
              },
              fair: {
                color: '#0084A9',
                fontSize: 12,
                fontWeight:'bold',
                backgroundColor: "white"
              },
              poor: {
                color: '#c33232',
                fontSize: 12,
                fontWeight:'bold',
                backgroundColor: "white"
              }
            }
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '12',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: true
          },
          color: excluImpactColors,
          data: excluScreenRateData
        }
      ]
    };

    // Enrollment Feasibility chart data
    const raceOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{b} - {c} - {d}%'
      },
      // legend: {
      //   x: '40%',
      //   y: '10%',
      //   orient: 'vertical',
      //   itemHeight: 7,
      //   itemWidth: 7,
      //   textStyle: {
      //     fontSize: 9
      //   },
      //   formatter: function(name) {
      //     let data = raceOption.series[0].data;
      //     let total = 0
      //     for(const d in data){
      //       total += data[d].value
      //     }
      //     let p = 0
      //     for (let i = 0, l = data.length; i < l; i++) {
      //         if (data[i].name == name) {
      //           if(data[i].value >0){
      //             const p = (data[i].value/total * 100).toFixed(2)
      //             return name + ' - ' + p + '%';
      //           }else{
      //             return name + ' - 0'
      //           }
      //         }
      //     }
      //   }
      // },
      series: [
        {
          name: 'Race & Ethnicity',
          type: 'pie',
          center: ['20%', '45%'],
          radius: ['30%', '70%'],
          avoidLabelOverlap: false,
          label: {
            show: false
          },
          color: ethLegendColor,
          data: finalEthnicityData
        }
      ]
    };

    const eliPatientOption = {
      title : {
  //       text: eliPatientChartTitle,
  //       x:'40%',
  //       y:'top',
  //       textStyle: {
  //         fontSize: 18,
  //         fontWeight: 'bold',
  //         color: '#333'
  //       },
        show: false
        // show: (!showLegend)
      },
      // legend: {
      //   show: showLegend
      // },
      grid: {
          left: '3%',
          right: '4%',
          top: 0,
          bottom: 0,
          containLabel: true
      },
      xAxis: {
          type: 'value',
          axisLabel: {
              show: false
          },
          splitLine:{
              show:false
          },
          axisLine: {
            show: false
          },
          axisTick: {
              show: false
          },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          // Use axis to trigger tooltip
          type: 'shadow' // 'shadow' as default; can also be 'line' or 'shadow'
        },
        formatter: function(params){
          // eligible patient chart won't show percentage value
          if(params.length == 2){
            return params[0].axisValue + ': ' + params[0].value
          }
          let total = 0
          for(let id=0; id<params.length; id ++){
            if(params[id].seriesName != 'Total'){
              total += params[id].value
            }
          }
          let html=`
            <div>
            <div>${params[0].axisValue}</div>
            <table>${params.map((item)=>
              item.seriesName != 'Total'?`
              <tr>
                <td>
                  <span style="display:inline-block; width:10px;
                    height:10px;background-color:${item.color};"></span>
                    ${item.seriesName}:
                </td>
                <td><span style="margin-left:10px;">${item.value}</span></td>
                <td>
                  <span style="margin-left:10px;">
                    ${item.value > 0? ((item.value / total) * 100).toFixed(2) + '%':0}
                </span></td>
              </tr>`:'').join("")}
            </table>
            <div>Total: ${total}</div>
            </div>`
          return html
        }
      },
      yAxis: {
          type: 'category',
          axisLabel: {
            // show: false,
            formatter: (value: any) => {
              return value.length > 15 && value.indexOf(":") > 15? `{a|${value.slice(0, 15)}... ${value.slice(value.indexOf(":"))}}` : `{a|${value}}`
            },
            rich: {
              a: {
              },
            }
          },
          axisLine: {
              show: false
          },
          axisTick: {
              show: false
          },
          data: enrollCriteriaLib
      },
      series: eliPatientResultData,
      backgroundColor: "#fff"
    };

  //   const eliPatientOptionBelow = {
  //     title : {
  // //       text: eliPatientChartTitle,
  // //       x:'40%',
  // //       y:'top',
  // //       textStyle: {
  // //         fontSize: 18,
  // //         fontWeight: 'bold',
  // //         color: '#333'
  // //       },
  //       show: false
  //       // show: (!showLegend)
  //     },
  //     // legend: {
  //     //   show: showLegend
  //     // },
  //     grid: {
  //         left: '3%',
  //         right: '4%',
  //         top: '8%',
  //         bottom: '3%',
  //         containLabel: true
  //     },
  //     xAxis: {
  //         type: 'value',
  //         axisLabel: {
  //             show: false
  //         },
  //         splitLine:{
  //             show:false
  //         },
  //         axisLine: {
  //           show: false
  //         },
  //         axisTick: {
  //             show: false
  //         },
  //     },
  //     tooltip: {
  //       trigger: 'axis',
  //       axisPointer: {
  //         // Use axis to trigger tooltip
  //         type: 'shadow' // 'shadow' as default; can also be 'line' or 'shadow'
  //       },
  //       formatter: function(params){
  //         // eligible patient chart won't show percentage value
  //         if(params.length == 2){
  //           return params[0].axisValue + ': ' + params[0].value
  //         }
  //         let total = 0
  //         for(let id=0; id<params.length; id ++){
  //           if(params[id].seriesName != 'Total'){
  //             total += params[id].value
  //           }
  //         }
  //         let html=`
  //           <div>
  //           <div>${params[0].axisValue}</div>
  //           <table>${params.map((item)=>
  //             item.seriesName != 'Total'?`
  //             <tr>
  //               <td>
  //                 <span style="display:inline-block; width:10px;
  //                   height:10px;background-color:${item.color};"></span>
  //                   ${item.seriesName}:
  //               </td>
  //               <td><span style="margin-left:10px;">${item.value}</span></td>
  //               <td>
  //                 <span style="margin-left:10px;">
  //                   ${item.value > 0? ((item.value / total) * 100).toFixed(2) + '%':0}
  //               </span></td>
  //             </tr>`:'').join("")}
  //           </table>
  //           <div>Total: ${total}</div>
  //           </div>`
  //         return html
  //       }
  //     },
  //     yAxis: {
  //         type: 'category',
  //         axisLabel: {
  //           // show: false,
  //           formatter: (value: any) => {
  //             return value.length > 15 && value.indexOf(":") > 15? `{a|${value.slice(0, 15)}... ${value.slice(value.indexOf(":"))}}` : `{a|${value}}`
  //           },
  //           rich: {
  //             a: {
  //             },
  //           }
  //         },
  //         axisLine: {
  //             show: false
  //         },
  //         axisTick: {
  //             show: false
  //         },
  //         data: enrollCriteriaLibBelow
  //     },
  //     series: eliPatientResultData
  //   };

    const fePatientOption = {
      title : {
        text: fePatientChartTitle,
        x:'40%',
        y:'top',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#333'
        },
        show: false
        // show: (!showLegend)
      },
      // legend: {
      //   show: showLegend
      // },
      grid: {
          left: '3%',
          right: '4%',
          top: 0,
          bottom: 0,
          containLabel: true
      },
      xAxis: {
          type: 'value',
          axisLabel: {
              show: false
          },
          splitLine:{
              show:false
          },
          axisLine: {
            show: false
          },
          axisTick: {
              show: false
          },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          // Use axis to trigger tooltip
          type: 'shadow' // 'shadow' as default; can also be 'line' or 'shadow'
        },
        formatter: function(params){
          // eligible patient chart won't show percentage value
          if(params.length == 2){
            return params[0].axisValue + ': ' + params[0].value
          }
          let total = 0
          for(let id=0; id<params.length; id ++){
            if(params[id].seriesName != 'Total'){
              total += params[id].value
            }
          }
          let html=`
            <div>
            <div>${params[0].axisValue}</div>
            <table>${params.map((item)=>
              item.seriesName != 'Total'?`
              <tr>
                <td>
                  <span style="display:inline-block; width:10px;
                    height:10px;background-color:${item.color};"></span>
                    ${item.seriesName}:
                </td>
                <td><span style="margin-left:10px;">${item.value}</span></td>
                <td>
                  <span style="margin-left:10px;">
                    ${item.value > 0? ((item.value / total) * 100).toFixed(2) + '%':0}
                </span></td>
              </tr>`:'').join("")}
            </table>
            <div>Total: ${total}</div>
            </div>`
          return html
        }
      },
      yAxis: {
          type: 'category',
          axisLabel: {
            formatter: (value: any) => {
              return value.length > 15 && value.indexOf(":") > 15? value.slice(0, 15) + '...'+ value.slice(value.indexOf(":")) : value
            }
          },
          axisLine: {
              show: false
          },
          axisTick: {
              show: false
          },
          data: enrollCriteriaLib
      },
      series: fePatientResultData,
      backgroundColor: "#fff"
    };

  //   const fePatientOptionBelow = {
  //     title : {
  //       text: fePatientChartTitle,
  //       x:'40%',
  //       y:'top',
  //       textStyle: {
  //         fontSize: 18,
  //         fontWeight: 'bold',
  //         color: '#333'
  //       },
  //       show: false
  //       // show: (!showLegend)
  //     },
  //     // legend: {
  //     //   show: showLegend
  //     // },
  //     grid: {
  //         left: '3%',
  //         right: '4%',
  //         top: '8%',
  //         bottom: '3%',
  //         containLabel: true
  //     },
  //     xAxis: {
  //         type: 'value',
  //         axisLabel: {
  //             show: false
  //         },
  //         splitLine:{
  //             show:false
  //         },
  //         axisLine: {
  //           show: false
  //         },
  //         axisTick: {
  //             show: false
  //         },
  //     },
  //     tooltip: {
  //       trigger: 'axis',
  //       axisPointer: {
  //         // Use axis to trigger tooltip
  //         type: 'shadow' // 'shadow' as default; can also be 'line' or 'shadow'
  //       },
  //       formatter: function(params){
  //         // eligible patient chart won't show percentage value
  //         if(params.length == 2){
  //           return params[0].axisValue + ': ' + params[0].value
  //         }
  //         let total = 0
  //         for(let id=0; id<params.length; id ++){
  //           if(params[id].seriesName != 'Total'){
  //             total += params[id].value
  //           }
  //         }
  //         let html=`
  //           <div>
  //           <div>${params[0].axisValue}</div>
  //           <table>${params.map((item)=>
  //             item.seriesName != 'Total'?`
  //             <tr>
  //               <td>
  //                 <span style="display:inline-block; width:10px;
  //                   height:10px;background-color:${item.color};"></span>
  //                   ${item.seriesName}:
  //               </td>
  //               <td><span style="margin-left:10px;">${item.value}</span></td>
  //               <td>
  //                 <span style="margin-left:10px;">
  //                   ${item.value > 0? ((item.value / total) * 100).toFixed(2) + '%':0}
  //               </span></td>
  //             </tr>`:'').join("")}
  //           </table>
  //           <div>Total: ${total}</div>
  //           </div>`
  //         return html
  //       }
  //     },
  //     yAxis: {
  //         type: 'category',
  //         axisLabel: {
  //           formatter: (value: any) => {
  //             return value.length > 15 && value.indexOf(":") > 15? value.slice(0, 15) + '...'+ value.slice(value.indexOf(":")) : value
  //           }
  //         },
  //         axisLine: {
  //             show: false
  //         },
  //         axisTick: {
  //             show: false
  //         },
  //         data: enrollCriteriaLibBelow
  //     },
  //     series: fePatientResultData
  //   };

    const ethPatientOption = {
      title : {
        text: ethPatientChartTitle,
        x:'40%',
        y:'1%',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#333'
        },
        show: false
        // show: (!showLegend)
      },
      // legend: {
      //   show: showLegend
      // },
      grid: {
          left: '3%',
          right: '4%',
          top: 0,
          bottom: 0,
          containLabel: true
      },
      xAxis: {
          type: 'value',
          axisLabel: {
              show: false
          },
          splitLine:{
              show:false
          },
          axisLine: {
            show: false
          },
          axisTick: {
              show: false
          },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          // Use axis to trigger tooltip
          type: 'shadow' // 'shadow' as default; can also be 'line' or 'shadow'
        },
        formatter: function(params){
          // eligible patient chart won't show percentage value
          // if(params.length == 2){
          //   return params[0].axisValue + ': ' + params[0].value
          // }
          let total = 0
          for(let id=0; id<params.length; id ++){
            if(params[id].seriesName != 'Total'){
              total += params[id].value
            }
          }
          let html=`
            <div>
            <div>${params[0].axisValue}</div>
            <table>${params.map((item)=>
              item.seriesName != 'Total'?`
              <tr>
                <td>
                  <span style="display:inline-block; width:10px;
                    height:10px;background-color:${item.color};"></span>
                    ${item.seriesName}:
                </td>
                <td><span style="margin-left:10px;">${item.value}</span></td>
                <td>
                  <span style="margin-left:10px;">
                    ${item.value > 0? ((item.value / total) * 100).toFixed(2) + '%':0}
                </span></td>
              </tr>`:'').join("")}
            </table>
            <div>Total: ${total}</div>
            </div>`
          return html
        }
      },
      yAxis: {
          type: 'category',
          axisLabel: {
            formatter: (value: any) => {
              return value.length > 15 && value.indexOf(":") > 15? value.slice(0, 15) + '...'+ value.slice(value.indexOf(":")) : value
            }
          },
          axisLine: {
              show: false
          },
          axisTick: {
              show: false
          },
          data: enrollCriteriaLib
      },
      series: ethPatientResultData,
      backgroundColor: "#fff"
    };

  //   const ethPatientOptionBelow = {
  //     title : {
  //       text: ethPatientChartTitle,
  //       x:'40%',
  //       y:'1%',
  //       textStyle: {
  //         fontSize: 18,
  //         fontWeight: 'bold',
  //         color: '#333'
  //       },
  //       show: false
  //       // show: (!showLegend)
  //     },
  //     // legend: {
  //     //   show: showLegend
  //     // },
  //     grid: {
  //         left: '3%',
  //         right: '4%',
  //         top: '8%',
  //         bottom: '3%',
  //         containLabel: true
  //     },
  //     xAxis: {
  //         type: 'value',
  //         axisLabel: {
  //             show: false
  //         },
  //         splitLine:{
  //             show:false
  //         },
  //         axisLine: {
  //           show: false
  //         },
  //         axisTick: {
  //             show: false
  //         },
  //     },
  //     tooltip: {
  //       trigger: 'axis',
  //       axisPointer: {
  //         // Use axis to trigger tooltip
  //         type: 'shadow' // 'shadow' as default; can also be 'line' or 'shadow'
  //       },
  //       formatter: function(params){
  //         // eligible patient chart won't show percentage value
  //         // if(params.length == 2){
  //         //   return params[0].axisValue + ': ' + params[0].value
  //         // }
  //         let total = 0
  //         for(let id=0; id<params.length; id ++){
  //           if(params[id].seriesName != 'Total'){
  //             total += params[id].value
  //           }
  //         }
  //         let html=`
  //           <div>
  //           <div>${params[0].axisValue}</div>
  //           <table>${params.map((item)=>
  //             item.seriesName != 'Total'?`
  //             <tr>
  //               <td>
  //                 <span style="display:inline-block; width:10px;
  //                   height:10px;background-color:${item.color};"></span>
  //                   ${item.seriesName}:
  //               </td>
  //               <td><span style="margin-left:10px;">${item.value}</span></td>
  //               <td>
  //                 <span style="margin-left:10px;">
  //                   ${item.value > 0? ((item.value / total) * 100).toFixed(2) + '%':0}
  //               </span></td>
  //             </tr>`:'').join("")}
  //           </table>
  //           <div>Total: ${total}</div>
  //           </div>`
  //         return html
  //       }
  //     },
  //     yAxis: {
  //         type: 'category',
  //         axisLabel: {
  //           formatter: (value: any) => {
  //             return value.length > 15 && value.indexOf(":") > 15? value.slice(0, 15) + '...'+ value.slice(value.indexOf(":")) : value
  //           }
  //         },
  //         axisLine: {
  //             show: false
  //         },
  //         axisTick: {
  //             show: false
  //         },
  //         data: enrollCriteriaLibBelow
  //     },
  //     series: ethPatientResultData
  //   };

    const sleep = (time: number) => {
      return new Promise((resolve) => setTimeout(resolve, time));
    };

    const getPatientFunnel = async () => {
      if (!initPTData && !reloadPTData){
        return
      }
      
      setLoadPatientFunnel(true)
      let doReSearch = false
      let response
      if(initPTData && !reloadPTData){
        response = await checkTrialPatientFunnelData(props.location.state.trial_id+scenarioId)
        if(!response){
          doReSearch = true
        }
      }else {
        doReSearch = true
      }
      if(doReSearch){
        let requestBody = {
          'trialId': props.location.state.trial_id+scenarioId,
          'requestBody':{
            'inclusion': {
              'demographicsElements': demographicsElements,
              'medConditionElements': medConditionElements,
              'interventionElements': interventionElements,
              'labTestElements': labTestElements
            },
            'exclusion': {
              'demographicsElements': excluDemographicsElements,
              'medConditionElements': excluMedConditionElements,
              'interventionElements': excluInterventionElements,
              'labTestElements': excluLabTestElements
            }
          }
        }
        getPatientFunnelData(requestBody)
      }
      let tryTimes = 0
      while(!response && tryTimes <= 20){
        if(doReSearch){
          await sleep(5000);
        }
        tryTimes += 1
        response = await checkTrialPatientFunnelData(props.location.state.trial_id+scenarioId)
      }
      if (!response && tryTimes > 20){
        message.error('No response for searching patient funnel over 100 seconds, please call assist.')
        return
      }
      if (response.statusCode === 200) {
        const resp = JSON.parse(response.body)
        console.log("getPatientFunnelData:",JSON.parse(response.body));

        // set data for tab info
        setEliPatient(resp['eli_patient'])
        setRateEliPatient(resp['rate_eli_patient'])

        setRateFeEliPatient(resp['rate_fe_eli_patient'])

        const tempColor = []
        for(const e in resp['ethnicity_legend']){
          tempColor.push(colorList[resp['ethnicity_legend'][e].name])
        }
        setEthLegendColor(tempColor)
        const templegend = []
        for (const val of resp['ethnicity_legend']) {
          templegend.push(Object.assign(val, {"selected":false}))
        }
        setFinalEthnicityData(templegend)
        
        // Set criteria lib data as yAxis -- Common
        setEnrollCriteriaLib(resp['criteria'])
        // setEnrollCriteriaLib(resp['criteria'].slice(0,resp['in_item_len']))
        // setEnrollCriteriaLibBelow(resp['criteria'].slice(resp['in_item_len']))
        setFunnelChartheight(40 * resp['criteria'].length)
        setFunnelChartheightOverlap((40 * resp['criteria'].length)/resp['criteria'].length *(resp['in_item_len']))
        // setFunnelChartheightBelow(40 * (resp['criteria'].length-resp['in_item_len']))
        let totalData = {
          name: 'Total',
          type: 'bar',
          stack: 'Total',
          barGap: '-100%',
          label: {
              normal: {
                  show: true,
                  position: 'right',
                  textStyle: { color: '#000' },
                  formatter: function(v) {
                      return v.value
                  }
              }
          },
          itemStyle: { 
              normal: { 
                  color: 'rgba(128, 128, 128, 0)',
                  borderWidth: 1,
              } 
          },
          data: resp['count']
        }

        // Set data for chart Eligible Patient
        setEliPatientChartTitle('Patients Eligible - ' + resp['eli_patient'] + '(' + resp['rate_eli_patient'] + ' of Dataset)')
        const tempEliPatientSeriesData = []
        tempEliPatientSeriesData.push({
          name: 'Eligible Patient',
          type: 'bar',
          stack: 'total',
          // barWidth:'24px',
          color: '#E84F22',
          label: {
              show: false,
              // formatter: function(p) {
              //     return p.data
              // },
              // position: 'insideRight'
          },
          data: resp['count'],
          areaStyle:{
            color:'#fff',
            opacity: 1
         }
        })
        tempEliPatientSeriesData.push(totalData)
        setEliPatientResultData(tempEliPatientSeriesData)
        
        // Set data for chart Femaile patients eligible
        setFePatientChartTitle('Female patients eligible - ' + resp['rate_fe_eli_patient'])
        const feEliPatient = resp['count_females']
        let mEliPatient = feEliPatient.map((item, id) =>{
          return resp['count'][id] - item
        })
        const tempFeEliPatientSeriesData = []
        tempFeEliPatientSeriesData.push({
            name: 'Female',
            type: 'bar',
            stack: 'total',
            color: '#EF7A57',
            label: {show: false},
            emphasis: {focus: 'series'},
            data: feEliPatient
        })
        tempFeEliPatientSeriesData.push({
            name: 'Male',
            type: 'bar',
            stack: 'total',
            color: '#E84F22',
            label: {show: false},
            emphasis: {focus: 'series'},
            data: mEliPatient
        })
        tempFeEliPatientSeriesData.push(totalData)
        setFePatientResultData(tempFeEliPatientSeriesData)

        // Set data for chart Race & Ethnicities
        let defaultEnthRate = ''
        let defaultEth = ''
        if(resp['final_ethnicity'].length > 0){
          defaultEnthRate = ((resp['final_ethnicity_count'][0] / resp['eli_patient']) * 100).toFixed(2)
          defaultEth = resp['final_ethnicity'][0]
          setEthPatientChartTitle('Race & Ethnicity - ' + defaultEth + ' - ' + defaultEnthRate + '%')
        } else {
          // setEthPatientChartTitle('Race & Ethnicity - ' + resp['final_ethnicity'][0] +  ' - 0')
          resp['ethnicity_legend']&& resp['ethnicity_legend'][0]&&setEthPatientChartTitle('Race & Ethnicity - ' + resp['ethnicity_legend'][0].name +  ' - ' + resp['ethnicity_legend'][0].percent + '%')
        }
        
        const tempEthPatientSeriesData = []
        for(const ckey in resp){
          if (ckey.startsWith('percent_') && ckey != 'percent_females'){
            const cnKey = ckey.replace('percent_', '')
            tempEthPatientSeriesData.push({
              name: cnKey,
              type: 'bar',
              stack: 'total',
              color: colorList[cnKey],
              label: {show: false},
              emphasis: {focus: 'series'},
              data: resp[cnKey]
            })
          }
        }
        tempEthPatientSeriesData.push(totalData)
        setEthPatientResultData(tempEthPatientSeriesData)
        setActiveEnrollmentTabKey('1')
          
      }
      setLoadPatientFunnel(false)
      setReloadPTData(false)
      setInitPTData(false)
    }
    
    const handleCancel = () => {
      setShowHistorical(false)
      setVisibleSOA(false)
    }

    const showSOAModal = async () => {
      setVisibleSOA(true)
      searchHistoricalTrials()
    }

    const searchHistoricalTrials = async () => {
      setShowHistorical(true)
      if(historicalTrialdata.length == 0){
        setSpinning(true)
        const resp = await getSimilarhistoricalTrialById(similarHistoricalTrials);
        if (resp.statusCode == 200) {
          setSpinning(false)

          const filteredData =  JSON.parse(resp.body).filter((d) => {
            const date = d['start_date'].split('-')[0]
            return (
              date >= simliarTrialStudyStartDate.dateFrom && date<= simliarTrialStudyStartDate.dateTo
            );
          });
          setHistoricalTrialdata(filteredData)
        }
      }
    }

    const handleExport = (fileType) => {
      switch(fileType){
        case 'csv':
          csvExport();
          break;
        case 'pdf':
          pdfMake()
          break;
        default: break;
      }
    }

    const handleSOAExportClick = () => {
      let exportContent = "\uFEFF";
      let blob = new Blob([exportContent + str], {
        type: "text/plain;charset=utf-8"
      });
  
      const date = Date().split(" ");
      const dateStr = date[1] + '_' + date[2] + '_' + date[3] + '_' + date[4];
      FileSaver.saveAs(blob, `SoA_${dateStr}.csv`);

    }
    const handleSOAExport = (str) => {
      setStr(str) 
    }

    const csvExport = async () => {
      let str='';

      //Get Inclusion Criteria Data
      str += 'Inclusion Criteria';
      str += '\n' + 'Category' + ',' + 'S/No.' + ',' + 'Eligibility Criteria' + ',' + 'Values' + ',' 
          + 'Timeframe' + ',' + 'Condition Or Exception';
      var serialNum = 0
      str += getCSVContent('Demographics', demographicsElements, serialNum)
      serialNum += demographicsElements.length
      str += getCSVContent('Medical Condition', medConditionElements, serialNum)
      serialNum += medConditionElements.length
      str += getCSVContent('Intervention', interventionElements, serialNum)
      serialNum += interventionElements.length
      str += getCSVContent('Lab / Test', labTestElements, serialNum)

      //Get Exclusion Criteria Data
      str += '\n\n\n' + 'Exclusion Criteria';
      str += '\n' + 'Category' + ',' + 'S/No.' + ',' + 'Eligibility Criteria' + ',' + 'Values' + ',' 
          + 'Timeframe' + ',' + 'Condition Or Exception';
      serialNum = 0
      str += getCSVContent('Demographics', excluDemographicsElements, serialNum)
      serialNum += excluDemographicsElements.length
      str += getCSVContent('Medical Condition', excluMedConditionElements, serialNum)
      serialNum += excluMedConditionElements.length
      str += getCSVContent('Intervention', excluInterventionElements, serialNum)
      serialNum += excluInterventionElements.length
      str += getCSVContent('Lab / Test', excluLabTestElements, serialNum)
  
      let exportContent = "\uFEFF";
      let blob = new Blob([exportContent + str], {
        type: "text/plain;charset=utf-8"
      });
  
      const date = Date().split(" ");
      const dateStr = date[1] + '_' + date[2] + '_' + date[3] + '_' + date[4];
      FileSaver.saveAs(blob, `Inclusion_Exclusion_Criteria_${dateStr}.csv`);
    };
  
    function getCSVContent(category, elements, serialNum){
      let str='';
      for(const a in elements) {
        serialNum = serialNum + 1
        str += '\n'+ category + ',' + serialNum + ',' + elements[a]['Eligibility Criteria'] + ',' 
          + elements[a].Values + ',' + elements[a].Timeframe + ',' 
          + (elements[a]['Condition Or Exception'] == undefined ? '': elements[a]['Condition Or Exception'])
        if(elements[a].Children != undefined && elements[a].Children.length > 0){
          const subCriteria = elements[a].Children
          var subSerialNum;
          for(const aa in subCriteria){
            subSerialNum = serialNum + subCriteria[aa].Key.charAt((subCriteria[aa].Key.length-1))
            str += '\n' + category + ',' + subSerialNum + ',' + subCriteria[aa]['Eligibility Criteria'] 
            + ',' + subCriteria[aa].Values + ',' + subCriteria[aa].Timeframe
          }
        }
      }
    
      return str;
    }

    // it seems like handleExport
    const handleEndpointExport = (fileType) => {
      console.log("handleEndpointExport");
      
      switch(fileType){
        case 'csv':
          // csvExport();
          break;
        case 'pdf':
          // pdfMake()
          break;
        default: break;
      }
    }

    const updateInclusionCriteria = (newData, index) => {
      setReloadPTData(true)
      switch(index){
        case 2: 
          setDemographicsElements(newData)
          break;
        case 3:      
          setMedConditionElements(newData)      
          break;
        case 4:
          setInterventionElements(newData)
          break;
        default:
          setLabTestElements(newData)         
      }
    }

    const updateExclusionCriteria = (newData, index) => {
      setReloadPTData(true)
      switch(index){
        case 2: 
         
          setExcluDemographicsElements(newData)
          break;
        case 3:
         
          setExcluMedConditionElements(newData)
          break;
        case 4:
         
          setExcluDemographicsElements(newData)
          break;
        default:
          
          setExcluLabTestElements(newData)
      }
    }

    function keepUpdatedTrialInfo () {
      //Keep criteria before goes to schedule of Events
      let newScenario = trialRecord.scenarios.find( i=> i['scenario_id'] == scenarioId)

        var newInclusion = {
          "Demographics": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": demographicsElements
          },
          "Medical Condition": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": medConditionElements
          },
          "Intervention": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": interventionElements
          },
          "Lab / Test": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": labTestElements
          }
        }

        var newExclusion = {
          "Demographics": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": excluDemographicsElements
          },
          "Medical Condition": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": excluMedConditionElements
          },
          "Intervention": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": excluInterventionElements
          },
          "Lab / Test": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": excluLabTestElements
          }
        }

      if(newScenario["Inclusion Criteria"].Demographics === undefined){
        newScenario["Inclusion Criteria"] = newInclusion
        newScenario["Exclusion Criteria"] = newExclusion
      } else {
        newScenario["Inclusion Criteria"].Demographics.Entities = demographicsElements
        newScenario["Inclusion Criteria"]['Medical Condition'].Entities = medConditionElements
        newScenario["Inclusion Criteria"].Intervention.Entities = interventionElements
        newScenario["Inclusion Criteria"]['Lab / Test'].Entities = labTestElements

        newScenario["Exclusion Criteria"].Demographics.Entities = excluDemographicsElements
        newScenario["Exclusion Criteria"]['Medical Condition'].Entities = excluMedConditionElements
        newScenario["Exclusion Criteria"].Intervention.Entities = excluInterventionElements
        newScenario["Exclusion Criteria"]['Lab / Test'].Entities = excluLabTestElements
      }

      const newScenarioList = trialRecord.scenarios.map((item, id) =>{
        if(item['scenario_id'] == scenarioId){
            return newScenario
        } else {
            return item
        }
      })

      let newTrial = trialRecord
      newTrial.scenarios = newScenarioList

      setTrialRecord(newTrial)
    }
    const saveCriteria = async () => {
      setPageLoading(true)
      let newScenario = trialRecord.scenarios.find( i=> i['scenario_id'] == scenarioId)

        var newInclusion = {
          "Demographics": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": demographicsElements
          },
          "Medical Condition": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": medConditionElements
          },
          "Intervention": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": interventionElements
          },
          "Lab / Test": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": labTestElements
          }
        }

        var newExclusion = {
          "Demographics": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": excluDemographicsElements
          },
          "Medical Condition": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": excluMedConditionElements
          },
          "Intervention": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": excluInterventionElements
          },
          "Lab / Test": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": excluLabTestElements
          }
        }
      if(newScenario["Inclusion Criteria"].Demographics === undefined){
        newScenario["Inclusion Criteria"] = newInclusion
        newScenario["Exclusion Criteria"] = newExclusion
      } else {
        newScenario["Inclusion Criteria"].Demographics.Entities = demographicsElements
        newScenario["Inclusion Criteria"]['Medical Condition'].Entities = medConditionElements
        newScenario["Inclusion Criteria"].Intervention.Entities = interventionElements
        newScenario["Inclusion Criteria"]['Lab / Test'].Entities = labTestElements

        newScenario["Exclusion Criteria"].Demographics.Entities = excluDemographicsElements
        newScenario["Exclusion Criteria"]['Medical Condition'].Entities = excluMedConditionElements
        newScenario["Exclusion Criteria"].Intervention.Entities = excluInterventionElements
        newScenario["Exclusion Criteria"]['Lab / Test'].Entities = excluLabTestElements
      }

      const newScenarioList = trialRecord.scenarios.map((item, id) =>{
        if(item['scenario_id'] == scenarioId){
          //If go back from SOA and SOA got edited, re-calculate SOA results for save changes
          if(item['Schedule of Events'].Finished != undefined && !item['Schedule of Events'].Finished){
            return reCalculateSOA(newScenario, item['Schedule of Events'])
          } else {
            return newScenario
          }
        } else {
            return item
        }
      })

      let newTrial = trialRecord
      newTrial.scenarios = newScenarioList

      setTrialRecord(newTrial)

      setImpactColors(activeChartColors)
      setExcluImpactColors(activeChartColors)
      //Update record
      const resp = await updateStudy(newTrial);
      setPageLoading(false)
      if (resp.statusCode == 200) {
        var currentScenario = resp.body.scenarios.find( i=> i['scenario_id'] == scenarioId)

        //Get inclusion chart info
        var inclu = currentScenario["Inclusion Criteria"]
        
        setProtocolRateData([
          {value: formatNumber(inclu['Lab / Test'].protocol_amendment_rate), name: 'Labs / Tests'},
          {value: formatNumber(inclu.Intervention.protocol_amendment_rate), name: 'Intervention'},
          {value: formatNumber(inclu.Demographics.protocol_amendment_rate), name: 'Demographics'},
          {value: formatNumber(inclu['Medical Condition'].protocol_amendment_rate), name: 'Medical Condition'}
        ])
        setScreenRateData([
          {value: formatNumber(inclu['Lab / Test'].screen_failure_rate), name: 'Labs / Tests'},
          {value: formatNumber(inclu.Intervention.screen_failure_rate), name: 'Intervention'},
          {value: formatNumber(inclu.Demographics.screen_failure_rate), name: 'Demographics'},
          {value: formatNumber(inclu['Medical Condition'].screen_failure_rate), name: 'Medical Condition'}
        ])
  
        var tempScoreA = ''
        var tempScoreB = ''

          var score = formatNumber(currentScenario.protocol_amendment_rate)
          if(score <= 33){
            tempScoreA = '{p|' + currentScenario.protocol_amendment_rate + '}\n{good|GOOD}'
          } else if(score > 33  && score <= 67){
            tempScoreA = '{p|' + currentScenario.protocol_amendment_rate + '}\n{fair|FAIR}'
          } else if(score > 67){
            tempScoreA = '{p|' + currentScenario.protocol_amendment_rate + '}\n{poor|POOR}'
          }

          var scoreB = formatNumber(currentScenario.screen_failure_rate)
          if(scoreB <= 33){
            tempScoreB = '{p|' + currentScenario.screen_failure_rate + '}\n{good|GOOD}'
          } else if(scoreB > 33  && scoreB <= 67){
            tempScoreB = '{p|' + currentScenario.screen_failure_rate + '}\n{fair|FAIR}'
          } else if(scoreB > 67){
            tempScoreB = '{p|' + currentScenario.screen_failure_rate + '}\n{poor|POOR}'
          }

          setAmend_avg_rate(tempScoreA)
          setScreen_avg_rate(tempScoreB)

        //Get exclusion chart info
        var exclu = currentScenario["Exclusion Criteria"]
        
        setExcluProtocolRateData([
          {value: formatNumber(exclu['Lab / Test'].protocol_amendment_rate), name: 'Labs / Tests'},
          {value: formatNumber(exclu.Intervention.protocol_amendment_rate), name: 'Intervention'},
          {value: formatNumber(exclu.Demographics.protocol_amendment_rate), name: 'Demographics'},
          {value: formatNumber(exclu['Medical Condition'].protocol_amendment_rate), name: 'Medical Condition'}
        ])
        setExcluScreenRateData([
          {value: formatNumber(exclu['Lab / Test'].screen_failure_rate), name: 'Labs / Tests'},
          {value: formatNumber(exclu.Intervention.screen_failure_rate), name: 'Intervention'},
          {value: formatNumber(exclu.Demographics.screen_failure_rate), name: 'Demographics'},
          {value: formatNumber(exclu['Medical Condition'].screen_failure_rate), name: 'Medical Condition'}
        ])
          setExcluAmend_avg_rate(tempScoreA)
          setExcluScreen_avg_rate(tempScoreB)
        if(currentScenario['Therapeutic Area Average']){
          setTherapeutic_Amend_Avg('Therapeutic Area Average - ' + currentScenario['Therapeutic Area Average'].protocol_amendment_rate)
          setTherapeutic_Screen_Avg('Therapeutic Area Average - ' + currentScenario['Therapeutic Area Average'].screen_failure_rate)
          setExcluTherapeutic_Amend_Avg('Therapeutic Area Average - ' + currentScenario['Therapeutic Area Average'].protocol_amendment_rate)
          setExcluTherapeutic_Screen_Avg('Therapeutic Area Average - ' + currentScenario['Therapeutic Area Average'].screen_failure_rate)
        }
  
        setShowChartLabel(true)
        message.success("Save successfully");
      }
    }

    const submitCriteria = async () => {
      setPageLoading(true)
      let newScenario = trialRecord.scenarios.find( i=> i['scenario_id'] == scenarioId)

        var newInclusion = {
          "Demographics": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": demographicsElements
          },
          "Medical Condition": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": medConditionElements
          },
          "Intervention": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": interventionElements
          },
          "Lab / Test": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": labTestElements
          }
        }

        var newExclusion = {
          "Demographics": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": excluDemographicsElements
          },
          "Medical Condition": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": excluMedConditionElements
          },
          "Intervention": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": excluInterventionElements
          },
          "Lab / Test": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": excluLabTestElements
          }
        }
      if(newScenario["Inclusion Criteria"].Demographics === undefined){
        newScenario["Inclusion Criteria"] = newInclusion
        newScenario["Exclusion Criteria"] = newExclusion
      } else {
        newScenario["Inclusion Criteria"].Demographics.Entities = demographicsElements
        newScenario["Inclusion Criteria"]['Medical Condition'].Entities = medConditionElements
        newScenario["Inclusion Criteria"].Intervention.Entities = interventionElements
        newScenario["Inclusion Criteria"]['Lab / Test'].Entities = labTestElements

        newScenario["Exclusion Criteria"].Demographics.Entities = excluDemographicsElements
        newScenario["Exclusion Criteria"]['Medical Condition'].Entities = excluMedConditionElements
        newScenario["Exclusion Criteria"].Intervention.Entities = excluInterventionElements
        newScenario["Exclusion Criteria"]['Lab / Test'].Entities = excluLabTestElements
      }

      const newScenarioList = trialRecord.scenarios.map((item, id) =>{
        if(item['scenario_id'] == scenarioId){
          //If go back from SOA and SOA got edited, re-calculate SOA results for save changes
          if(item['Schedule of Events'].Finished != undefined && !item['Schedule of Events'].Finished){
            return reCalculateSOA(newScenario, item['Schedule of Events'])
          } else {
            return newScenario
          }
        } else {
            return item
        }
      })

      let newTrial = trialRecord
      newTrial.scenarios = newScenarioList

      setTrialRecord(newTrial)

      setImpactColors(activeChartColors)
      setExcluImpactColors(activeChartColors)
      //Update record
      const resp = await updateStudy(newTrial);
      setPageLoading(false)
      if (resp.statusCode == 200) {
        var currentScenario = resp.body.scenarios.find( i=> i['scenario_id'] == scenarioId)

        //Get inclusion chart info
        var inclu = currentScenario["Inclusion Criteria"]
        
        setProtocolRateData([
          {value: formatNumber(inclu['Lab / Test'].protocol_amendment_rate), name: 'Labs / Tests'},
          {value: formatNumber(inclu.Intervention.protocol_amendment_rate), name: 'Intervention'},
          {value: formatNumber(inclu.Demographics.protocol_amendment_rate), name: 'Demographics'},
          {value: formatNumber(inclu['Medical Condition'].protocol_amendment_rate), name: 'Medical Condition'}
        ])
        setScreenRateData([
          {value: formatNumber(inclu['Lab / Test'].screen_failure_rate), name: 'Labs / Tests'},
          {value: formatNumber(inclu.Intervention.screen_failure_rate), name: 'Intervention'},
          {value: formatNumber(inclu.Demographics.screen_failure_rate), name: 'Demographics'},
          {value: formatNumber(inclu['Medical Condition'].screen_failure_rate), name: 'Medical Condition'}
        ])
  
        var tempScoreA = ''
        var tempScoreB = ''

          var score = formatNumber(currentScenario.protocol_amendment_rate)
          if(score <= 33){
            tempScoreA = '{p|' + currentScenario.protocol_amendment_rate + '}\n{good|GOOD}'
          } else if(score > 33  && score <= 67){
            tempScoreA = '{p|' + currentScenario.protocol_amendment_rate + '}\n{fair|FAIR}'
          } else if(score > 67){
            tempScoreA = '{p|' + currentScenario.protocol_amendment_rate + '}\n{poor|POOR}'
          }

          var scoreB = formatNumber(currentScenario.screen_failure_rate)
          if(scoreB <= 33){
            tempScoreB = '{p|' + currentScenario.screen_failure_rate + '}\n{good|GOOD}'
          } else if(scoreB > 33  && scoreB <= 67){
            tempScoreB = '{p|' + currentScenario.screen_failure_rate + '}\n{fair|FAIR}'
          } else if(scoreB > 67){
            tempScoreB = '{p|' + currentScenario.screen_failure_rate + '}\n{poor|POOR}'
          }

          setAmend_avg_rate(tempScoreA)
          setScreen_avg_rate(tempScoreB)

        //Get exclusion chart info
        var exclu = currentScenario["Exclusion Criteria"]
        
        setExcluProtocolRateData([
          {value: formatNumber(exclu['Lab / Test'].protocol_amendment_rate), name: 'Labs / Tests'},
          {value: formatNumber(exclu.Intervention.protocol_amendment_rate), name: 'Intervention'},
          {value: formatNumber(exclu.Demographics.protocol_amendment_rate), name: 'Demographics'},
          {value: formatNumber(exclu['Medical Condition'].protocol_amendment_rate), name: 'Medical Condition'}
        ])
        setExcluScreenRateData([
          {value: formatNumber(exclu['Lab / Test'].screen_failure_rate), name: 'Labs / Tests'},
          {value: formatNumber(exclu.Intervention.screen_failure_rate), name: 'Intervention'},
          {value: formatNumber(exclu.Demographics.screen_failure_rate), name: 'Demographics'},
          {value: formatNumber(exclu['Medical Condition'].screen_failure_rate), name: 'Medical Condition'}
        ])
          setExcluAmend_avg_rate(tempScoreA)
          setExcluScreen_avg_rate(tempScoreB)
        if(currentScenario['Therapeutic Area Average']){
          setTherapeutic_Amend_Avg('Therapeutic Area Average - ' + currentScenario['Therapeutic Area Average'].protocol_amendment_rate)
          setTherapeutic_Screen_Avg('Therapeutic Area Average - ' + currentScenario['Therapeutic Area Average'].screen_failure_rate)
          setExcluTherapeutic_Amend_Avg('Therapeutic Area Average - ' + currentScenario['Therapeutic Area Average'].protocol_amendment_rate)
          setExcluTherapeutic_Screen_Avg('Therapeutic Area Average - ' + currentScenario['Therapeutic Area Average'].screen_failure_rate)
        }
  
        setShowChartLabel(true)
        props.history.push({pathname: '/trials', state: {trial_id: props.location.state.trial_id}})
        message.success("Save successfully");
      }
    }

    // saveCriteria
    const saveEndpoint = () => {
      console.log("saveEndpoint")
    }
    // submitCriteria
    const submitEndpoint = () => {
      console.log("submitEndpoint")
    }

    function formatNumber (str){
      if(str == undefined || str == ''){
        return 0
      } else {
        return Number(str.substr(0, str.lastIndexOf('%')))
      }
    }

    const reCalculateSOA = (specificScenario, scheduleOfEvents) =>{
      let burdenMatrixList = []
      let tempBurdenXAxis = []
      for(var i =0; i< scheduleOfEvents.Visits; i ++){
        burdenMatrixList.push([0,0,0,0,0,0,0,0,0,0])
        tempBurdenXAxis.push((i+1)+'')
      }

      let labeTotalCost = 0
      for(const a in scheduleOfEvents[CATEGORY_LABS].entities) {
        labeTotalCost += Number(scheduleOfEvents[CATEGORY_LABS].entities[a]['Dummy Cost']) * scheduleOfEvents[CATEGORY_LABS].entities[a].totalVisit
        if(scheduleOfEvents[CATEGORY_LABS].entities[a].condition.length > 0){
          for(let b = 0; b < scheduleOfEvents[CATEGORY_LABS].entities[a].condition.length; b ++){
            if(scheduleOfEvents[CATEGORY_LABS].entities[a].condition[b].checked){
              let tempBurdenMatrix = []
              burdenMatrixList[b].map((item, idx) =>{
                tempBurdenMatrix.push(item + scheduleOfEvents[CATEGORY_LABS].entities[a].soaWeights[idx])
              })
              burdenMatrixList.splice(b, 1, tempBurdenMatrix)
            }
          }
        }
      }

      let examinationTotalCost = 0
      for(const a in scheduleOfEvents[CATEGORY_PHYSICAL_EXAMINATION].entities) {
        examinationTotalCost += Number(scheduleOfEvents[CATEGORY_PHYSICAL_EXAMINATION].entities[a]['Dummy Cost']) * scheduleOfEvents[CATEGORY_PHYSICAL_EXAMINATION].entities[a].totalVisit
        if(scheduleOfEvents[CATEGORY_PHYSICAL_EXAMINATION].entities[a].condition.length > 0){
          for(let b = 0; b < scheduleOfEvents[CATEGORY_PHYSICAL_EXAMINATION].entities[a].condition.length; b ++){
            if(scheduleOfEvents[CATEGORY_PHYSICAL_EXAMINATION].entities[a].condition[b].checked){
              let tempBurdenMatrix = []
              burdenMatrixList[b].map((item, idx) =>{
                tempBurdenMatrix.push(item + scheduleOfEvents[CATEGORY_PHYSICAL_EXAMINATION].entities[a].soaWeights[idx])
              })
              burdenMatrixList.splice(b, 1, tempBurdenMatrix)
            }
          }
        }
      }

      let proceduresTotalCost = 0
      for(const a in scheduleOfEvents[CATEGORY_PROCEDURES].entities) {
        proceduresTotalCost += Number(scheduleOfEvents[CATEGORY_PROCEDURES].entities[a]['Dummy Cost']) * scheduleOfEvents[CATEGORY_PROCEDURES].entities[a].totalVisit
        if(scheduleOfEvents[CATEGORY_PROCEDURES].entities[a].condition.length > 0){
          for(let b = 0; b < scheduleOfEvents[CATEGORY_PROCEDURES].entities[a].condition.length; b ++){
            if(scheduleOfEvents[CATEGORY_PROCEDURES].entities[a].condition[b].checked){
              let tempBurdenMatrix = []
              burdenMatrixList[b].map((item, idx) =>{
                tempBurdenMatrix.push(item + scheduleOfEvents[CATEGORY_PROCEDURES].entities[a].soaWeights[idx])
              })
              burdenMatrixList.splice(b, 1, tempBurdenMatrix)
            }
          }
        }
      }

      let questionairesTotalCost = 0
      for(const a in scheduleOfEvents[CATEGORY_QUESTIONNAIRES].entities) {
        questionairesTotalCost += Number(scheduleOfEvents[CATEGORY_QUESTIONNAIRES].entities[a]['Dummy Cost']) * scheduleOfEvents[CATEGORY_QUESTIONNAIRES].entities[a].totalVisit
        if(scheduleOfEvents[CATEGORY_QUESTIONNAIRES].entities[a].condition.length > 0){
          for(let b = 0; b < scheduleOfEvents[CATEGORY_QUESTIONNAIRES].entities[a].condition.length; b ++){
            if(scheduleOfEvents[CATEGORY_QUESTIONNAIRES].entities[a].condition[b].checked){
              let tempBurdenMatrix = []
              burdenMatrixList[b].map((item, idx) =>{
                tempBurdenMatrix.push(item + scheduleOfEvents[CATEGORY_QUESTIONNAIRES].entities[a].soaWeights[idx])
              })
              burdenMatrixList.splice(b, 1, tempBurdenMatrix)
            }
          }
        }
      }

      let studyTotalCost = 0
      for(const a in scheduleOfEvents[CATEGORY_STUDY_PROCEDURES].entities) {
        studyTotalCost += Number(scheduleOfEvents[CATEGORY_STUDY_PROCEDURES].entities[a]['Dummy Cost']) * scheduleOfEvents[CATEGORY_STUDY_PROCEDURES].entities[a].totalVisit
        if(scheduleOfEvents[CATEGORY_STUDY_PROCEDURES].entities[a].condition.length > 0){
          for(let b = 0; b < scheduleOfEvents[CATEGORY_STUDY_PROCEDURES].entities[a].condition.length; b ++){
            if(scheduleOfEvents[CATEGORY_STUDY_PROCEDURES].entities[a].condition[b].checked){
              let tempBurdenMatrix = []
              burdenMatrixList[b].map((item, idx) =>{
                tempBurdenMatrix.push(item + scheduleOfEvents[CATEGORY_STUDY_PROCEDURES].entities[a].soaWeights[idx])
              })
              burdenMatrixList.splice(b, 1, tempBurdenMatrix)
            }
          }
        }
      }

      let tempBurdenData = []
      let patient_burden = 0
      for(const m in burdenMatrixList){
        const visitMatrix = burdenMatrixList[m].map((max) => {
          return max > 0 ? 1 : 0
        })
        const excessMatrix = burdenMatrixList[m].map((max) => {
          return max - 1 >= 0 ? max - 1 : 0
        })

        let currentVisitScore = 0
        for(const c in visitMatrix){
          currentVisitScore += visitMatrix[c] * visitDimensionalScore[c].Value + excessMatrix[c]
        }
        tempBurdenData.push(currentVisitScore)
        patient_burden += currentVisitScore
      }

      let patient_burden_rate = 'GOOD'
      if (patient_burden > 0 && patient_burden <= 400) {
        patient_burden_rate = 'GOOD'
      } else if (patient_burden > 400 && patient_burden <= 600) {
        patient_burden_rate = 'FAIR'
      } else if (patient_burden > 600){
        patient_burden_rate = 'POOR'
      }

      let tempCostData = [
        {value: labeTotalCost, name: CATEGORY_LABS},
        {value: examinationTotalCost, name: CATEGORY_PHYSICAL_EXAMINATION},
        {value: proceduresTotalCost, name: CATEGORY_PROCEDURES},
        {value: questionairesTotalCost, name: CATEGORY_QUESTIONNAIRES},
        {value: studyTotalCost, name: CATEGORY_STUDY_PROCEDURES}
      ]

      let totalCost = labeTotalCost + examinationTotalCost + proceduresTotalCost + questionairesTotalCost + studyTotalCost

      let costBreakdown = ''
      if(totalCost < 12826){
        costBreakdown = 'GOOD'
      } else if(totalCost < 15650){
        costBreakdown = 'FAIR'
      } else {
        costBreakdown = 'POOR'
      }

      specificScenario['Schedule of Events'] = Object.assign(scheduleOfEvents,{
        'TotalCost': '' + formatCostAvg(totalCost, 1000),
        'CostRate': costBreakdown,
        'CostData': tempCostData,
        'BurdenData': tempBurdenData,
        'BurdenXAxis': tempBurdenXAxis,
        'Finished': true,
        'patient_burden': patient_burden,
        'patient_burden_rate': patient_burden_rate
      })
      return specificScenario
    }
    function roundFun(value, n) {
        return Math.round(value*Math.pow(10,n))/Math.pow(10,n);
    }
  
    function formatCostAvg(totalCost, divisor){
      if(totalCost === 0){
        return 0
      } else {
        let avg = Math.ceil(totalCost/divisor*1000)
        return roundFun(avg/1000, 2)
      }
    }

    const pdfMake = async () =>{
      const pdf = new jsPDF('p', 'pt');
      const tableColumn = ['Category', 'S/No.', 'Eligibility Criteria', 'Values', 'Timeframe','Condition Or Exception'];

      var serialNum = 0
      var tableRows = formatColumns('Demographics', demographicsElements, serialNum)
      serialNum += demographicsElements.length
      tableRows = tableRows.concat(formatColumns('Medical Condition', medConditionElements, serialNum))
      serialNum += medConditionElements.length
      tableRows = tableRows.concat(formatColumns('Intervention', interventionElements, serialNum))
      serialNum += interventionElements.length
      tableRows = tableRows.concat(formatColumns('Lab / Test', labTestElements, serialNum))

      serialNum = 0
      var serialNum = 0
      var excluTableRows = formatColumns('Demographics', excluDemographicsElements, serialNum)
      serialNum += excluDemographicsElements.length
      excluTableRows = excluTableRows.concat(formatColumns('Medical Condition', excluMedConditionElements, serialNum))
      serialNum += excluMedConditionElements.length
      excluTableRows = excluTableRows.concat(formatColumns('Intervention', excluInterventionElements, serialNum))
      serialNum += excluInterventionElements.length
      excluTableRows = excluTableRows.concat(formatColumns('Lab / Test', excluLabTestElements, serialNum))

      pdf.text("Inclusion Criteria", 14, 20);
      pdf['autoTable']({
        columns: tableColumn,
        body: tableRows
      });

      pdf.addPage()
      pdf.text("Exclusion Criteria", 14, 20);
      pdf['autoTable']({
        columns: tableColumn,
        body: excluTableRows
      });

      const date = Date().split(" ");
      const dateStr = date[1] + '_' + date[2] + '_' + date[3] + '_' + date[4];
      pdf.save(`Inclusion_Criteria_${dateStr}.pdf`);
    };

    function formatColumns(catogory, list, serialNo){
      var tempColumn = []
      for(const a in list) {
        serialNo ++
        const item = [catogory, serialNo, list[a]['Eligibility Criteria'], list[a]['Values'], list[a]['Timeframe'], 
                      list[a]['Condition Or Exception'] == undefined ? '': list[a]['Condition Or Exception']]
        tempColumn.push(item)
        if(list[a]['Children'] != undefined && list[a]['Children'].length > 0){
          const subCriteria = list[a]['Children']
          var subSerialNum;
          for(const aa in subCriteria){
            subSerialNum = serialNo + subCriteria[aa].Key.charAt((subCriteria[aa].Key.length-1))
            const subItem = [catogory, subSerialNum, subCriteria[aa]['Eligibility Criteria'], 
                              subCriteria[aa]['Values'], subCriteria[aa]['Timeframe'], '']
            tempColumn.push(subItem)
          }
        }
      }
      return tempColumn
    }
  
  useEffect(() => {
    updateTableData()
   
  }, [demographicsElements, medConditionElements, interventionElements, labTestElements])

  useEffect(() => {
    updateExcluTableData()
  }, [excluDemographicsElements, excluMedConditionElements, excluInterventionElements, excluLabTestElements])

  const updateTableData = () => {

    let demographicsTmp = demographicsElements.map((e,idx) => {
      e.Key = (idx + 1) + ''
      return e     
    })
    setDemographicsTableData(demographicsTmp)

    let medConditionTmp = medConditionElements.map((e,idx) => {
      e.Key = demographicsTmp.length + (idx + 1) + ''
        return e
    })    
    setMedConditionTableData(medConditionTmp)
  
    let interventionTmp =  interventionElements.map((e,idx) => {
      e.Key = demographicsTmp.length + medConditionTmp.length + (idx + 1) + ''
        return e
    })    
    setInterventionTableData(interventionTmp)

    let labTestTmp =  labTestElements.map((e,idx) => {
      e.Key = demographicsTmp.length + medConditionTmp.length + interventionTmp.length + (idx + 1) + ''
        return e
    })
    setLabTestTableData(labTestTmp)   
  }

  const updateExcluTableData = () => {

    let demographicsTmp = excluDemographicsElements.map((e,idx) => {
      e.Key = (idx + 1) + ''
      return e     
    })
    setExcluDemographicsTableData(demographicsTmp)

    let medConditionTmp = excluMedConditionElements.map((e,idx) => {
      e.Key = demographicsTmp.length + (idx + 1) + ''
        return e
    })    
    setExcluMedConditionTableData(medConditionTmp)
  
    let interventionTmp =  excluInterventionElements.map((e,idx) => {
      e.Key = demographicsTmp.length + medConditionTmp.length + (idx + 1) + ''
        return e
    })    
    setExcluInterventionTableData(interventionTmp)

    let labTestTmp =  excluLabTestElements.map((e,idx) => {
      e.Key = demographicsTmp.length + medConditionTmp.length + interventionTmp.length + (idx + 1) + ''
        return e
    })
    setExcluLabTestTableData(labTestTmp)   
  }

  const changeActiveTabKey = (activeKey) => {
    setActiveTabKey(activeKey)
    if(activeKey === '3'){
      keepUpdatedTrialInfo()
      getPatientFunnel()
    }
  }

  const onInclusionChartClick = (e) =>{
    if(e.name === 'Medical Condition'){
      setDefaultActiveKey(['3'])
    } else if(e.name === 'Labs / Tests'){
      setDefaultActiveKey(['5'])
    } else if(e.name === 'Intervention'){
      setDefaultActiveKey(['4'])
    } else if(e.name === 'Demographics'){
      setDefaultActiveKey(['2'])
    }
  }

  const onExclusionChartClick = (e) =>{
    if(e.name === 'Medical Condition'){
      setExcluDefaultActiveKey(['3'])
    } else if(e.name === 'Labs / Tests'){
      setExcluDefaultActiveKey(['5'])
    } else if(e.name === 'Intervention'){
      setExcluDefaultActiveKey(['4'])
    } else if(e.name === 'Demographics'){
      setExcluDefaultActiveKey(['2'])
    }
  }
  // Click the legend of pie chart to change the bar chart accordingly
  const onClickLegend = (value, percent) =>{
    let tempEthPatientSeriesData = []
    let tempName = ""
    let tempPercent = ""
    let tempFirstData =  []
    let tempOtherData =  []
    tempEthPatientSeriesData = JSON.parse(JSON.stringify(ethPatientResultData))
    for(const val of tempEthPatientSeriesData){      
      if (val.name === value){
        val.color = colorList["HIGHLIGHTED"]
        tempName = val.name
        tempPercent = percent
        tempFirstData.push(val)
      } else {
        val.color = colorList["NOT HIGHLIGHTED"]
        tempOtherData.push(val)
      }
    }
    // highlight the legend which is clicked
    for(const val of finalEthnicityData) {
      if(val.name === value) {
        val.selected = true
      } else {
        val.selected = false
      }
    }
    setFinalEthnicityData(finalEthnicityData)
    // remove the category to the beginning of bar chart 
    setEthPatientResultData([...tempFirstData,...tempOtherData])
    if (eChartsRef && eChartsRef.current) {      
      ethPatientOption.series[0].color = tempFirstData[0].color
      ethPatientOption.series[0].data = tempFirstData[0].data
      ethPatientOption.series[0].emphasis = tempFirstData[0].emphasis
      ethPatientOption.series[0].label = tempFirstData[0].label
      ethPatientOption.series[0].name = tempFirstData[0].name
      ethPatientOption.series[0].stack = tempFirstData[0].stack
      ethPatientOption.series[0].type = tempFirstData[0].type      
      eChartsRef.current?.getEchartsInstance().setOption(ethPatientOption);
    }
    if (eChartsBelowRef && eChartsBelowRef.current) {      
      ethPatientOption.series[0].color = tempFirstData[0].color
      ethPatientOption.series[0].data = tempFirstData[0].data
      ethPatientOption.series[0].emphasis = tempFirstData[0].emphasis
      ethPatientOption.series[0].label = tempFirstData[0].label
      ethPatientOption.series[0].name = tempFirstData[0].name
      ethPatientOption.series[0].stack = tempFirstData[0].stack
      ethPatientOption.series[0].type = tempFirstData[0].type      
      eChartsBelowRef.current?.getEchartsInstance().setOption(ethPatientOption);
    }
    // Change the title  of chart according to the legend clicked
    setEthPatientChartTitle('Race & Ethnicity - ' + tempName +  ' - ' + tempPercent + '%')
  }

  const handleGoBack = (scheduleOfEvents) =>{
    let newScenario = trialRecord.scenarios.find( i=> i['scenario_id'] == scenarioId)
    newScenario['Schedule of Events'] = scheduleOfEvents
    const newScenarioList = trialRecord.scenarios.map((item, id) =>{
      if(item['scenario_id'] == scenarioId){
          return newScenario
      } else {
          return item
      }
    })
    let newTrial = trialRecord
    newTrial.scenarios = newScenarioList
    setTrialRecord(newTrial)
    // setProcessStep(0)
    setSubmitType(0)
    message.success("Save successfully");
  }

  const downloadSOA = async () => {
    let tempResource = []
    if(soaResource.length == 0){
      setSpinning(true)
      const resp = await getSOAResource(similarHistoricalTrials);
      if (resp.statusCode == 200) {
        setSpinning(false)
        setSOAResource(JSON.parse(resp.body).soaItemList)
        tempResource = JSON.parse(resp.body).soaItemList
      }
    } else {
      tempResource = soaResource
    }

    //export
    let str = 'SOA';
    str += '\n' + 'NCT ID' + ',' + 'Category' + ',' + 'Raw Activity' + ',' + 'Standardized'
    for(const id in tempResource){
      str += '\n' + tempResource[id].nctID + ',"' + tempResource[id].category +  '","' + tempResource[id].raw + '","' 
        + tempResource[id].standardized + '"'
    }

    let exportContent = "\uFEFF";
    let blob = new Blob([exportContent + str], {
      type: "text/plain;charset=utf-8"
    });

    const date = Date().split(" ");
    const dateStr = date[1] + '_' + date[2] + '_' + date[3] + '_' + date[4];
    FileSaver.saveAs(blob, `SOA_Resource_${dateStr}.csv`);
  }

  const downloadIE = async () => {
    if(ieResource == ''){
      setSpinning(true)
      const resp = await getIEResource(similarHistoricalTrials, props.location.state.trial_id);
      if (resp.statusCode == 200) {
        var num = resp.body.lastIndexOf('/')+1
        let fileName = resp.body.substr(num)

        downloadFile(fileName)
      }
    } else {
      downloadFile(ieResource)
    }

    function downloadFile(fileName) {
      window.open('https://iso-data-zone.s3.us-east-2.amazonaws.com/iso-service-dev/summary/'+fileName, '_blank')
      setSpinning(false)
      setIEResource(fileName)
    }
  }

  const downloadAverage = async () => {
    var num = avgFileKey.lastIndexOf('/')+1
    let fileName = avgFileKey.substr(num)
    window.open('https://iso-data-zone.s3.us-east-2.amazonaws.com/iso-service-dev/summary/'+fileName, '_blank')
    // let tempInclusionResourceAvg = []
    // let tempExclusionResourceAvg = []
    // if(!avgResource){
    //   setSpinning(true)
    //   const resp = await getAverage(similarHistoricalTrials);
    //   if (resp.statusCode == 200) {
    //     setSpinning(false)
    //     setAvgResource(true)
    //     setInclusionResourceAvg(JSON.parse(resp.body).inResult)
    //     setExclusionResourceAvg(JSON.parse(resp.body).exResult)
    //     tempInclusionResourceAvg = JSON.parse(resp.body).inResult
    //     tempExclusionResourceAvg = JSON.parse(resp.body).exResult
    //   }
    // } else {
    //   tempInclusionResourceAvg = inclusionResourceAvg
    //   tempExclusionResourceAvg = exclusionResourceAvg
    // }

    // //export
    // let str = 'I/E' + ','  + 'NCT ID' + ','+ 'Category' + ',' + 'Raw Entity' + ',' + 'Standardized Entity' + ',' + 'Snomed' + ',' + 'Average Value' + ',' + 'Average Lower Limit' + ',' + 'Average Upper Limit' + ',' + 'Units'
    // for(const standardized in tempInclusionResourceAvg){
    //   for(const criteria in tempInclusionResourceAvg[standardized]){
    //     str += '\n' + 'INCLUSION' + ',"' 
    //                 + tempInclusionResourceAvg[standardized][criteria].nct + '","'
    //                 + tempInclusionResourceAvg[standardized][criteria].category + '","' 
    //                 + tempInclusionResourceAvg[standardized][criteria].raw + '","' 
    //                 + tempInclusionResourceAvg[standardized][criteria].standardized + '","' 
    //                 + tempInclusionResourceAvg[standardized][criteria].snomed + '","' 
    //                 + (tempInclusionResourceAvg[standardized][criteria].avg_value === 0?"":tempInclusionResourceAvg[standardized][criteria].avg_value) + '","'
    //                 + (tempInclusionResourceAvg[standardized][criteria].avg_lower === 0? "":tempInclusionResourceAvg[standardized][criteria].avg_lower) + '","' 
    //                 + (tempInclusionResourceAvg[standardized][criteria].avg_upper ===0?"":tempInclusionResourceAvg[standardized][criteria].avg_upper)  + '","'
    //                 + tempInclusionResourceAvg[standardized][criteria].units + '"'
    //   }
    // }
    // for(const standardized in tempExclusionResourceAvg){
    //   for(const criteria in tempExclusionResourceAvg[standardized]){
    //     str += '\n' + 'EXCLUSION' + ',"' 
    //     + tempExclusionResourceAvg[standardized][criteria].nct + '","' 
    //     + tempExclusionResourceAvg[standardized][criteria].category + '","' 
    //     + tempExclusionResourceAvg[standardized][criteria].raw + '","'
    //     + tempExclusionResourceAvg[standardized][criteria].standardized + '","' 
    //     + tempExclusionResourceAvg[standardized][criteria].snomed + '","' 
    //     + (tempExclusionResourceAvg[standardized][criteria].avg_value === 0? "":tempExclusionResourceAvg[standardized][criteria].avg_value) + '","' 
    //     + (tempExclusionResourceAvg[standardized][criteria].avg_lower === 0?"":tempExclusionResourceAvg[standardized][criteria].avg_lower) + '","'
    //     + (tempExclusionResourceAvg[standardized][criteria].avg_upper===0?"":tempExclusionResourceAvg[standardized][criteria].avg_upper) + '","'
    //     + tempExclusionResourceAvg[standardized][criteria].units +  '"'
    //   }
    // }

    // let exportContent = "\uFEFF";
    // let blob = new Blob([exportContent + str], {
    //   type: "text/plain;charset=utf-8"
    // });

    // const date = Date().split(" ");
    // const dateStr = date[1] + '_' + date[2] + '_' + date[3] + '_' + date[4];
    // FileSaver.saveAs(blob, `IE_Average_${dateStr}.csv`);
  }

  const optionLabelDemographics = originDemographics.map((item, index)=>{
     return item
   })
  const optionLabelIntervention = originIntervention.map((item, index)=>{
     return item
   })
  const optionLabelMedCondition = originMedCondition.map((item, index)=>{
     return item
   })
  const optionLabelLabTest = originLabTest.map((item, index)=>{
     return item
   })
  
  let timer = null;
  const onTextChange = useCallback((e) => {
    const val = e.target.value;
    let searchDemo = []
    let searchInte = []
    let searchMed=[]
    let searchLab=[]
    !visibleValue&&setVisibleValue(true)
    if (timer !== null) {
      clearTimeout(timer);
    }    
    timer = setTimeout(function () {
      setSearchTxt(val)
      searchDemo = val.length>0? optionLabelDemographics.filter(
        (i) =>
          i.Text.toLowerCase().indexOf(val.toLowerCase()) > -1
        ) : []
      searchInte = val.length>0? optionLabelIntervention.filter(
        (i) =>
          i.Text.toLowerCase().indexOf(val.toLowerCase()) > -1
        ): []
      searchMed = val.length>0?optionLabelMedCondition.filter(
        (i) =>
          i.Text.toLowerCase().indexOf(val.toLowerCase()) > -1
        ): []
      searchLab = val.length>0?optionLabelLabTest.filter(
        (i) =>
          i.Text.toLowerCase().indexOf(val.toLowerCase()) > -1
        ): []
      setSearchDemographics(searchDemo)
      setSearchIntervention(searchInte)
      setSearchMedCondition(searchMed)
      setSearchLabTest(searchLab)
    }, 200);
  },[searchTxt])

  const optionLabelDemographicsExclu = originExcluDemographics.map((item, index)=>{
    return item
  })
 const optionLabelInterventionExclu = originExcluIntervention.map((item, index)=>{
    return item
  })
 const optionLabelMedConditionExclu = originExcluMedCondition.map((item, index)=>{
    return item
  })
 const optionLabelLabTestExclu = originExcluLabTest.map((item, index)=>{
    return item
  })

  let timerExclu = null;
  const onExcluTextChange = useCallback((e) => {
    const val = e.target.value;
    let searchDemoEx = []
    let searchInterEx = []
    let searchMedEx=[]
    let searchLabEx=[]
    !visibleValueExclu&&setVisibleValueExclu(true)
    if ( timerExclu !== null) {
      clearTimeout(timerExclu);
    }
    timerExclu = setTimeout(function () {
        setSearchTxtExclu(val);
        searchDemoEx = val.length>0?optionLabelDemographicsExclu.filter(
          (i) =>
            i.Text.toLowerCase().indexOf(val.toLowerCase()) > -1
          ): []
        searchInterEx = val.length>0?optionLabelInterventionExclu.filter(
          (i) =>
            i.Text.toLowerCase().indexOf(val.toLowerCase()) > -1
          ): []
        searchMedEx = val.length>0?optionLabelMedConditionExclu.filter(
          (i) =>
            i.Text.toLowerCase().indexOf(val.toLowerCase()) > -1
          ): []
        searchLabEx = val.length>0?optionLabelLabTestExclu.filter(
          (i) =>
            i.Text.toLowerCase().indexOf(val.toLowerCase()) > -1
          ): []
        setSearchDemographicsExclu(searchDemoEx)
        setSearchInterventionExclu(searchInterEx)
        setSearchMedConditionExclu(searchMedEx)
        setSearchLabTestExclu(searchLabEx)
    }, 400);
  },[searchTxtExclu]) 

  const onItemClick = ({ key }) => {
    setVisibleValue(true)
    let indexdemographicsElements = demographicsElements.findIndex((domain) => JSON.parse(key.slice(1)).Text == domain['Eligibility Criteria']);
    let indexmedConditionElements = medConditionElements.findIndex((domain) => JSON.parse(key.slice(1)).Text == domain['Eligibility Criteria']);
    let indexinterventionElements = interventionElements.findIndex((domain) => JSON.parse(key.slice(1)).Text == domain['Eligibility Criteria']);
    let indexlabTestElements = labTestElements.findIndex((domain) => JSON.parse(key.slice(1)).Text == domain['Eligibility Criteria']);
    //  if key includes in [], delete; if not includes, push []
    switch(key.charAt(0)) {
      case "D":
        if(indexdemographicsElements < 0){
          var newItem = {
            "Eligibility Criteria": JSON.parse(key.slice(1)).Text,
            "Values": JSON.parse(key.slice(1)).Text.trim().toUpperCase() === 'INSULIN' ? '-' : formatValue(JSON.parse(key.slice(1))),
            "rawValue": JSON.parse(key.slice(1)).Value,
            "Timeframe": JSON.parse(key.slice(1)).Text.trim().toUpperCase() === 'INSULIN' ? formatValue(JSON.parse(key.slice(1))) : "-",
            "Frequency":JSON.parse(key.slice(1)).Frequency
          }
          demographicsElements.push(newItem)
          setDemographicsElements(demographicsElements)
        }else {
          demographicsElements.splice(indexdemographicsElements, 1) 
          setDemographicsElements(demographicsElements)
        }
        break;
      case "M":
        if(indexmedConditionElements < 0){
          var newItem = {
            "Eligibility Criteria": JSON.parse(key.slice(1)).Text,
            "Values": JSON.parse(key.slice(1)).Text.trim().toUpperCase() === 'INSULIN' ? '-' : formatValue(JSON.parse(key.slice(1))),
            "rawValue": JSON.parse(key.slice(1)).Value,
            "Timeframe": JSON.parse(key.slice(1)).Text.trim().toUpperCase() === 'INSULIN' ? formatValue(JSON.parse(key.slice(1))) : "-",
            "Frequency":JSON.parse(key.slice(1)).Frequency
          }
          medConditionElements.push(newItem)
          setMedConditionElements(medConditionElements)
        }else {
          medConditionElements.splice(indexmedConditionElements, 1) 
          setMedConditionElements(medConditionElements)
        }
      break;
      case "I":
        if(indexinterventionElements < 0){
          var newItem = {
            "Eligibility Criteria": JSON.parse(key.slice(1)).Text,
            "Values": JSON.parse(key.slice(1)).Text.trim().toUpperCase() === 'INSULIN' ? '-' : formatValue(JSON.parse(key.slice(1))),
            "rawValue": JSON.parse(key.slice(1)).Value,
            "Timeframe": JSON.parse(key.slice(1)).Text.trim().toUpperCase() === 'INSULIN' ? formatValue(JSON.parse(key.slice(1))) : "-",
            "Frequency":JSON.parse(key.slice(1)).Frequency
          }
          interventionElements.push(newItem)
          setInterventionElements(interventionElements)
        }else {
          interventionElements.splice(indexinterventionElements, 1) 
          setInterventionElements(interventionElements)
        }
      break;
      default:
        if(indexlabTestElements < 0){
          var newItem = {
            "Eligibility Criteria": JSON.parse(key.slice(1)).Text,
            "Values": JSON.parse(key.slice(1)).Text.trim().toUpperCase() === 'INSULIN' ? '-' : formatValue(JSON.parse(key.slice(1))),
            "rawValue": JSON.parse(key.slice(1)).Value,
            "Timeframe": JSON.parse(key.slice(1)).Text.trim().toUpperCase() === 'INSULIN' ? formatValue(JSON.parse(key.slice(1))) : "-",
            "Frequency":JSON.parse(key.slice(1)).Frequency
          }
          labTestElements.push(newItem)
          setLabTestElements(labTestElements)
        }else {
          labTestElements.splice(indexlabTestElements, 1) 
          setLabTestElements(labTestElements)
        }
      break;
    }
    updateTrial(1, 1)
};

  const onItemClickExclu = ({ key }) => {
    setVisibleValueExclu(true)
    let indexdemographicsElements = excluDemographicsElements.findIndex((domain) => JSON.parse(key.slice(1)).Text == domain['Eligibility Criteria']);
    let indexmedConditionElements = excluMedConditionElements.findIndex((domain) => JSON.parse(key.slice(1)).Text == domain['Eligibility Criteria']);
    let indexinterventionElements = excluInterventionElements.findIndex((domain) => JSON.parse(key.slice(1)).Text == domain['Eligibility Criteria']);
    let indexlabTestElements = excluLabTestElements.findIndex((domain) => JSON.parse(key.slice(1)).Text == domain['Eligibility Criteria']);
    //  if key includes in [], delete; if not includes, push []
    switch(key.charAt(0)) {
      case "D":
        if(indexdemographicsElements < 0){
          var newItem = {
            "Eligibility Criteria": JSON.parse(key.slice(1)).Text,
            "Values": JSON.parse(key.slice(1)).Text.trim().toUpperCase() === 'INSULIN' ? '-' : formatValue(JSON.parse(key.slice(1))),
            "rawValue": JSON.parse(key.slice(1)).Value,
            "Timeframe": JSON.parse(key.slice(1)).Text.trim().toUpperCase() === 'INSULIN' ? formatValue(JSON.parse(key.slice(1))) : "-",
            "Frequency":JSON.parse(key.slice(1)).Frequency
          }
          excluDemographicsElements.push(newItem)
          setExcluDemographicsElements(excluDemographicsElements)
        }else {
          excluDemographicsElements.splice(indexdemographicsElements, 1) 
          setExcluDemographicsElements(excluDemographicsElements)
        }
        break;
      case "M":
        if(indexmedConditionElements < 0){
          var newItem = {
            "Eligibility Criteria": JSON.parse(key.slice(1)).Text,
            "Values": JSON.parse(key.slice(1)).Text.trim().toUpperCase() === 'INSULIN' ? '-' : formatValue(JSON.parse(key.slice(1))),
            "rawValue": JSON.parse(key.slice(1)).Value,
            "Timeframe": JSON.parse(key.slice(1)).Text.trim().toUpperCase() === 'INSULIN' ? formatValue(JSON.parse(key.slice(1))) : "-",
            "Frequency":JSON.parse(key.slice(1)).Frequency
          }
          excluMedConditionElements.push(newItem)
          setExcluMedConditionElements(excluMedConditionElements)
        }else {
          excluMedConditionElements.splice(indexmedConditionElements, 1) 
          setExcluMedConditionElements(excluMedConditionElements)
        }
      break;
      case "I":
        if(indexinterventionElements < 0){
          var newItem = {
            "Eligibility Criteria": JSON.parse(key.slice(1)).Text,
            "Values": JSON.parse(key.slice(1)).Text.trim().toUpperCase() === 'INSULIN' ? '-' : formatValue(JSON.parse(key.slice(1))),
            "rawValue": JSON.parse(key.slice(1)).Value,
            "Timeframe": JSON.parse(key.slice(1)).Text.trim().toUpperCase() === 'INSULIN' ? formatValue(JSON.parse(key.slice(1))) : "-",
            "Frequency":JSON.parse(key.slice(1)).Frequency
          }
          excluInterventionElements.push(newItem)
          setExcluInterventionElements(excluInterventionElements)
        }else {
          excluInterventionElements.splice(indexinterventionElements, 1) 
          setExcluInterventionElements(excluInterventionElements)
        }
      break;
      default:
        if(indexlabTestElements < 0){
          var newItem = {
            "Eligibility Criteria": JSON.parse(key.slice(1)).Text,
            "Values": JSON.parse(key.slice(1)).Text.trim().toUpperCase() === 'INSULIN' ? '-' : formatValue(JSON.parse(key.slice(1))),
            "rawValue": JSON.parse(key.slice(1)).Value,
            "Timeframe": JSON.parse(key.slice(1)).Text.trim().toUpperCase() === 'INSULIN' ? formatValue(JSON.parse(key.slice(1))) : "-",
            "Frequency":JSON.parse(key.slice(1)).Frequency
          }
          excluLabTestElements.push(newItem)
          setExcluLabTestElements(excluLabTestElements)
        }else {
          excluLabTestElements.splice(indexlabTestElements, 1) 
          setExcluLabTestElements(excluLabTestElements)
        }
      break;
    }
    updateTrial(2, 1)    
};
  
 const renderItem = (title: string, type: string, idx: any) => { 
    return (
      <div
        className="itemLine"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span className="itemTitle">
          {(searchTxt.length < title.length)&& title.toLowerCase().split(searchTxt)[0]}
          <span className={`${
            searchTxt &&
            title.toLowerCase().indexOf(searchTxt.toLowerCase()) > -1
              ? "matched-item"
              : ""
            }`}>{searchTxt.length - title.length === 0?title:searchTxt}
          </span>
          {(searchTxt.length !== 0)&&(searchTxt.length < title.length)&&title.toLowerCase().split(searchTxt)[1]}
        </span>
        <span style={{color:"#CA4A04", marginLeft:"25px"}}>
          Add
        </span>
      </div>
    )
  };

 const renderItemClick = (title: string, type: string, idx: any) => {
    return (
      <div
        className="itemLine"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span className="itemTitle">
          {(searchTxt.length < title.length)&& title.toLowerCase().split(searchTxt)[0]}
          <span className={`${
            searchTxt &&
            title.toLowerCase().indexOf(searchTxt.toLowerCase()) > -1
              ? "matched-item"
              : ""
            }`}>{searchTxt.length - title.length === 0?title:searchTxt}
          </span>
          {(searchTxt.length !== 0)&&(searchTxt.length < title.length)&&title.toLowerCase().split(searchTxt)[1]}
        </span>
        <span style={{color:"#3193E5", fontWeight:700, marginLeft:"25px"}}>
            <CheckOutlined />
        </span>
      </div>
    )
  };

 const renderItemExclu = (title: string, type: string, idx: any) => { 
    return (
      <div
        className="itemLine"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span className="itemTitle">
          {(searchTxtExclu.length < title.length)&& title.toLowerCase().split(searchTxtExclu)[0]}
          <span className={`${
            searchTxtExclu &&
            title.toLowerCase().indexOf(searchTxtExclu.toLowerCase()) > -1
              ? "matched-item"
              : ""
            }`}>{searchTxtExclu.length - title.length === 0?title:searchTxtExclu}
          </span>
          {(searchTxtExclu.length !== 0)&&(searchTxtExclu.length < title.length)&&title.toLowerCase().split(searchTxtExclu)[1]}
        </span>
        <span style={{color:"#CA4A04", marginLeft:"25px"}}>
          Add
        </span>
      </div>
    )
  };

 const renderItemClickExclu = (title: string, type: string, idx: any) => {
    return (
      <div
        className="itemLine"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span className="itemTitle">
          {(searchTxtExclu.length < title.length)&& title.toLowerCase().split(searchTxtExclu)[0]}
          <span className={`${
            searchTxtExclu &&
            title.toLowerCase().indexOf(searchTxtExclu.toLowerCase()) > -1
              ? "matched-item"
              : ""
            }`}>{searchTxtExclu.length - title.length === 0?title:searchTxtExclu}
          </span>
          {(searchTxtExclu.length !== 0)&&(searchTxtExclu.length < title.length)&&title.toLowerCase().split(searchTxtExclu)[1]}
        </span>
        <span style={{color:"#3193E5", fontWeight:700, marginLeft:"25px"}}>
            <CheckOutlined />
        </span>
      </div>
    )
  };

  const menu = (
  <Menu onClick={onItemClick}>
    {(searchTxt.length !== 0)&&searchDemographics.length>0 && (<Menu.ItemGroup title="Demographics">
     {
        searchDemographics.map((item,idx)=>{
          if(demographicsElements.findIndex((domain) => item.Text == domain['Eligibility Criteria'])<0){
            return <Menu.Item key={"D"+JSON.stringify(item)}>{renderItem(item.Text,"D", idx)}</Menu.Item>
          } else {
            return <Menu.Item key={"D"+JSON.stringify(item)}>{renderItemClick(item.Text,"D", idx)}</Menu.Item>
          }
        })
      }
    </Menu.ItemGroup>)}
    {(searchTxt.length !== 0)&&searchMedCondition.length>0 &&(<Menu.ItemGroup title="Medical Condition">  
      {
        searchMedCondition.map((item,idx)=>{
          if(medConditionElements.findIndex((domain) => item.Text == domain['Eligibility Criteria'])<0){
            return <Menu.Item key={"M"+JSON.stringify(item)}>{renderItem(item.Text, "M",idx)}</Menu.Item>
          }else {
            return <Menu.Item key={"M"+JSON.stringify(item)}>{renderItemClick(item.Text, "M",idx)}</Menu.Item>
          }
        })
      }
    </Menu.ItemGroup>)}
    {(searchTxt.length !== 0)&&searchIntervention.length>0 &&(<Menu.ItemGroup title="Intervention">
       {
        searchIntervention.map((item,idx)=>{
          if(interventionElements.findIndex((domain) => item.Text == domain['Eligibility Criteria'])<0){
            return <Menu.Item key={"I"+JSON.stringify(item)}>{renderItem(item.Text, "I",idx)}</Menu.Item>
          }else{
            return <Menu.Item key={"I"+JSON.stringify(item)}>{renderItemClick(item.Text, "I",idx)}</Menu.Item>
          }
        })
      }
    </Menu.ItemGroup>)}
    {(searchTxt.length !== 0)&&searchLabTest.length>0 && <Menu.ItemGroup title="Lab / Test">
       {
        searchLabTest.map((item,idx)=>{
          if(labTestElements.findIndex((domain) => item.Text == domain['Eligibility Criteria'])<0){
            return <Menu.Item key={"L"+JSON.stringify(item)}>{renderItem(item.Text, "L",idx)}</Menu.Item>
          }else{
            return <Menu.Item key={"L"+JSON.stringify(item)}>{renderItemClick(item.Text, "L",idx)}</Menu.Item>
          }
        })
      }
    </Menu.ItemGroup>}
  </Menu>
);

  const menuExclu = (
    <Menu onClick={onItemClickExclu}>
      {(searchTxtExclu.length !== 0)&&searchDemographicsExclu.length>0&&(<Menu.ItemGroup title="Demographics">
      {
          searchDemographicsExclu.map((item,idx)=>{
            if(excluDemographicsElements.findIndex((domain) => item.Text == domain['Eligibility Criteria'])<0){
              return <Menu.Item key={"D"+JSON.stringify(item)}>{renderItemExclu(item.Text,"D", idx)}</Menu.Item>
            } else {
              return <Menu.Item key={"D"+JSON.stringify(item)}>{renderItemClickExclu(item.Text,"D", idx)}</Menu.Item>
            }
          })
        }
      </Menu.ItemGroup>)}
      {(searchTxtExclu.length !== 0)&& searchMedConditionExclu.length>0&&(<Menu.ItemGroup title="Medical Condition">  
        {
        searchMedConditionExclu.map((item,idx)=>{
            if(excluMedConditionElements.findIndex((domain) => item.Text == domain['Eligibility Criteria'])<0){
              return <Menu.Item key={"M"+JSON.stringify(item)}>{renderItemExclu(item.Text, "M",idx)}</Menu.Item>
            }else {
              return <Menu.Item key={"M"+JSON.stringify(item)}>{renderItemClickExclu(item.Text, "M",idx)}</Menu.Item>
            }
          })
        }
      </Menu.ItemGroup>)}
     {(searchTxtExclu.length !== 0)&& searchInterventionExclu.length>0&&( <Menu.ItemGroup title="Intervention">
        {
        searchInterventionExclu.map((item,idx)=>{
            if(excluInterventionElements.findIndex((domain) => item.Text == domain['Eligibility Criteria'])<0){
              return <Menu.Item key={"I"+JSON.stringify(item)}>{renderItemExclu(item.Text, "I",idx)}</Menu.Item>
            }else{
              return <Menu.Item key={"I"+JSON.stringify(item)}>{renderItemClickExclu(item.Text, "I",idx)}</Menu.Item>
            }
          })
        }
      </Menu.ItemGroup>)}
      {(searchTxtExclu.length !== 0)&& searchLabTestExclu.length>0&&(<Menu.ItemGroup title="Lab / Test">
        {
        searchLabTestExclu.map((item,idx)=>{
            if(excluLabTestElements.findIndex((domain) => item.Text == domain['Eligibility Criteria'])<0){
              return <Menu.Item key={"L"+JSON.stringify(item)}>{renderItemExclu(item.Text, "L",idx)}</Menu.Item>
            }else{
              return <Menu.Item key={"L"+JSON.stringify(item)}>{renderItemClickExclu(item.Text, "L",idx)}</Menu.Item>
            }
          })
        }
      </Menu.ItemGroup>)}
    </Menu>
  );

  // update UI to new wireframe
  const [activeCollapse, setActiveCollapse] = useState(['1'])

  const eventLibHeader = (name, count, key) => {
    return (
      <Row className="section-header">
        <Col span={23}><span>{name}</span><span className="count-span">{count}</span></Col>
        <Col span={1} className="collapse-icon">{activeCollapse.indexOf(key) >= 0 ?(<MinusOutlined />):(<PlusOutlined />)}</Col>
      </Row>
    );
  };

  const criteriaCallback = (key) => {
    setActiveCollapse(key)
  }

  const backToHome = () => {
    // setShowDetails(false)
    // setViewScenario({viewScenarioDetails: false, scnarioId: ''})
  }

  const clickInclu = () => {
    setActiveTabKey('1')
    setProcessStep(0)
  }

  const clickExclu = () => {
    setActiveTabKey('2')
    setProcessStep(0)
  }

  const clickEnroll = () => {
    changeActiveTabKey('3')
    setProcessStep(0)
    // setSubmitType(1)
  }

  const clickEndpoint = () => {
    changeActiveTabKey('4')
    setProcessStep(1)
  }

  const clickSOE = () => {
    changeActiveTabKey('5')
    setProcessStep(2)
  }

    return (
    <div className="scenario-container">
      <Spin spinning={pageLoading} indicator={<LoadingOutlined style={{ color: "#ca4a04",fontSize: 24 }}/>}>
        <div className="left-nav">
          {/* <div className="nav-trial-title">{trialTitle}&nbsp;:&nbsp;{scenarioType}</div> */}
          <div className="nav-trial-title ellipsis">{trialTitle}</div>
          <div className="nav-scenario-name ellipsis">{scenario['scenario_name']}</div>
          <div className="nav-blank"> </div>  
          <div  className="nav-section-wrapper" >
              <div className="ie-wrapper">
                <div className="ie-text">Inclusion / <br></br>Exclusion Criteria</div>
                  <Button  className={"nav-btn ie-btn" + (activeTabKey === '1'?" selected": "")} onClick={clickInclu}>
                      Inclusion Criteria
                  </Button>
                  <Button  className={"nav-btn ie-btn" + (activeTabKey === '2'?" selected": "")} onClick={clickExclu}>
                      Exclusion Criteria
                  </Button>
                  <Button  className={"nav-btn ie-btn" + (activeTabKey === '3'?" selected": "")} onClick={clickEnroll}>
                      Enrollment Feasibility
                  </Button>
              </div>
              <div className="endpoint-wrapper">
                  <Button className={"nav-btn other-btn" + (activeTabKey === '4'?" selected": "")} onClick={clickEndpoint}>
                      Protocol Endpoint
                  </Button>
              </div>
              <div className="soe-wrapper">
                <Button className={"nav-btn other-btn" + (activeTabKey === '5'?" selected": "")} onClick={clickSOE}>
                    Schedule Of Events
                </Button>
              </div>
          <div/> 
          </div>
        </div>
        <div className="right-content">
          <div className="process-container-wrapper">
            <div className="top-process-container">
              <Breadcrumb>
                <Breadcrumb.Item
                  className="homepage"
                  onClick={()=>props.history.push('/trials')}
                >
                  <span>
                    My Trials
                  </span>
                </Breadcrumb.Item>
                <Breadcrumb.Item 
                  className="homepage"
                  onClick={()=>props.history.push({pathname: '/trials', state: {trial_id: props.location.state.trial_id}})}
                  >
                    Trial Page
                  </Breadcrumb.Item>
                <Breadcrumb.Item
                  className="currentpage"
                  >
                  {scenario['scenario_name']}
                </Breadcrumb.Item>
              </Breadcrumb>
            </div>
          </div>
          {processStep === 0 &&
          <div className="ie-container">
            <div className="process-container">
              <span className="action-title" onClick={()=>props.history.push({pathname: '/trials', state: {trial_id: props.location.state.trial_id}})}>
                  <LeftOutlined style={{color:"#000000"}}/> &nbsp;<MenuOutlined style={{color:"#000000"}}/>
              </span>
              <span className="content-title">
                {activeTabKey === '1' && <>
                  <span className="tab-title">Add Inclusion Criteria</span>
                  <span className="tip1-desc">
                  Use the historical trial library on the left to build the I/E criteria for your trial scenario.
                  </span>
                </>}
                {activeTabKey === '2' && <>
                  <span className="tab-title">Add Exclusion Criteria</span>
                  <span className="tip1-desc">
                  Use the historical trial library on the left to build the I/E criteria for your trial scenario.
                  </span>
                </>}
                {activeTabKey === '3' && <>
                  <span className="tab-title">Enrollment Feasibility</span>
                  <span className="tip1-desc">
                  View the impact of selected inclusion exclusion criteria on prospective patient enrollment
                  </span>
                </>}
              </span>
              <span className="button-area">
                <Dropdown.Button style={{zIndex: 1}}
                overlay={
                  <Menu>
                    <Menu.Item key="pdf" onClick={() => handleExport('pdf')}>PDF</Menu.Item>
                    <Menu.Item key="csv" onClick={() => handleExport('csv')}>CSV</Menu.Item>
                  </Menu>
                }
                  icon={<DownOutlined />}>
                  {/* <DownloadOutlined /> */}
                  EXPORT AS
                </Dropdown.Button>
                {/* <Button className="save-btn"  onClick={saveCriteria}>
                    Save And Finish Later
                </Button> */}
                {/* <Button type="primary" className="submit-btn"  onClick={()=> setSubmitType(2)}> */}
                <Button type="primary" className="submit-btn"   onClick={submitCriteria}>
                    Submit
                </Button>
              </span>
            </div>
            <div className="tab-container">
              <div className={`side-toolbar ${criteriaLib > 0 || activeTabKey != "1" ? 'hidden' : ''}`} onClick={()=> setCriteriaLib(6)}>
                <div className="panel-label">Inclusion Criteria Library</div>
                <div className="icon">&nbsp;<ArrowRightOutlined />&nbsp;</div>
              </div>
              <div className={`side-toolbar ${excluCriteriaLib > 0 || activeTabKey != "2" ? 'hidden' : ''}`} onClick={()=> setExcluCriteriaLib(6)}>
                <div className="panel-label">Exclusion Criteria Library</div>
                <div className="icon">&nbsp;<ArrowRightOutlined />&nbsp;</div>
              </div>
              <Tabs onChange={changeActiveTabKey} activeKey={activeTabKey} centered>
                <TabPane tab="Inclusion Criteria" key="1">
                  <Row>
                    <Col span={criteriaLib} style={{backgroundColor: '#F8F8F8',maxWidth: '300px', minWidth: '300px'}}>
                      <Row style={{backgroundColor: '#F8F8F8'}}>
                        <Col span={24}>
                          <div className="item-header">
                            <span>Inclusion Criteria Library</span>
                            <Tooltip title={'Collapse Inclusion Criteria Library'}>
                              <CloseOutlined className="right-icon" onClick={() => setCriteriaLib(0)}></CloseOutlined>
                              </Tooltip>
                            <Tooltip title={'View Historical Trial List'}>
                              <HistoryOutlined className="right-icon" onClick={searchHistoricalTrials}></HistoryOutlined>
                            </Tooltip>
                          </div>
                        </Col>
                      </Row>
                      <Row style={{borderBottom:'10px solid #F8F8F8'}}>
                        <Col flex="none">
                          <div style={{ padding: '0 10px' }}></div>
                        </Col>
                        <Col className="left-section">
                          <Row className="head-row" style={{alignItems: 'center', marginBottom: '10px'}}>
                            <Col span={16}>
                              <div className="item-option">
                                <span>Select criteria to add to Trial</span>
                              </div>
                            </Col>
                            <Col span={8} style={{textAlign:'right'}}>
                              <Row>
                              <Col span={24}><span className="frequency" style={{ display: "block",width: "110px" }}>CRITERIA FREQUENCY</span></Col>
                              </Row>
                              <Row style={{width:'100%'}}>
                              <Col span={24}>
                                <div id="freqModal" ref={null} onClick={() => setVisible(true)}>
                                  <span className="label">
                                    {minValue}%-{maxValue}%
                                  </span>
                                  <EditFilled className={`${visible ? 'active' : ''}`}/>
                                </div>
                                </Col>
                              </Row>
                            </Col>
                          </Row>
                          
                          {visible ? (
                          <div className="freqSection">
                            <div className="title">
                              {/* <span>Set Frequency</span> */}
                              <CloseOutlined
                                className="right-icon"
                                onClick={() => setVisible(false)}
                              ></CloseOutlined>
                            </div>
                            <br/>
                            <div className="content">
                              <span>Criteria Frequency</span>
                              <span style={{ float: "right", fontWeight: 'bold' }}>
                                {minValue}% - {maxValue}%
                              </span>
                            </div>
                            <Slider
                              range={{ draggableTrack: true }}
                              defaultValue={[minValue, maxValue]}
                              tipFormatter={formatter}
                              onAfterChange={getFrequency}
                            />
                          </div>
                          ) : (
                          <></>
                          )}
                          {/* search bar */}
                          <div className="searchSection">
                            <div className="content">
                              <Dropdown 
                                overlay={menu} 
                                overlayClassName="searchbox"
                                visible={visibleValue}
                                onVisibleChange={(visible: boolean) => {!visibleValue?setVisibleValue(true):setVisibleValue(false)}}
                              >
                                <Input
                                    prefix={<SearchOutlined />}
                                    style={{ width: '100%', height: 37 }}
                                    allowClear
                                    onChange={onTextChange}
                                    onClick={e => e.preventDefault()}
                                />
                              </Dropdown>
                            </div>
                          </div>
                          <Row>
                            <Col span={24}>
                              <div className="content-outer content-sidebar">
                                <div className="content-over">
                                  <Collapse className="eventLib library box" collapsible="header" onChange={criteriaCallback} activeKey={activeCollapse}>
                                    <Panel showArrow={false} header={eventLibHeader("Demographics", demographics.length, "1")} key="1">
                                      {demographics.length>0 ? (
                                          <div className="library box select-option-wrapper">
                                          {demographics.sort(function(m,n){ var a = m["Frequency"]; var b = n["Frequency"]; return b-a;}).map((demographic, idx) => {                     
                                            return (
                                              <CriteriaOption
                                                selectedEle = {demographicsElements}
                                                minValue={minValue}
                                                maxValue={maxValue}
                                                key={`demographic_${idx}`}
                                                demographic={demographic}
                                                index={0}
                                                idx={idx}
                                                handleOptionSelect={handleOptionSelect}
                                              ></CriteriaOption>
                                            );
                                          })}
                                        </div>
                                      ): (
                                        <></>
                                      )}
                                    </Panel>
                                  </Collapse>

                                  <Collapse className="eventLib library box" collapsible="header" onChange={criteriaCallback} activeKey={activeCollapse}>
                                    <Panel showArrow={false} header={eventLibHeader("Medical Condition", medCondition.length, "2")} key="2">
                                      {medCondition.length>0 ? (
                                          <div className="library box select-option-wrapper">
                                          {medCondition.sort(function(m,n){ var a = m["Frequency"]; var b = n["Frequency"]; return b-a;}).map((medCon, idx) => {
                                            return (
                                              <CriteriaOption
                                                selectedEle = {medConditionElements}
                                                minValue={minValue}
                                                maxValue={maxValue}
                                                key={`medCon_${idx}`}
                                                demographic={medCon}
                                                index={1}
                                                idx={idx}
                                                handleOptionSelect={handleOptionSelect}
                                              ></CriteriaOption>
                                            );
                                          })}
                                        </div>
                                      ): (
                                        <></>
                                      )}
                                    </Panel>
                                  </Collapse>

                                  <Collapse className="eventLib library box" collapsible="header" onChange={criteriaCallback} activeKey={activeCollapse}>
                                  <Panel showArrow={false} header={eventLibHeader("Intervention", intervention.length, "3")} key="3">
                                    {intervention.length>0 ? (
                                          <div className="library box select-option-wrapper">
                                          {intervention.sort(function(m,n){ var a = m["Frequency"]; var b = n["Frequency"]; return b-a;}).map((intervent, idx) => {              
                                            return (
                                              <CriteriaOption
                                                selectedEle = {interventionElements}
                                                minValue={minValue}
                                                maxValue={maxValue}
                                                key={`intervent_${idx}`}
                                                demographic={intervent}
                                                index={2}
                                                idx={idx}
                                                handleOptionSelect={handleOptionSelect}
                                              ></CriteriaOption>
                                            );
                                          })}
                                        </div>
                                    ): (
                                      <></>
                                    )}
                                  </Panel>
                                </Collapse>

                                  <Collapse className="eventLib library box lastOne" collapsible="header" onChange={criteriaCallback} activeKey={activeCollapse}>
                                    <Panel showArrow={false} header={eventLibHeader("Lab / Test", labTest.length, "4")} key="4">
                                      {labTest.length>0 ? (
                                          <div className="library box select-option-wrapper lastOne">
                                          {labTest.sort(function(m,n){ var a = m["Frequency"]; var b = n["Frequency"]; return b-a;}).map((lib, idx) => {
                                            return (
                                              <CriteriaOption
                                                selectedEle = {labTestElements}
                                                minValue={minValue}
                                                maxValue={maxValue}
                                                key={`lib_${idx}`}
                                                demographic={lib}
                                                index={3}
                                                idx={idx}
                                                handleOptionSelect={handleOptionSelect}
                                              ></CriteriaOption>
                                            );
                                          })}
                                        </div>
                                      ): (
                                        <></>
                                      )}
                                    </Panel>
                                  </Collapse>
                                </div>
                              </div>
                            </Col>
                          </Row>
                        </Col>
                        <Col flex="none">
                          <div style={{ padding: '0 10px' }}></div>
                        </Col>
                      </Row>
                      <Row style={{backgroundColor: '#fff'}}>
                        <Col span={24}>
                          <div className="updateTrial">
                            <Button className="update-btn" onClick={() => updateTrial(1, 1)}>
                              UPDATE MY TRIAL
                            </Button>
                          </div>
                        </Col>
                      </Row>
                    </Col>
                    <Col flex="auto" className={`${ collapsible ? "none-click" : "" } main-content-right`}>
                      <Row style={{ paddingTop: '10px' }}>
                        <Col flex="none">
                          <div style={{ padding: '0 10px' }}></div>
                        </Col>
                        <Col flex="auto">
                          {/* <Row>
                            <Col span={24}></Col>
                          </Row> */}
                          <Row>
                            <Col span={24}>
                            <div className="option-item">
                              <div className="collapse-section-wrapper">
                                <Collapse activeKey={activeKey} onChange={callback} expandIconPosition="right" >
                                  <Panel header={panelHeader()} key="1" forceRender={false} >
                                    <div className="chart-container">
                                      <div className="label">
                                        <span>Click on each metric to filter</span>
                                      </div>
                                      <ReactECharts
                                        option={amendmentRateoption}
                                        style={{ height: 120}}
                                        onEvents={{'click': onInclusionChartClick}}/>
                                    </div>
                                    <div className="chart-container  box">
                                      <div className="label">
                                        <span>Click on each metric to filter</span>
                                      </div>
                                      <ReactECharts
                                        option={screenFailureOption}
                                        style={{ height: 120}}
                                        onEvents={{'click': onInclusionChartClick}}/>
                                    </div>
                                  </Panel>
                                </Collapse>
                              </div>
                            </div>
                            </Col>
                          </Row>
                          <Row className="impact-summary-wrapper">
                            <Col span={24}>
                              <div className="impact-summary">
                                <span>Inclusion Criteria</span>
                                {activeTabKey === '3'? (
                                    <></>
                                  ) : (
                                    <Button type="primary" onClick={saveCriteria} style={{zIndex: 1}}>
                                      Save
                                    </Button>
                                  )}
                              </div>
                              </Col>
                          </Row>
                          <Row>
                            <Col span={24} >
                              <div className="collapse-container">
                              <div className="content-outer">
                                <div id="inclusion-criteria" 
                                  className={`collapse-inner ${rollHeight == true ? "taller" : ""} ${collapsible == true ? "collapsed" : ""}`}>
                                  <div className="criteria-list">
                                    <div className="list-columns">
                                      <span className="col-item col-item-before"> </span>
                                      <span className="col-item col-item-first">Eligibility Criteria</span>
                                      <span className="col-item col-item-middle">Values</span>
                                      <span className="col-item col-item-last">Timeframe</span>
                                      <span className="col-item col-item-after"> </span>
                                      {/* <Row>
                                        <Col span={2}><div className="col-item">S/No.</div></Col>
                                        <Col span={8}><div className="col-item">Eligibility Criteria</div></Col>
                                        <Col span={8}><div className="col-item">Values</div></Col>
                                        <Col span={8}><div className="col-item">Timeframe</div></Col>
                                      </Row> */}
                                    </div>
                                  </div>
                                  <div className="sectionPanel">
                                      <EditTable updateCriteria={updateInclusionCriteria} tableIndex={2}                                
                                        data={demographicsTableData}
                                        defaultActiveKey={defaultActiveKey}
                                        collapsible={collapsible} panelHeader={"Demographics"} updateTrial={() => updateTrial(1, 1)}                                  
                                      />
                                      <EditTable updateCriteria={updateInclusionCriteria} tableIndex={3}
                                        data={medConditionTableData}
                                        defaultActiveKey={defaultActiveKey}
                                        collapsible={collapsible} panelHeader={"Medical Condition"} updateTrial={() => updateTrial(1, 1)}                               
                                      />
                                  <EditTable updateCriteria={updateInclusionCriteria} tableIndex={4} 
                                        data={interventionTableData}                                  
                                        defaultActiveKey={defaultActiveKey}
                                        collapsible={collapsible} panelHeader={"Intervention"} updateTrial={() => updateTrial(1, 1)}                                   
                                      />
                                  <EditTable updateCriteria={updateInclusionCriteria} tableIndex={5} 
                                        data={labTestTableData}
                                        defaultActiveKey={defaultActiveKey}
                                        collapsible={collapsible} panelHeader={"Lab / Test"} updateTrial={() => updateTrial(1, 1)}/>
                                  </div>
                                </div>
                              </div>
                              </div>
                            </Col>
                          </Row>
                        </Col>
                        <Col flex="none">
                          <div style={{ padding: '0 10px' }}></div>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </TabPane>
                <TabPane tab="Exclusion Criteria" key="2" disabled={collapsible}>
                  <Row>
                    <Col span={excluCriteriaLib} style={{backgroundColor: '#F8F8F8',maxWidth: '300px', minWidth: '300px'}}>
                      <Row style={{backgroundColor: '#F8F8F8'}}>
                        <Col span={24}>
                          <div className="item-header">
                            <span>Exclusion Criteria Library</span>
                            <Tooltip title={'Collapse Exclusion Criteria Library'}>
                              <CloseOutlined className="right-icon" onClick={() => setExcluCriteriaLib(0)}></CloseOutlined>
                            </Tooltip>
                            <Tooltip title={'View Historical Trial List'}>
                              <HistoryOutlined className="right-icon" onClick={searchHistoricalTrials}></HistoryOutlined>
                            </Tooltip>
                          </div>
                        </Col>
                      </Row>
                      <Row style={{borderBottom:'10px solid #F8F8F8'}}>
                        <Col flex="none">
                          <div style={{ padding: '0 10px' }}></div>
                        </Col>
                        <Col className="left-section">
                          <Row className="head-row" style={{alignItems: 'center', marginBottom: '10px'}}>
                            <Col span={16}>
                              <div className="item-option">
                                <span className="tip">Select criteria to add to Trial</span>
                              </div>
                            </Col>
                            <Col span={8} style={{textAlign:'right'}}>
                              <Row>
                              <Col span={24}><span className="frequency" style={{ display: "block",width: "110px" }}>CRITERIA FREQUENCY</span></Col>
                              </Row>
                              <Row style={{width:'100%'}}>
                              <Col span={24}>
                                <div id="freqModal" ref={null} onClick={() => setExcluVisible(true)}>
                                  <span className="label">
                                    {excluMinValue}%-{excluMaxValue}%
                                  </span>
                                  <EditFilled className={`${excluVisible ? 'active' : ''}`}/>
                                </div>
                                </Col>
                              </Row>
                            </Col>
                          </Row>
                          
                          {excluVisible ? (
                          <div className="freqSection">
                            <div className="title">
                              {/* <span>Set Frequency</span> */}
                              <CloseOutlined
                                className="right-icon"
                                onClick={() => setExcluVisible(false)}
                              ></CloseOutlined>
                            </div>
                            <br/>
                            <div className="content">
                              <span>Criteria Frequency</span>
                              <span style={{ float: "right", fontWeight: 'bold' }}>
                                {excluMinValue}% - {excluMaxValue}%
                              </span>
                            </div>
                            <Slider
                              range={{ draggableTrack: true }}
                              defaultValue={[excluMinValue, excluMaxValue]}
                              tipFormatter={formatter}
                              onAfterChange={getExcluFrequency}
                            />
                          </div>
                          ) : (
                          <></>
                          )}
                          {/* search bar */}
                          <div className="searchSection">
                            <div className="content">
                              <Dropdown 
                                overlay={menuExclu} 
                                overlayClassName="searchbox"
                                visible={visibleValueExclu}
                                onVisibleChange={(visible: boolean) => {!visibleValueExclu?setVisibleValueExclu(true):setVisibleValueExclu(false)}}
                              >
                                <Input
                                    prefix={<SearchOutlined />}
                                    style={{ width: '100%', height: 37 }}
                                    allowClear
                                    onChange={onExcluTextChange}
                                    onClick={e => e.preventDefault()}
                                />
                              </Dropdown>
                            </div>
                          </div>
                          <Row>
                            <Col span={24}>
                              <div className="content-outer content-sidebar">
                                <div className="content-over">
                                  <Collapse className="eventLib library box" collapsible="header" onChange={criteriaCallback} activeKey={activeCollapse}>
                                    <Panel showArrow={false} header={eventLibHeader("Demographics", excluDemographics.length, "5")} key="5">
                                      {excluDemographics.length>0 ? (
                                          <div className="library box select-option-wrapper">
                                          {excluDemographics.sort(function(m,n){ var a = m["Frequency"]; var b = n["Frequency"]; return b-a;}).map((demographic, idx) => {
                                            const activeType = excluDemographicsElements.find(e=> e['Eligibility Criteria']==demographic.Text) ?1:0
                                            return (
                                              <CriteriaOption
                                                selectedEle = {excluDemographicsElements}
                                                minValue={minValue}
                                                maxValue={maxValue}
                                                key={`demographic_${idx}`}
                                                demographic={demographic}
                                                index={0}
                                                idx={idx}
                                                handleOptionSelect={handleExcluOptionSelect}
                                              ></CriteriaOption>
                                            );
                                          })}
                                        </div>
                                        ): (
                                        <></>
                                      )}
                                    </Panel>
                                  </Collapse>

                                  <Collapse className="eventLib library box" collapsible="header" onChange={criteriaCallback} activeKey={activeCollapse}>
                                    <Panel showArrow={false} header={eventLibHeader("Medical Condition", excluMedCondition.length, "6")} key="6">
                                      {excluMedCondition.length>0 ? (
                                          <div className="library box select-option-wrapper">
                                          {excluMedCondition.sort(function(m,n){ var a = m["Frequency"]; var b = n["Frequency"]; return b-a;}).map((medCon, idx) => {
                                            return (
                                              <CriteriaOption
                                                selectedEle = {excluMedConditionElements}
                                                minValue={minValue}
                                                maxValue={maxValue}
                                                key={`medCon_${idx}`}
                                                demographic={medCon}
                                                index={1}
                                                idx={idx}
                                                handleOptionSelect={handleExcluOptionSelect}
                                              ></CriteriaOption>
                                            );
                                          })}
                                        </div>
                                        ): (
                                        <></>
                                      )}
                                    </Panel>
                                  </Collapse>

                                  <Collapse className="eventLib library box" collapsible="header" onChange={criteriaCallback} activeKey={activeCollapse}>
                                  <Panel showArrow={false} header={eventLibHeader("Intervention", excluIntervention.length, "7")} key="7">
                                    {excluIntervention.length>0 ? (
                                      <div className="library box select-option-wrapper">
                                      {excluIntervention.sort(function(m,n){ var a = m["Frequency"]; var b = n["Frequency"]; return b-a;}).map((intervent, idx) => {
                                        
                                        return (
                                          <CriteriaOption
                                            selectedEle = {excluInterventionElements}
                                            minValue={minValue}
                                            maxValue={maxValue}
                                            key={`intervent_${idx}`}
                                            demographic={intervent}
                                            index={2}
                                            idx={idx}
                                            handleOptionSelect={handleExcluOptionSelect}
                                          ></CriteriaOption>
                                        );
                                      })}
                                    </div> 
                                      ): (
                                    <></>
                                  )}
                                  </Panel>
                                </Collapse>

                                  <Collapse className="eventLib library box lastOne" collapsible="header" onChange={criteriaCallback} activeKey={activeCollapse}>
                                    <Panel showArrow={false} header={eventLibHeader("Lab / Test", excluLabTest.length, "8")} key="8">
                                      {excluLabTest.length>0 ? (
                                            <div className="library box select-option-wrapper lastOne">
                                            {excluLabTest.sort(function(m,n){ var a = m["Frequency"]; var b = n["Frequency"]; return b-a;}).map((lib, idx) => {
                                              return (
                                                <CriteriaOption
                                                selectedEle = {excluLabTestElements}
                                                  minValue={minValue}
                                                  maxValue={maxValue}
                                                  key={`lib_${idx}`}
                                                  demographic={lib}
                                                  index={3}
                                                  idx={idx}
                                                  handleOptionSelect={handleExcluOptionSelect}
                                                ></CriteriaOption>
                                              );
                                            })}
                                          </div>
                                        ): (
                                        <></>
                                      )}
                                    </Panel>
                                  </Collapse>
                                </div>
                              </div>
                            </Col>
                          </Row>
                        </Col>
                        <Col flex="none">
                          <div style={{ padding: '0 10px' }}></div>
                        </Col>
                      </Row>
                      <Row style={{backgroundColor: '#fff'}}>
                        <Col span={24}>
                          <div className="updateTrial">
                            <Button className="update-btn" onClick={() => updateTrial(2, 1)}>
                              UPDATE MY TRIAL
                            </Button>
                          </div>
                        </Col>
                      </Row>
                    </Col>
                    <Col flex="auto" className={`${ excluCollapsible ? "none-click" : "" } main-content-right`}>
                      <Row style={{ paddingTop: '10px' }}>
                        <Col flex="none">
                          <div style={{ padding: '0 10px' }}></div>
                        </Col>
                        <Col flex="auto">
                          <Row>
                            <Col span={24}>
                            <div className="option-item">
                              <div>
                                <Collapse activeKey={excluActiveKey} onChange={excluCallback} expandIconPosition="right" >
                                  <Panel header={panelHeader()} key="1" forceRender={false} >
                                    <div className="chart-container">
                                      <div className="label">
                                        <span>Click on each metric to filter</span>
                                      </div>
                                      <ReactECharts
                                        option={excluAmendmentRateoption}
                                        style={{ height: 120}}
                                        onEvents={{'click': onExclusionChartClick}}/>
                                    </div>
                                    <div className="chart-container  box">
                                      <div className="label">
                                        <span>Click on each metric to filter</span>
                                      </div>
                                      <ReactECharts
                                        option={excluScreenFailureOption}
                                        style={{ height: 120}}
                                        onEvents={{'click': onExclusionChartClick}}/>
                                    </div>
                                  </Panel>
                                </Collapse>
                              </div>
                            </div>
                            </Col>
                          </Row>
                          <Row className="impact-summary-wrapper"> 
                            <Col span={24}>
                              <div className="impact-summary">
                                <span>Exclusion Criteria</span>
                                {activeTabKey === '3'? (
                                  <></>
                                ) : (
                                  <Button type="primary" onClick={saveCriteria} style={{zIndex: 1}}>
                                    Save
                                  </Button>
                                )}
                              </div>
                              </Col>
                          </Row>
                          <Row>
                            <Col span={24} >
                              <div className="collapse-container">
                              <div className="content-outer">
                                <div id="inclusion-criteria" 
                                  className={`collapse-inner ${excluRollHeight == true ? "taller" : ""} ${excluCollapsible == true ? "collapsed" : ""}`}>
                                  <div className="criteria-list">
                                    <div className="list-columns">
                                      <span className="col-item col-item-before"> </span>
                                      <span className="col-item col-item-first">Eligibility Criteria</span>
                                      <span className="col-item col-item-middle">Values</span>
                                      <span className="col-item col-item-last">Timeframe</span>
                                      <span className="col-item col-item-after"> </span>
                                      {/* <Row>
                                        <Col span={2}><div className="col-item">S/No.</div></Col>
                                        <Col span={8}><div className="col-item">Eligibility Criteria</div></Col>
                                        <Col span={8}><div className="col-item">Values</div></Col>
                                        <Col span={8}><div className="col-item">Timeframe</div></Col>
                                      </Row> */}
                                    </div>
                                  </div>
                                  <div className="sectionPanel">
                                  <EditTable updateCriteria={updateExclusionCriteria} tableIndex={2} 
                                          data={excluDemographicsTableData} defaultActiveKey={excluDefaultActiveKey}
                                          collapsible={excluCollapsible} panelHeader={"Demographics"}/>
                                  <EditTable updateCriteria={updateExclusionCriteria} tableIndex={3} 
                                          data={excluMedConditionTableData} defaultActiveKey={excluDefaultActiveKey}
                                          collapsible={excluCollapsible} panelHeader={"Medical Condition"}/>
                                  <EditTable updateCriteria={updateExclusionCriteria} tableIndex={4} 
                                          data={excluInterventionTableData} defaultActiveKey={excluDefaultActiveKey}
                                          collapsible={excluCollapsible} panelHeader={"Intervention"}/>
                                  <EditTable updateCriteria={updateExclusionCriteria} tableIndex={5} 
                                          data={excluLabTestTableData} defaultActiveKey={excluDefaultActiveKey}
                                          collapsible={excluCollapsible} panelHeader={"Lab / Test"}/>
                                  </div>
                                </div>
                              </div>
                              </div>
                            </Col>
                          </Row>
                        </Col>
                        <Col flex="none">
                          <div style={{ padding: '0 10px' }}></div>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </TabPane>
                <TabPane tab="Enrollment Feasibility" key="3" disabled={collapsible}>
                <Spin spinning={loadPatientFunnel} indicator={<LoadingOutlined style={{ color: "#ca4a04",fontSize: 24 }}/>}>
                <Row>
                    <Col span={4}>
                    </Col>
                    <Col span={16}>
                      <Row style={{ paddingTop: '10px' }}>
                        <Col flex="none">
                          <div style={{ padding: '0 10px' }}></div>
                        </Col>
                        <Col flex="auto" className="enrollment-right-section">
                          {/* <Row style={{paddingTop: 20}}>
                            <Col span={24}>
                              <span className="chart-title">My Protocol</span>
                            </Col>
                          </Row> */}
                          <Row className="enroll-tab">
                            <Col span={7} className={`chart-tab ${activeEnrollmentTabKey === '1' ? 'active' : ''}`} onClick={() => setActiveEnrollmentTabKey('1')}>
                              <Row><Col className="tab-item">
                                <Row className="tab-desc">Patients Eligible&nbsp;
                                  {activeEnrollmentTabKey === '1'?(<CaretRightOutlined />):(<></>)}</Row>
                                <Row className="sub-tab-title">{eliPatient}</Row>
                                <Row className="tab-desc">{rateEliPatient} of Dataset</Row>
                              </Col></Row>
                            </Col>
                            <Col span={1}></Col>
                            <Col span={7} className={`chart-tab ${activeEnrollmentTabKey === '2' ? 'active' : ''}`} onClick={() => setActiveEnrollmentTabKey('2')}>
                              <Row><Col className="tab-item" span={24}>
                                <Row className="tab-desc">Female patients eligible&nbsp;
                                    {activeEnrollmentTabKey === '2'?(<CaretRightOutlined />):(<></>)}</Row>
                                <Row className="sub-tab-title">{rateFeEliPatient}</Row>
                              </Col></Row>
                            </Col>
                            <Col span={1}></Col>
                            <Col span={8} className={`chart-tab ${activeEnrollmentTabKey === '3' ? 'active' : ''}`} onClick={() => setActiveEnrollmentTabKey('3')}>
                              <Row><Col className="tab-item chart" span={24}>
                                <Row className="tab-desc">Race & Ethnicity&nbsp;
                                    {activeEnrollmentTabKey === '3'?(<CaretRightOutlined />):(<></>)}</Row>
                                <Row><Col span={24} className="legend-wrapper-father">
                                  <ReactECharts option={raceOption} style={{ height: 100}}></ReactECharts>
                                  
                                  {/* finalEthnicityData */}
                                  <div className="my-legend-wrapper">
                                    {finalEthnicityData
                                      .sort((a, b) => {
                                        return b.value - a.value;
                                      })
                                      .slice(0, 9)
                                      .map((d, idx) => {
                                        const chartData = finalEthnicityData;
                                        function getChartData(name,p) {
                                          let data = raceOption.series[0].data;
                                          let total = 0
                                          for(const d in data){
                                            total += data[d].value
                                          }
                                          for (let i = 0, l = data.length; i < l; i++) {
                                              if (data[i].name == name) {
                                                if(data[i].value >0){
                                                  const p = (data[i].value/total * 100).toFixed(2)
                                                  if (name === "BLACK/AFRICAN AMERICAN") {
                                                    name = "BLACK/AFRICAN..."
                                                  } else if (name === "AMERICAN INDIAN/ALASKA NATIVE") {
                                                    name = "AMERICAN INDIA..."
                                                  } else if (name === "NATIVE HAWAIIAN/OTHER PACIFIC ISLANDER") {
                                                    name = "NATIVE HAWAIIA..."
                                                  } else if (name ==="MULTI RACE ETHNICITY") {
                                                    name = "MULTI RACE ETH..."
                                                  }
                                                  return name + ' - ' + p + '%';
                                                }else{
                                                  if (name === "BLACK/AFRICAN AMERICAN") {
                                                    name = "BLACK/AFRICAN AM..."
                                                  } else if (name === "AMERICAN INDIAN/ALASKA NATIVE") {
                                                    name = "AMERICAN INDIAN/..."
                                                  } else if (name === "NATIVE HAWAIIAN/OTHER PACIFIC ISLANDER") {
                                                    name = "NATIVE HAWAIIAN/..."
                                                  } else if (name ==="MULTI RACE ETHNICITY") {
                                                    name = "MULTI RACE ETHNI..."
                                                  }
                                                  return name + ' - 0'
                                                }
                                              }
                                          }
                                        }
                                        const sum = chartData.reduce(
                                          (accumulator, currentValue) => {
                                            return accumulator + currentValue.value;
                                          },
                                          0
                                        );
                                        let percent = ((d.value / sum) * 100).toFixed(2);
                                        return (
                                          <div className="custom-legend" key={d.name+idx} onClick={()=>onClickLegend(d.name, d.percent)}>
                                            <span
                                              className="my_legend"
                                              style={{
                                                backgroundColor: colorList[d.name],
                                              }}
                                            ></span>
                                            <i className={"my_legend_text" + (d.selected ? " active": "")}>{getChartData(d.name,percent)}</i>
                                          </div>
                                        );
                                      })}
                                  </div>
                                  </Col></Row>
                              </Col></Row>
                            </Col>
                          </Row>
                          <Row>
                            <Col span={24} className="result-chart" style={{height:"100%"}}>
                              {activeEnrollmentTabKey === '1' && (
                                <>
                                  <div style={{fontWeight:600, fontSize:18, textAlign:"left", marginTop: 15, marginLeft: 20, marginBottom: 10}}>{eliPatientChartTitle||""}</div>

                                  <div className="chartArea" style={{position:"relative", width: "100%", height: funnelChartheight+49, overflow:"hidden", marginBottom: 15}}>
                                    <div className="upperChart" >
                                      <div className="title">
                                        <span className="caption">
                                          <span className="line line-l"></span>
                                          Inclusion Criteria
                                          <span className="line line-r"></span>
                                        </span>
                                      </div>
                                      <ReactECharts option={eliPatientOption} style={{ height: funnelChartheight, marginBottom: 15}}></ReactECharts>
                                    </div>
                                    <div className="belowChart" style={{position:"absolute", left: 0, top: funnelChartheightOverlap+25, backgroundColor:"#fff",width: "100%", height:funnelChartheight+39, overflow:"hidden"}}>
                                      <div className="title">
                                        <span className="caption">
                                          <span className="line line-l"></span>
                                          Exclusion Criteria   
                                          <span className="line line-r"></span>
                                        </span>
                                      </div>
                                      <ReactECharts option={eliPatientOption} style={{ position:"absolute", left: 0, top: -funnelChartheightOverlap+24, width: "100%",height: funnelChartheight, marginBottom: 15, }}></ReactECharts>
                                    </div>
                                  </div>
                                </>
                              )}
                              {activeEnrollmentTabKey === '2' && (
                                <>
                                  <div style={{fontWeight:600, fontSize:18, textAlign:"left", marginTop: 15, marginLeft: 20, marginBottom: 10}}>{fePatientChartTitle||""}</div>
                                  <div className="chartArea" style={{position:"relative", width: "100%", height: funnelChartheight+49, overflow:"hidden", marginBottom: 15}}>
                                    <div className="upperChart">
                                      <div className="title">
                                        <span className="caption">
                                          <span className="line line-l"></span>
                                          Inclusion Criteria
                                          <span className="line line-r"></span>
                                        </span>
                                      </div>
                                      <ReactECharts option={fePatientOption} style={{ height: funnelChartheight, marginBottom: 15}}></ReactECharts>
                                    </div>
                                    <div className="belowChart" style={{position:"absolute", left: 0, top: funnelChartheightOverlap+25, backgroundColor:"#fff",width: "100%", height:funnelChartheight+39, overflow:"hidden"}}>
                                      <div className="title">
                                        <span className="caption">
                                          <span className="line line-l"></span>
                                          Exclusion Criteria   <span className="line line-r"></span>
                                        </span>
                                      </div>
                                      <ReactECharts option={fePatientOption} style={{ position:"absolute", left: 0, top: -funnelChartheightOverlap+24, width: "100%",height: funnelChartheight, marginBottom: 15, }}></ReactECharts>
                                    </div>
                                  </div>
                                </>
                              )}
                              {activeEnrollmentTabKey === '3' && (
                                <>
                                  <div style={{fontWeight:600, fontSize:18, textAlign:"left", marginTop: 15, marginLeft: 20, marginBottom: 10}}>{ethPatientChartTitle||""}</div>
                                  <div className="chartArea" style={{position:"relative", width: "100%", height: funnelChartheight+49, overflow:"hidden", marginBottom: 15}}>
                                    <div className="upperChart">
                                      <div className="title">
                                        <span className="caption">
                                          <span className="line line-l"></span>
                                          Inclusion Criteria
                                          <span className="line line-r"></span>
                                        </span>
                                      </div>
                                      <ReactECharts option={ethPatientOption} style={{ height: funnelChartheight, marginBottom: 15}} ref={eChartsRef}></ReactECharts>
                                    </div>
                                    <div className="belowChart" style={{position:"absolute", left: 0, top: funnelChartheightOverlap+25, backgroundColor:"#fff",width: "100%", height:funnelChartheight+39, overflow:"hidden"}}>
                                      <div className="title">
                                        <span className="caption">
                                          <span className="line line-l"></span>
                                          Exclusion Criteria   <span className="line line-r"></span>
                                        </span>
                                      </div>
                                      <ReactECharts option={ethPatientOption} style={{ position:"absolute", left: 0, top: -funnelChartheightOverlap+24, width: "100%",height: funnelChartheight, marginBottom: 15, }} ref={eChartsBelowRef}></ReactECharts>
                                  </div>
                                  </div>
                                </>
                              )}
                            </Col>
                          </Row>
                        </Col>
                        <Col flex="none">
                          <div style={{ padding: '0 10px' }}></div>
                        </Col>
                      </Row>
                    </Col>
                    <Col span={4}></Col>
                  </Row>
                  </Spin>
                </TabPane>
              </Tabs>
            </div>
          </div>
          } 
          {processStep === 1 && 
          <div className="endpoint-container">
            <div className="process-container">
              <span className="action-title" onClick={()=>props.history.push({pathname: '/trials', state: {trial_id: props.location.state.trial_id}})}>
                  <LeftOutlined style={{color:"#000000"}}/> &nbsp;<MenuOutlined style={{color:"#000000"}}/>
              </span>
              <span className="content-title">
                  <span className="tab-title">Protocol Endpoint</span>
                  <span className="tip1-desc">
                  Use the historical trial library on the left to build the endpoint criteria for your trial scenario.
                  </span>
              </span>
              <span className="button-area">
                <Dropdown.Button style={{zIndex: 1}}
                overlay={
                  <Menu>
                    <Menu.Item key="pdf" onClick={() => handleEndpointExport('pdf')}>PDF</Menu.Item>
                    <Menu.Item key="csv" onClick={() => handleEndpointExport('csv')}>CSV</Menu.Item>
                  </Menu>
                }
                  icon={<DownOutlined />}>
                  {/* <DownloadOutlined /> */}
                  EXPORT AS
                </Dropdown.Button>
                {/* <Button className="save-btn"  onClick={saveEndpoint}>
                    Save And Finish Later
                </Button> */}
                {/* <Button type="primary" className="submit-btn"  onClick={()=> setSubmitType(2)}> */}
                <Button type="primary" className="submit-btn"   onClick={submitEndpoint}>
                    Submit
                </Button>
              </span>
            </div>
            <div className="endpoint-content">
              <br/>
              <br/>
            </div>
          </div>
          }
           { processStep === 2 &&
          <div className="soa-container">
            <div className="process-container">
              <span className="action-title" onClick={()=>props.history.push({pathname: '/trials', state: {trial_id: props.location.state.trial_id}})}>
                  <LeftOutlined style={{color:"#000000"}}/> &nbsp;<MenuOutlined style={{color:"#000000"}}/>
              </span>
              <span className="content-title">
                  <span className="tab-title">Schedule of Events</span>
                  <span className="tip1-desc">
                  Use the historical event library on the left to build the Schedule of Events.
                  </span>
              </span>
              <span className="button-area">
                <Dropdown.Button style={{zIndex: 1}}
                overlay={
                  <Menu>
                    <Menu.Item key="csv" onClick={handleSOAExportClick}>CSV</Menu.Item>
                  </Menu>
                }
                  icon={<DownOutlined />}>
                  {/* <DownloadOutlined /> */}
                  EXPORT AS
                </Dropdown.Button>
                {/* <Button className="save-btn"  onClick={()=> setSubmitType(1)}>
                    Save And Finish Later
                </Button> */}
                <Button type="primary" className="submit-btn"  onClick={()=> setSubmitType(2)}>
                    Submit
                </Button>
              </span>
            </div>
            <ScheduleEvents record={trialRecord} submitType={submitType} scenarioId={scenarioId} handleGoBack={handleGoBack} handleSOAExport={handleSOAExport} history={props.history} setVisibleSOA={showSOAModal} getTrialById={getTrialById}/>
          </div>
          }
        </div>
      </Spin>
      <Drawer title="Historical Trial List" placement="right" onClose={handleCancel} visible={showHistorical}>
        <Spin spinning={spinning} indicator={<LoadingOutlined style={{ color: "#ca4a04",fontSize: 24 }}/>} >
        <Row>
            <Col span={24} style={{paddingBottom: '10px'}}>
              {visibleSOA ? (
                <Button type="primary" onClick={downloadSOA} style={{float: 'right'}}>VIEW SOURCE</Button>
              ) : (
                <>
                  <Button type="primary" onClick={downloadIE} style={{float: 'right'}}>VIEW SOURCE</Button>
                  <Button onClick={downloadAverage} style={{float: 'right', marginRight: '15px', color: '#ca4a04'}}><span style={{color: '#ca4a04'}}>VIEW AVERAGE</span></Button>
                </>
              )}
            </Col>
        </Row>
        <Row>
            <Col span={24}><SelectableTable dataList={historicalTrialdata} /></Col>
        </Row>
        </Spin>
      </Drawer>
    </div>
      
    );
    
}


export default withRouter(memo(ScenarioPage));