import React, { useState, useEffect,useReducer } from "react";
import { Button, Collapse, Select, Input, Popconfirm, Radio,Space,message, Tooltip} from "antd";
import { withRouter } from 'react-router';
import { 
  CheckCircleFilled, 
  CheckCircleTwoTone,
  CaretUpOutlined,
  CaretDownOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  CloseCircleOutlined
} from "@ant-design/icons";
import "./index.scss";
import telehealth_icon from '../../assets/fax.svg';
import patient_at_home_icon from '../../assets/home.svg';
import hospital_icon from '../../assets/hospital.svg';
import mobile_health_icon from '../../assets/mobile.svg';
import pharmacy_icon from '../../assets/medical.svg';

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

export const modality_options =[
  {
    key:"patient_at_home",
    name: "Patient at home",
    icon: patient_at_home_icon,
    color:'#E1619C'
  },
  {
    key:"telehealth",
    name: "Telehealth",
    icon: telehealth_icon,
    color:'#2EBCAF'
  },
  {
    key:"mobile_health",
    name: "Mobile health",
    icon: mobile_health_icon,
    color:'#CA4A03'
  },
  {
    key:"pharmacy",
    name: "Pharmacy",
    icon: pharmacy_icon,
    color:'#BBECA1'
  },
  {
    key:"hospital",
    name:  "Hospital",
    icon:hospital_icon,
    color:'#4B8FE2'
  }
]

const EventList = (props) => {
  const { visitNumber, weekNumber } = props.numbers;
  const trialEndpoints=props.endpoints
  const viewOnly = props.viewOnly ||false;
  const [sort,setSort] = useState("")
  const [weeks, setWeeks] = useState([])
  const [visits, setVisits] = useState([])
  const [weeksFlex, setWeeksFlex] = useState(1)
  const [visitsFlex, setVisitsFlex] = useState(1)
  const [expandKeys, setExpandKeys] = useState([])
  let [labs, setLabs] = useState(props.labs||[]);
  let [examination, setExamination] = useState(props.examination||[])
  let [procedures, setProcedures] = useState(props.procedures||[])
  let [questionnaire, setQuestionnaire] = useState(props.questionnaire||[])
  let [studyProcedures, setStudyProcedures] = useState(props.studyProcedures||[])
  const [currentModality, setCurrentModality] = useState('')
  
  const [rowModality, setRowModality] =  useReducer(
    (state, newState) => ({ ...state, ...newState }),
    {}
  );
  const [columnModality, setColumnModality] =  useReducer(
    (state, newState) => ({ ...state, ...newState }),
    {}
  );

  useEffect( ()=>{
    const expandKeysTmp = expandKeys.slice(0)
    if (props.labs && props.labs.length>0) expandKeysTmp.push('1')
    if (props.examination && props.examination.length>0) expandKeysTmp.push('2')
    if (props.procedures && props.procedures.length>0) expandKeysTmp.push('3')
    if (props.questionnaire && props.questionnaire.length>0) expandKeysTmp.push('4')
    if (props.studyProcedures && props.studyProcedures.length>0) expandKeysTmp.push('5')
    setExpandKeys(expandKeysTmp)

  },[props.labs, props.examination, props.procedures,props.questionnaire,props.studyProcedures])

  useEffect(() => {
    if(props.viewOnly) setExpandKeys(['1','2','3','4','5'])
  }, [props.viewOnly])

  useEffect(() => {
    setWeeks(props.weeks)
    setWeeksFlex(1/(props.weeks.length+1))
    getVisits()
  }, [visitNumber,weekNumber])

  useEffect(()=>{
    setWeeks(props.weeks)
    setWeeksFlex(1/(props.weeks.length+1))
    updateCondition()
  },[props.weeks])

  const getCondition = (category) =>{
    let tmpCategory = [category].slice(0)[0];

    tmpCategory.forEach((ele) => {
      if(!ele.condition || ele.condition.length==0||ele.condition.length!=visitNumber){
        let condition = [];
        visits.forEach((e, idx) => {
          condition.push({
            visits: e,
            weeks:weeks[idx],
            modality:ele.condition.length >= e ? ele.condition[e-1].modality : ''
          });
        });
        const totalVisit = condition.filter(e=>e.modality && e.modality!=="").length
        ele.condition = condition;
        ele.totalVisit = totalVisit;
      }
    });
    return tmpCategory
  }

  const updateCondition = () =>{
    let tmpLabs = resetCondition(labs)
    let tmpExamination =resetCondition(examination)
    let tmpProcedures = resetCondition(procedures)
    let tmpQuestionnaire =resetCondition(questionnaire)
    let tmpStudyProcedures =  resetCondition(studyProcedures)

    setLabs(tmpLabs);
    setExamination(tmpExamination);
    setProcedures(tmpProcedures);
    setQuestionnaire(tmpQuestionnaire);
    setStudyProcedures(tmpStudyProcedures);
  }

  const resetCondition = (category) =>{
    let tmpCategory = [category].slice(0)[0];

    tmpCategory.forEach((ele) => {
        let condition = [];
        for(let e = 1; e <= visitNumber; e ++){
          condition.push({
            visits: e,
            weeks:weeks[e-1],
            modality: ele.condition.length >= e ? ele.condition[e-1].modality : '',
          });
        }
        const totalVisit = condition.filter(e=>e.modality&&e.modality!=="").length
        ele.condition = condition;
        ele.totalVisit = totalVisit;
    });
    return tmpCategory
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
          modality:""

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
    props.handleEventChange()
  }

  const toggleChecked = (evt, idx) => {
    const { Categories, condition } = evt;
    const tmpCon = condition.slice(0);
    tmpCon[idx].checked = !tmpCon[idx].checked;
    const totalVisitTmp = condition.filter(c => c.checked).length
    switch (Categories) {
      case LABS:     
        const tmpLabs = labs.slice(0);
        const targetLab = tmpLabs.find(
          (ele) => ele["Standard Event"] == evt["Standard Event"]
        )
        targetLab.condition = tmpCon;
        targetLab.totalVisit = totalVisitTmp
        setLabs(tmpLabs);
        break;
      
      case PHYSICAL_EXAMINATION:       
        const tmpExamination = examination.slice(0);
        const targetEaxm = tmpExamination.find(
          (ele) => ele["Standard Event"] == evt["Standard Event"]
        )
        targetEaxm.condition = tmpCon;
        targetEaxm.totalVisit = totalVisitTmp
        setExamination(tmpExamination);
        break;
      
      case PROCEDURES:       
        const tmpProcedures= procedures.slice(0);
        const targetProcedure = tmpProcedures.find(
          (ele) => ele["Standard Event"] == evt["Standard Event"]
        )
        targetProcedure.condition = tmpCon;
        targetProcedure.totalVisit = totalVisitTmp
        setProcedures(tmpProcedures);
        break;
      
       case QUESTIONNAIRES:       
        const tmpQuestionnaire= questionnaire.slice(0);
        const targetQuestionnaire = tmpQuestionnaire.find(
          (ele) => ele["Standard Event"] == evt["Standard Event"]
        )
        targetQuestionnaire.condition = tmpCon;
        targetQuestionnaire.totalVisit = totalVisitTmp
        setQuestionnaire(tmpQuestionnaire);
        break;
      
       case STUDY_PROCEDURES:       
        const tmpStudyProcedures= studyProcedures.slice(0);
        const targetStudyProcedure=tmpStudyProcedures.find(
          (ele) => ele["Standard Event"] == evt["Standard Event"]
        )
        targetStudyProcedure.condition = tmpCon;
        targetStudyProcedure.totalVisit = totalVisitTmp
        setStudyProcedures(tmpStudyProcedures);
        break;
      
      default:
    }
    props.handleEventChange()
  };

  const updateAllCategories = (condition, Categories,evt, tmpCon) =>{

    const totalVisitTmp = condition.filter(c => c.modality && c.modality!=="").length
    switch (Categories) {
      case LABS:    
        const tmpLabs = labs.slice(0);
        const targetLab = tmpLabs.find(
          (ele) => ele["Standard Event"] == evt["Standard Event"]
        )
        targetLab.condition = tmpCon;
        targetLab.totalVisit = totalVisitTmp
        setLabs(tmpLabs);
        break;
      
      case PHYSICAL_EXAMINATION:       
        const tmpExamination = examination.slice(0);
        const targetEaxm = tmpExamination.find(
          (ele) => ele["Standard Event"] == evt["Standard Event"]
        )
        targetEaxm.condition = tmpCon;
        targetEaxm.totalVisit = totalVisitTmp
        setExamination(tmpExamination);
        break;
      
      case PROCEDURES:       
        const tmpProcedures= procedures.slice(0);
        const targetProcedure = tmpProcedures.find(
          (ele) => ele["Standard Event"] == evt["Standard Event"]
        )
        targetProcedure.condition = tmpCon;
        targetProcedure.totalVisit = totalVisitTmp
        setProcedures(tmpProcedures);
        break;
      
       case QUESTIONNAIRES:       
        const tmpQuestionnaire= questionnaire.slice(0);
        const targetQuestionnaire = tmpQuestionnaire.find(
          (ele) => ele["Standard Event"] == evt["Standard Event"]
        )
        targetQuestionnaire.condition = tmpCon;
        targetQuestionnaire.totalVisit = totalVisitTmp
        setQuestionnaire(tmpQuestionnaire);
        break;
      
       case STUDY_PROCEDURES:       
        const tmpStudyProcedures= studyProcedures.slice(0);
        const targetStudyProcedure=tmpStudyProcedures.find(
          (ele) => ele["Standard Event"] == evt["Standard Event"]
        )
        targetStudyProcedure.condition = tmpCon;
        targetStudyProcedure.totalVisit = totalVisitTmp
        setStudyProcedures(tmpStudyProcedures);
        break; 
      default:
    }

  }

  const onModalityChange = (e,evt, idx) => {
    const { Categories, condition } = evt;
    let tmpCon = condition.slice(0);

    setCurrentModality(e.target.value) 
    tmpCon[idx].modality = e.target.value
    updateAllCategories(condition, Categories,evt, tmpCon)
  };

  const renderVisit = () => {
    let visits = [];
    for (var i = 1; i <= visitNumber; i++) {
      visits.push(<div className="td" key={i}>{i}</div>);
    }
    return <>{visits}</>;
  };


  const getVisits = () =>{
    let visitArr = [];
    for (let i = 0; i <= visitNumber-1; i++) {
      visitArr.push(i+1)
    }
    setVisits(visitArr)
    setVisitsFlex(visitArr.length/(visitArr.length+1))
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
         <Option value="No endpoint">No Endpoint</Option>
        {Object.keys(trialEndpoints).map((k, idx) => {
          return (
            <>
              <Option value={k} key={idx} disabled>
                {k}
              </Option>
              {trialEndpoints[k].map((endpoint, i) => {
                return (
                  <Option value={endpoint} key={i}>
                    {endpoint}
                  </Option>
                );
              })}
            </>
          );
        })}
      </Select>
    );
  };

  const onWeekChange = (e,idx) => {
    const tmpWeeks = weeks.slice(0)
    tmpWeeks[idx] = Number(e.target.value)
    setWeeks(tmpWeeks)
    setWeeksFlex(1/(tmpWeeks.length+1))
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
          "Custom":true,
          "totalVisit":0,
          "soaWeights": [0,0,0,0,0,0,0,0,0,0],
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
          "Custom":true,
          "totalVisit":0,
          "soaWeights": [0,0,0,0,0,0,0,0,0,0],
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
          "Custom":true,
          "totalVisit":0,
          "soaWeights": [0,0,0,0,0,0,0,0,0,0],
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
          "Custom":true,
          "totalVisit":0,
          "soaWeights": [0,0,0,0,0,0,0,0,0,0],
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
          "Custom":true,
          "totalVisit":0,
          "soaWeights": [0,0,0,0,0,0,0,0,0,0],
        })
        setStudyProcedures(temp)
        break;
        default:
        
      }
      expandPanel = Array.from(new Set(expandPanel))
      setExpandKeys(expandPanel)
      props.handleEventChange()
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
      props.handleEventChange()
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
      props.handleEventChange()
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
      "Visits": visits.length,
      "WeekNumber": weeks[weeks.length-1]
      
    }
    props.saveEvents(scheduleOfEvents)
  }


  function callback(key) {
    setExpandKeys(key)
  }

  const onColumnModalityChange =(e,idx)=>{
    setColumnModality({ [idx]: e.target.value})
  }

  const getAvaliableModalityNames = (modality) =>{
    let avaliableModalityNames=modality.map( (m,idx)=>{
      return {[modality_options[idx].name]:m}
    })
    .filter(ele=>Object.values(ele)[0]!==0 ) //0 means not avaliable
    .map( item=>Object.keys(item)[0])
    return avaliableModalityNames
  }

  const updateColumnModality = (tmpCategories, columnId, isOptimized=false, descModality=[]) =>{
 
    tmpCategories.forEach( e=>{
      const condition= e.condition
      let avaliableModalityNames = getAvaliableModalityNames(e.modality)
      if(isOptimized&& Boolean(condition[columnId].modality)){
        // if the most common modality is not avaliable for this event, then use second common one...
        for(let i=0; i<descModality.length; i++){
          if(avaliableModalityNames.indexOf(descModality[i])>-1){
            condition[columnId].modality=descModality[i]
            break;
          }
        }       
      }
      if(!isOptimized&& Boolean(condition[columnId].modality)) {
        // only if the selected modality is one of its avaliable modalities.      
       if(avaliableModalityNames.indexOf(columnModality[columnId])>-1) condition[columnId].modality=columnModality[columnId]   
      } 
    })
    return tmpCategories
  }

  const onApplyToColumn=(idx)=>{
    let tmpLabs = labs.slice(0);  
    tmpLabs = updateColumnModality(tmpLabs,idx)
    setLabs(tmpLabs)
  
    let tmpExamination = examination.slice(0); 
    tmpExamination =updateColumnModality(tmpExamination,idx)
    setExamination(tmpExamination)      
    
    let tmpProcedures = procedures.slice(0);
    tmpProcedures =updateColumnModality(tmpProcedures,idx)
    setProcedures(tmpProcedures )       
      
    let tmpQuestionnaire = questionnaire.slice(0);  
    tmpQuestionnaire =updateColumnModality(tmpQuestionnaire,idx)
    setQuestionnaire(tmpQuestionnaire)    
  
    let tmpStudyProcedures = studyProcedures.slice(0); 
    tmpStudyProcedures =updateColumnModality(tmpStudyProcedures,idx)
    setStudyProcedures(tmpStudyProcedures)    
    props.handleEventChange()
    
  }

  const onOptimize=(idx)=>{
    // select the most commom modality across the visit.
    setColumnModality({
      [idx]:""
    })
    const modalityCollection={}
    const modalitySummary={}
    const columnConditionCollection = []
    labs.forEach( ele=>{
      columnConditionCollection.push( ele.condition[idx])
    }) 
    examination.forEach( ele=>{
      columnConditionCollection.push( ele.condition[idx])
    })
    procedures.forEach( ele=>{
      columnConditionCollection.push( ele.condition[idx])
    })
    questionnaire.forEach( ele=>{
      columnConditionCollection.push( ele.condition[idx])
    })
    studyProcedures.forEach( ele=>{
      columnConditionCollection.push( ele.condition[idx])
    })
    
    columnConditionCollection.filter(element=>element.modality&&element.modality!=="")
    .forEach( element=>{
    if( Object.keys(modalityCollection).indexOf(element.modality)<0 ){
      modalityCollection[element.modality]=[element]
    }else{
      modalityCollection[element.modality].push(element)
    }
    console.log("modalityCollection",modalityCollection);
    
    modality_options.forEach( option=>{
      if(Object.keys(modalityCollection).indexOf(option.name)==-1){
        modalitySummary[option.name]=0
      }else{
        modalitySummary[option.name]=modalityCollection[option.name].length
      }
    })
    //find the modality with most number
    const descModality = Object.keys(modalitySummary)
    descModality.sort( (a,b)=>{
      return modalitySummary[b] - modalitySummary[a]
    })
   
    // fill the blank
    let tmpLabs = {};  
    tmpLabs=updateColumnModality(JSON.parse(JSON.stringify(labs)),idx,true,descModality)
    setLabs(tmpLabs)

    let tmpExamination = {}; 
    tmpExamination =updateColumnModality(JSON.parse(JSON.stringify(examination)),idx,true,descModality)
    setExamination(tmpExamination)      
    
    let tmpProcedures = {};
    tmpProcedures =updateColumnModality(JSON.parse(JSON.stringify(procedures)),idx,true,descModality)
    setProcedures(tmpProcedures )       
      
    let tmpQuestionnaire = {};  
    tmpQuestionnaire =updateColumnModality(JSON.parse(JSON.stringify(questionnaire)),idx,true,descModality)
    setQuestionnaire(tmpQuestionnaire)    
  
    let tmpStudyProcedures = {}; 
    tmpStudyProcedures =updateColumnModality(JSON.parse(JSON.stringify(studyProcedures)),idx,true,descModality)
    setStudyProcedures(tmpStudyProcedures) 
  })
  }
  
  const onRowModalityChange =(e,evt)=>{
    setRowModality({ [evt["Standard Event"]]: e.target.value})
  }
  const onApplyToRow = (evt,fillAll=false) =>{
    const { Categories, condition } = evt;
    let tmpCon = condition.slice(0);
    tmpCon.forEach(element => {
      if(fillAll){    
        element.modality= rowModality[evt["Standard Event"]]
      }else{
        element.modality= Boolean(element.modality)?rowModality[evt["Standard Event"]]:''
      }      
    });
    updateAllCategories(condition, Categories,evt, tmpCon)
    props.handleEventChange()
  }

  const insertCondition=(category,idx)=>{
    category.forEach(cat=>{
      const tempCondition=cat.condition.slice(0)
      tempCondition.splice(idx+1,0,{visits:idx+2, weeks:'', modality:''})
      tempCondition.map( (c,i)=>c.visits=i+1)
      cat.condition=tempCondition
    })
    return category
  }
  
  const insertColumn=((idx)=>{
    // update visits
    const temp = visits.slice(0)
    temp.push(visits.length+1)
    setVisits(temp)
    setVisitsFlex(temp.length/(temp.length+1))
    // update weeks
    const newWeeks = weeks.slice(0)
    newWeeks.splice(idx+1,0,'')
    setWeeks(newWeeks)
    setWeeksFlex(1/(newWeeks.length+1))
    // update all conditions
    setLabs(  insertCondition(labs,idx) )
    setExamination(insertCondition(examination,idx))
    setProcedures( insertCondition(procedures,idx))
    setQuestionnaire( insertCondition(questionnaire,idx))
    setProcedures( insertCondition(procedures,idx))
    setStudyProcedures( insertCondition(studyProcedures,idx))
  })
  

  const ModalityList = (props) =>{
  const {category,evt,idx,value,rowModality,columnModality,event} = props
    return(
      <div className="modality-list-container">
        <CloseCircleOutlined />
        <Radio.Group 
        onChange={props.isRowBatch?(e)=>onRowModalityChange(e,evt): props.isColumnBatch?(e)=>onColumnModalityChange(e,idx): (e)=>onModalityChange(e,evt,idx)} 
        value={props.isRowBatch?rowModality[evt['Standard Event']]: props.isColumnBatch?  (columnModality[idx]?columnModality[idx]:"") :value}        
        >
        <Space direction="vertical">  
        {modality_options.map( (m,idx)=>{
          return(
            <div className="modality-item" key={idx}>
              <Radio value={m.name} disabled={evt?.modality&&evt.modality[idx]==0?true:false}> <img src={m.icon} alt=""/> {m.name}</Radio>      
            </div>
          )
        })}
        </Space>
      </Radio.Group>  
      {
        props.isColumnBatch&&(
          <div className="action-group">  
            <div className="whole action" onClick={()=>onApplyToColumn(idx)}>Apply to this column</div>  
            <div className="batch action" onClick={()=>onOptimize(idx)}>Optimize to Align</div>
            <div className="insert-column action" onClick={()=>insertColumn(idx)}>Add Visit After</div> 
          </div>
        )
      }    
      {
        props.isRowBatch && (
        <div className="action-group">  
          <div className="whole action" onClick={()=>onApplyToRow(evt)}>Apply to this Row</div>  
          <div className="batch action" onClick={()=>onApplyToRow(evt,true)}>Fill Row with Selection</div>
        </div>
        )
      }
      </div>
    )
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

      <div className="event-dashboard" style={{overflowX:"scroll"}}>
        <div className="dashboard-head">
          <div className="event-list-head">
            <div className="head-row" style={{position:"relative"}}>
              <div className="colunm-row e-row" style={{position:"absolute",left:"0",top:"0",width:"634px",height:"100%"}}></div>
              <div className="visit-row e-row number" style={{paddingLeft:"634px"}}>
                <div className="colunm td">Visits</div>
                {
                  visits.map((v)=>{
                    return <div className="td num-cell" key={v}>{v}</div>
                  })
                }
              </div>
            </div>

            <div className="head-row" style={{position:"relative"}}>
              <div className="colunm-row week-row e-row" style={{position:"absolute",left:"0",top:"0",width:"634px",height:"100%"}}>
                <div className="f-2-new" style={{width:"233px", height:"100%",}}>My Events</div>
                <div className="f-3" style={{width:"236.8px", height:"100%",}}>Trial Endpoint</div>
                <div className="f-1-small sortable-item" style={{width:"110.8px", height:"100%",}}>Cost/patient  
                  <span className="sort-icon-wrapper">
                      <CaretUpOutlined onClick={() => setSort("ascend")}  style={{color:sort=="ascend"?"#ca4a04":"rgb(85,85,85)"}}/>
                      <CaretDownOutlined onClick={ ()=>setSort("descend")} style={{color:sort=="descend"?"#ca4a04":"rgb(85,85,85)"}}/>
                  </span>
                </div>
                <div className="f-2-small" style={{width:"56.4px", height:"100%",}}>Total Visits</div>
              </div>
              <div className="head-bottom-container" style={{paddingLeft:"634px"}}>
                <div className="e-row number">
                  <div className="colunm td row-title" style={{flex:weeksFlex}}>Weeks</div>
                  <div className="week-row-wrapper" style={{flex:visitsFlex}}>
                    <div className="weeks-container">              
                    {
                      weeks.map((week, idx) => {
                        return viewOnly?
                          <span className="td num-cell" key={`week_span_${idx}`}>{week}</span>: 
                          <Input className="td cell-input" key={`week_${idx}`} value={week} onChange={(e)=>onWeekChange(e,idx)} />                  
                      })
                    }               
                  </div>      
                  <div className="column-action-container">              
                  {
                    visits.map( (visit,idx)=>{
                      return(
                        <div className="td num-cell" key={idx}>
                          <Tooltip                        
                            title={
                              <ModalityList
                              idx={idx}                           
                              isColumnBatch={true}                           
                              columnModality={columnModality} 
                              insertColumn={insertColumn}
                              />
                          }
                        color="#ffffff"                    
                        >
                        <PlusCircleOutlined /> 
                        </Tooltip> 
                        </div>                 
                      )
                    })
                  }                    
                </div>  
                </div>          
                </div>
              </div>          
            </div>
          </div>
        </div>
        <Collapse className="clearfix" defaultActiveKey={["1"]} activeKey={expandKeys}  onChange={callback}>
          <Panel
            className="collapse-container clearfix"
            forceRender={true}
            header={
              <div className="event-panel-head">
                <div className="event-title e-row">
                  <div className="name">
                    <span style={{width: "186px", display:"inline-block"}}>
                      {`${LABS} (${labs.length})`} 
                    </span>
                    
                    {!viewOnly&&<span className="add-event" onClick={(e)=>onAddEvent(e,LABS)}>Add Event</span> } 
                  </div>
                  <div className="cost">
                  $ {getTotalCost(labs)}
                  </div>
                  <div></div>
                </div>
                <div className="event-title-right"></div>
              </div>
            }
            key="1"
          >
            <div className="shedule-of-event-panel-body">
              {labs.sort((a, b) => {
                return onSort(a,b)
                })
                .map((evt, idx) => {
                return (
                  <div className="event-item" key={`labs_${idx}`}>
                    <div className="events-wrapper e-row">
                      <div className={`${evt.Custom?"custom-event ":""}my-event-td td f-3`}>                      
                        {
                          viewOnly?evt["Standard Event"]:(
                            <>
                            {
                              !evt.Custom?(
                                <Tooltip title={evt["Standard Event"]}>
                                  {evt["Standard Event"]}
                                </Tooltip>
                              ):(
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
                      <div className="cost-td td f-2-small">
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
                      <div className="visits-td td f-1-small">{evt.totalVisit}</div>
                    </div>
                    <div className="status-row e-row">
                      <div className="colunm td">
                      <Tooltip  
                        title={<ModalityList evt={evt}   category={LABS} isRowBatch={true} rowModality={rowModality}/>}
                        color="#ffffff"                     
                        >
                         <PlusCircleOutlined /> 
                        </Tooltip> 

                      </div>                   
                        {evt.condition.length > 0 &&
                          evt.condition.map((con, idx) => {
                            const targetItem =modality_options.find(m=>m.name==con.modality)   
                            return (
                              <div className="td" key={`labs_event_${idx}`}>
                                <span
                                  className={`${viewOnly?'viewOnly':''} incon-wrapper`}
                                >
                                   <Tooltip  
                                  title={<ModalityList evt={evt} idx={idx} value={con.modality}/>}                              
                                  color="#ffffff"                                                          
                                  >
                                 {Boolean(con.modality)?<img src={targetItem.icon}/>: <PlusCircleOutlined /> } 
                                 </Tooltip>  
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
            className="collapse-container"
            forceRender={true}
            header={
              <div className="event-panel-head">
                <div className="event-title e-row">
                  <div className="name">
                    <span style={{width: "186px", display:"inline-block"}}>
                      {`${PHYSICAL_EXAMINATION} (${examination.length})`}
                    </span>
                     {!viewOnly&&<span className="add-event" onClick={(e)=>onAddEvent(e,PHYSICAL_EXAMINATION)}>Add Event</span> }
                  </div>
                  <div className="cost">
                    $ {getTotalCost(examination)}
                  </div> 
                  <div></div>           
                </div>
                <div className="event-title-right"></div>
              </div>
            }
            key="2"
          >
            <div className="shedule-of-event-panel-body">
              {examination.sort((a, b) => {
                return onSort(a,b)
                })
                .map((evt, idx) => {
                return (
                  <div className="event-item" key={`exam_${idx}`}>
                    <div className="events-wrapper e-row">
                      <div className={`${evt.Custom?"custom-event":""} my-event-td td f-3`}>
                        {
                          viewOnly?evt["Standard Event"]:(
                            <>
                            {
                              !evt.Custom?(
                                <Tooltip title={evt["Standard Event"]}>
                                  {evt["Standard Event"]}
                                </Tooltip>
                              ):(
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
                      <div className="cost-td td f-2-small">
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
                      <div className="visits-td td f-1-small">{evt.totalVisit}</div>
                    </div>
                    <div className="status-row e-row">
                      <div className="colunm td">
                      <Tooltip  
                        title={<ModalityList evt={evt}  category={PHYSICAL_EXAMINATION} isRowBatch={true} rowModality={rowModality}/>}
                        color="#ffffff"  
                        // visible={true}                        
                        >
                         <PlusCircleOutlined /> 
                        </Tooltip> 

                      </div>
                      {/* {evt.condition.length > 0 &&
                        evt.condition.map((con, idx) => {
                          return (
                            <div className="td" key={`exam_event_${idx}`}>
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
                        })} */}
                        {evt.condition.length > 0 &&
                          evt.condition.map((con, idx) => {
                          const targetItem =modality_options.find(m=>m.name==con.modality)                        
                          return (
                            <div className="td" key={`exam_event_${idx}`}>
                              <span
                                className="incon-wrapper"
                                // onClick={!viewOnly?() => toggleChecked(evt, idx):null}
                              >
                                <Tooltip  
                                  title={<ModalityList evt={evt} idx={idx} value={con.modality}/>}
                                  // trigger="click"
                                  color="#ffffff"
                                  // visible={}                                
                                  >
                                 {Boolean(con.modality)?<img src={targetItem.icon}/>: <PlusCircleOutlined /> } 
                                 </Tooltip>                                                                                     
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
            className="collapse-container"
            forceRender={true}
            header={
              <div className="event-panel-head">
                <div className="event-title e-row">
                  <div className="name">
                    <span style={{width: "186px", display:"inline-block"}}>
                        {`${PROCEDURES} (${procedures.length})`}
                    </span>
                     {!viewOnly&&<span className="add-event" onClick={(e)=>onAddEvent(e,PROCEDURES)}>Add Event</span>}
                  </div>
                  <div className="cost">
                     $ {getTotalCost(procedures)}
                    </div>
                  <div></div>
                </div>
                <div className="event-title-right"></div>
              </div>
            }
            key="3"
          >
            <div className="shedule-of-event-panel-body">
              {procedures.sort((a, b) => {
                return onSort(a,b)
              })
                .map((evt, idx) => {
                return (
                  <div className="event-item" key={`procedure_${idx}`}>
                    <div className="events-wrapper e-row">
                      <div className={`${evt.Custom?"custom-event ":""}my-event-td td f-3`}>
                      {
                        viewOnly?evt["Standard Event"]:(
                          <>
                            {
                            !evt.Custom?(
                              <Tooltip title={evt["Standard Event"]}>
                                {evt["Standard Event"]}
                              </Tooltip>
                            ):(
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
                      <div className="cost-td td f-2-small">
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
                      <div className="visits-td td f-1-small">{evt.totalVisit}</div>
                    </div>
                    <div className="status-row e-row">
                      <div className="colunm td">
                      <Tooltip  
                        title={<ModalityList evt={evt}   category={PROCEDURES} isRowBatch={true} rowModality={rowModality}/>}
                        color="#ffffff"  
                        // visible={true}                        
                        >
                         <PlusCircleOutlined /> 
                        </Tooltip> 
                      </div>
                      {evt.condition.length > 0 &&
                        evt.condition.map((con, idx) => {
                          const targetItem =modality_options.find(m=>m.name==con.modality)                        
                          return (
                            <div className="td" key={`procedure_event_${idx}`}>
                              <span
                                className="incon-wrapper"
                                // onClick={!viewOnly?() => toggleChecked(evt, idx):null}
                              >
                                <Tooltip  
                                  title={<ModalityList evt={evt} idx={idx} value={con.modality}/>}
                                  // trigger="click"
                                  color="#ffffff"
                                  // visible={}                                
                                  >
                                 {Boolean(con.modality)?<img src={targetItem.icon}/>: <PlusCircleOutlined /> } 
                                 </Tooltip> 
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
            className="collapse-container"
            forceRender={true}
            header={
              <div className="event-panel-head">
                <div className="event-title e-row">
                  <div className="name">
                    <span style={{width: "186px", display:"inline-block"}}>
                      {`${QUESTIONNAIRES} (${questionnaire.length})`}
                    </span>
                     {!viewOnly&&<span className="add-event" onClick={(e)=>onAddEvent(e,QUESTIONNAIRES)}>Add Event</span>}
                  </div>
                  <div className="cost">
                     $ {getTotalCost(questionnaire)}                 
                    </div>
                  <div></div>
                </div>
                <div className="event-title-right"></div>
              </div>
            }
            key="4"
          >
            <div className="shedule-of-event-panel-body">
              {questionnaire.sort((a, b) => {
                return onSort(a,b)
                })
                .map((evt, idx) => {
                return (
                  <div className="event-item" key={`question_${idx}`}>
                    <div className="events-wrapper e-row">
                      <div className={`${evt.Custom?"custom-event ":""}my-event-td td f-3`}>
                      {
                        viewOnly?evt["Standard Event"]:(
                          <>
                            {
                              !evt.Custom?(
                                <Tooltip title={evt["Standard Event"]}>
                                  {evt["Standard Event"]}
                                </Tooltip>
                              ):(
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
                      <div className="cost-td td f-2-small">
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
                      <div className="visits-td td f-1-small">{evt.totalVisit}</div>
                    </div>
                    <div className="status-row e-row">
                      <div className="colunm td">
                      <Tooltip  
                        title={<ModalityList evt={evt}  category={QUESTIONNAIRES} isRowBatch={true} rowModality={rowModality}/>}
                        color="#ffffff"                       
                        >
                         <PlusCircleOutlined /> 
                        </Tooltip> 
                      </div>
                      {evt.condition.length > 0 &&
                        evt.condition.map((con, idx) => {
                          const targetItem =modality_options.find(m=>m.name==con.modality)                        
                          return (
                            <div className="td" key={`question_event_${idx}`}>
                              <span
                                className="incon-wrapper"
                                // onClick={!viewOnly?() => toggleChecked(evt, idx):null}
                              >
                                 <Tooltip  
                                  title={<ModalityList evt={evt} idx={idx} value={con.modality}/>}                            
                                  color="#ffffff"                                               
                                  >
                                 {Boolean(con.modality)?<img src={targetItem.icon}/>: <PlusCircleOutlined /> } 
                                 </Tooltip> 
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
            className="collapse-container"
            forceRender={true}
            header={
              <div className="event-panel-head">
                <div className="event-title e-row">
                  <div className="name">
                    <span style={{width: "186px", display:"inline-block"}}>
                      {`${STUDY_PROCEDURES} (${studyProcedures.length})`} 
                    </span>
                    {!viewOnly&&<span className="add-event" onClick={(e)=>onAddEvent(e,STUDY_PROCEDURES)}>Add Event</span>}
                  </div>
                  <div className="cost">
                   $ {getTotalCost(studyProcedures)}   
                    </div>
                  <div></div>
                </div>
                <div className="event-title-right"></div>
              </div>
            }
            key="5"
          >
            <div className="shedule-of-event-panel-body">
              {studyProcedures.sort((a, b) => {
                return onSort(a,b)
                })
                .map((evt, idx) => {
                return (
                  <div className="event-item" key={`study_${idx}`}>
                    <div className="events-wrapper e-row">
                      <div className={`${evt.Custom?"custom-event ":""}my-event-td td f-3`}>
                      {
                        viewOnly?evt["Standard Event"]:(
                          <>
                           {
                            !evt.Custom?(
                              <Tooltip title={evt["Standard Event"]}>
                                {evt["Standard Event"]}
                              </Tooltip>
                            ):(
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
                      <div className="cost-td td f-2-small">
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
                      <div className="visits-td td f-1-small">{evt.totalVisit}</div>
                    </div>
                    <div className="status-row e-row">
                      <div className="colunm td">
                      <Tooltip  
                        title={<ModalityList evt={evt}  category={STUDY_PROCEDURES} isRowBatch={true} rowModality={rowModality}/>}
                        color="#ffffff"                         
                        >
                         <PlusCircleOutlined /> 
                        </Tooltip> 
                      </div>
                      {evt.condition.length > 0 &&
                        evt.condition.map((con, idx) => {
                          const targetItem =modality_options.find(m=>m.name==con.modality)                        
                          return (
                            <div className="td" key={`study_event_${idx}`}>
                              <span
                                className="incon-wrapper"
                                onClick={!viewOnly?() => toggleChecked(evt, idx):null}
                              >
                                <Tooltip  
                                  title={<ModalityList evt={evt} idx={idx} value={con.modality}/>}                          
                                  color="#ffffff"                                           
                                  >
                                 {Boolean(con.modality)?<img src={targetItem.icon}/>: <PlusCircleOutlined /> } 
                                 </Tooltip> 
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
