import React, { useState, useReducer, useEffect } from "react";
import {Table, Collapse, Slider, Dropdown,Menu, Modal, Row, Col, InputNumber, Tooltip, Button, Spin, message} from "antd";
import {ArrowRightOutlined, CloseOutlined, EditFilled, MinusOutlined, PlusOutlined, DownOutlined, DownloadOutlined, HistoryOutlined} from "@ant-design/icons";
import {getStandardEvents, updateStudy} from "../../utils/ajax-proxy";
import ReactECharts from 'echarts-for-react';
import "./index.scss";
import EventList from '../EventList';
import FileSaver from 'file-saver';
import {modality_options} from '../EventList'

const { Panel } = Collapse;

const iChartColors = ['#DADADA', '#DADADA', '#DADADA', '#DADADA', '#DADADA']
const aChartColors = ['#d04a02', '#ed7738', '#ed9d72', '#f5b795', '#f5ddcf']
const burdenColors = {active: '#E53500', inactive: '#DADADA'}
const aLabelColors = {GOOD: '#00A947', FAIR: '#0084A9', POOR: '#c33232'}
const iLabelColors = {GOOD: burdenColors.inactive, FAIR: burdenColors.inactive, POOR: burdenColors.inactive}

const CATEGORY_LABS = 'Labs';
const CATEGORY_PHYSICAL_EXAMINATION = 'Physical Examination';
const CATEGORY_PROCEDURES = 'Procedures';
const CATEGORY_QUESTIONNAIRES = 'Questionnaires';
const CATEGORY_STUDY_PROCEDURES = 'Study Procedures';

const defaultCostValue = [
  {value: 0, name: CATEGORY_LABS},
  {value: 0, name: CATEGORY_PHYSICAL_EXAMINATION},
  {value: 0, name: CATEGORY_PROCEDURES},
  {value: 0, name: CATEGORY_QUESTIONNAIRES},
  {value: 0, name: CATEGORY_STUDY_PROCEDURES}
]

const defaultBurdenValue = [0, 0, 0, 0, 0, 0, 0, 0, 0]

const initialNumber = {
  visitNumber: 0,
  weekNumber: 0
}

const initEventCriteria = {
  'TotalCost': '0',
  'CostRate': '',
  'CostData': [],
  'BurdenData': [],
  'BurdenXAxis': [],
  'Finished': false
}

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

const ScheduleEvents = (props) => {
  const endpoints = {
    "Primary Endpoints": props.record.primary_endpoints,
    "Secondary Endpoints": props.record.secondary_endpoints,
    "Tertiary Endpoints": props.record.tertiary_endpoints,
  };
  const scenario = props.record.scenarios.find(s=> s['scenario_id'] === props.scenarioId)
  const eventsConfigure = scenario['Schedule of Events']
  const [hiddeTags, setHiddeTags] = useState(true)
  const [showConfigure, setShowConfigure] = useState(false)
  const [eventLib, setEventLib] = useState("300px")
  const [activeCollapse, setActiveCollapse] = useState(['1'])
  const [numbers, setNumbers] = useReducer(
    (state, newState) => ({ ...state, ...newState }),
    { visitNumber: eventsConfigure?.Visits || 0,
      weekNumber: eventsConfigure.Weeks?eventsConfigure.Weeks[eventsConfigure.Weeks?.length-1]: 0
     }
  );
  const [editNumbers, setEditNumbers] = useState({
    visitNumber: eventsConfigure?.Visits || 0,
    weekNumber:eventsConfigure.Weeks?eventsConfigure.Weeks[eventsConfigure.Weeks?.length-1]: 0
  });
  const [weeks, setWeeks] = useState([1,4,7,10,13,16,19,22,26])
  const [visits, setVisits] = useState([])
  const [minV, setMinV] = useState(0)
  const [maxV, setMaxV] = useState(100)
  const [visibleSlider, setVisibleSlider] = useState(false)
  const [eventCriteria, setEventCriteria] = useReducer(
    (state, newState) => ({ ...state, ...newState }),
    { ...initEventCriteria }
  );

  //Cost Per Patient Chart
  const [patientChartColor, setPatientChartColor] = useState(iChartColors)
  const [burdenChartColor, setBurdenChartColor] = useState(burdenColors.inactive)
  const [labelColors, setLabelColors] = useState(iLabelColors)
  const [costData, setCostData] = useState(defaultCostValue)
  const [costSubTitle, setCostSubTitle] = useState('')
  const [showPatientLabel, setShowPatientLabel] = useState(false)
  const [patientRate, setPatientRate] = useState('{p|$9.4K}\n{good|GOOD}')
  const [totalBurden, setTotalBurden] = useState(0)

  //Patirnt Burden Chart
  const [burdenData, setBurdenData] = useState(defaultBurdenValue)
  const [burdenSubTitle, setBurdenSubTitle] = useState('')
  const [burdenXAxis, setBurdenXAxis] = useState(['1', '2', '3', '4', '5', '6', '7', '8', '9'])
  const [showTooltip, setShowTooltip] = useState(false)
  const [submitType, setSubmitType] = useState(0)

  //Activities by Modality chart
  const[modalityChartData,setModalityChartData] = useState([])
  // const[modalityOption,setModalityOption] = useState(initModalityOption )
  const modalityOption = {
    title:{
      text: 'Activities by Modality',
      x:'center',
      y:'top',
      show:true,
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333'
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        // Use axis to trigger tooltip
        type: 'shadow' // 'shadow' as default; can also be 'line' or 'shadow'
      }
    },
    grid: {
      left: '10%',
      right: '4%',
      top: '15%',
      bottom: '6%',
      containLabel: true
  },
    xAxis: {
      name: 'Visit Number',
      nameLocation: "middle", 
      type: 'category',
      data: visits,
      nameRotate: 0, nameGap: 20,
   },
   yAxis: {
      type: 'value'
   },
    series:modalityChartData

  };
 
  //Event Libs
  //Original data from backend
  const [orgLabs, setOrgLabs] = useState([])
  const [orgExamination, setOrgExamination] = useState([])
  const [orgProcedures, setOrgProcedures] = useState([])
  const [orgQuestionnaires, setOrgQuestionnaires] = useState([])
  const [orgStudyProcedures, setOrgStudyProcedures] = useState([])

  //Filtered data based on the frequency and original data
  let [filteredLabs, setFilteredLabs] = useState([])
  let [filteredExamination, setFilteredExamination] = useState([])
  let [filteredQuestionnaires, setFilteredQuestionnaires] = useState([])
  let [filteredProcedures, setFilteredProcedures] = useState([])
  let [filteredStudyProcedures, setFilteredStudyProcedures] = useState([])

  //Addedd data 
  let [addedLabs, setAddedLabs] = useState([])
  let [addedExamination, setAddedExamination] = useState([])
  let [addedQuestionnaires, setAddedQuestionnaires] = useState([])
  let [addedProcedures, setAddedProcedures] = useState([])
  let [addedStudyProcedures, setAddedStudyProcedures] = useState([])
  const [resetWeeks, setResetWeeks] = useState(true)

  const onStepVisit = (value: number, info: { offset: number, type: 'up' | 'down' }) => {
    setNumbers({
      ['visitNumber']: value
    });
  }

  const onStepWeek = (value: number, info: { offset: number, type: 'up' | 'down' }) => {
    setNumbers({
      ['weekNumber']: value
    });
  }

  const onChangeVisit = (value: number) => {
    setNumbers({
      ['visitNumber']: value
    });
  }
  
  const onChangeWeek = (value: number) => {
    setNumbers({
      ['weekNumber']: value
    });
  }

  const sumOfArr = (arr) => {
    if(Array.isArray(arr)){
       let  arrSum = 0
       arr.forEach((item,index) => {
        arrSum+=item
       })
       return arrSum
    } 
}

  function excluCallback(key) {
  }

  useEffect(() => {
    if(props.submitType != 0){
      setSubmitType(props.submitType)
    }
  },[props.submitType]);

  useEffect(()=>{
    if(eventsConfigure.Visits && eventsConfigure.Weeks){
      setNumbers({
        visitNumber:eventsConfigure.Visits,
        weekNumber:eventsConfigure.Weeks[eventsConfigure.Weeks.length-1]
      })
      setEditNumbers({
        visitNumber:eventsConfigure.Visits,
        weekNumber:eventsConfigure.Weeks[eventsConfigure.Weeks.length-1]
      })
      const tmpSoAConfig = {
        [CATEGORY_LABS]:eventsConfigure[CATEGORY_LABS].entities,
        [CATEGORY_PHYSICAL_EXAMINATION]:eventsConfigure[CATEGORY_PHYSICAL_EXAMINATION].entities,
        [CATEGORY_PROCEDURES]:eventsConfigure[CATEGORY_PROCEDURES].entities,
        [CATEGORY_QUESTIONNAIRES]:eventsConfigure[CATEGORY_QUESTIONNAIRES].entities,
        [CATEGORY_STUDY_PROCEDURES]:eventsConfigure[CATEGORY_STUDY_PROCEDURES].entities
      }
      // setModalityChartData(getModalitySeriesData(tmpSoAConfig))

    }
   
    // getModalitySeriesData(tmpSoAConfig)

  },[eventsConfigure.Visits,eventsConfigure.Weeks])
  // useEffect(()=>{
  //    //init Activities by Modality chart data
  //    const tmpSoAConfig = {
  //     [CATEGORY_LABS]:eventsConfigure[CATEGORY_LABS].entities,
  //     [CATEGORY_PHYSICAL_EXAMINATION]:eventsConfigure[CATEGORY_PHYSICAL_EXAMINATION].entities,
  //     [CATEGORY_PROCEDURES]:eventsConfigure[CATEGORY_PROCEDURES].entities,
  //     [CATEGORY_QUESTIONNAIRES]:eventsConfigure[CATEGORY_QUESTIONNAIRES].entities,
  //     [CATEGORY_STUDY_PROCEDURES]:eventsConfigure[CATEGORY_STUDY_PROCEDURES].entities
  //   }
  //   getModalitySeriesData(tmpSoAConfig)

  // },[eventsConfigure])



  useEffect(() => {
    //Verify if this is the first time to set Events
    const scenario = props.record.scenarios.find(s=> s['scenario_id'] === props.scenarioId)
    const eventsConfigure = scenario['Schedule of Events']
    if(eventsConfigure != undefined && eventsConfigure.Labs != undefined){
      setHiddeTags(false)
    } else {
      setShowConfigure(true)
    }
    setCostSubTitle('Average from Similar Historical\nTrials - $' + formatCostAvg(props.record.CostAvg, 1000) + 'K / Patient')
    setBurdenSubTitle('Average from similar Historical Trials - ' + Number(props.record.BurdenAvg.toString().match(/^\d+(?:\.\d{0,2})?/)))

    const getStandardEventsLib = async () => {
      var resp = await getStandardEvents();

      if (resp.statusCode == 200) {
          const response = JSON.parse(resp.body)
          console.log('getStandardEventsLib-----',response)
          setOrgLabs(response[CATEGORY_LABS])
          setOrgExamination(response[CATEGORY_PHYSICAL_EXAMINATION])
          setOrgProcedures(response[CATEGORY_PROCEDURES])
          setOrgQuestionnaires(response[CATEGORY_QUESTIONNAIRES])
          setOrgStudyProcedures(response[CATEGORY_STUDY_PROCEDURES])
          //Init previous configure
          if(eventsConfigure != undefined && eventsConfigure.Labs != undefined){
            setNumbers({
              ['visitNumber']: eventsConfigure.Visits,
              ['weekNumber']: eventsConfigure.WeekNumber? eventsConfigure.WeekNumber : eventsConfigure.Weeks[eventsConfigure.Weeks.length -1]
            });
            setEditNumbers({
              'visitNumber': eventsConfigure.Visits,
              'weekNumber': eventsConfigure.WeekNumber? eventsConfigure.WeekNumber : eventsConfigure.Weeks[eventsConfigure.Weeks.length -1]
            })
            setWeeks(eventsConfigure.Weeks)
            setResetWeeks(false)
            setAddedLabs(eventsConfigure[CATEGORY_LABS].entities)
            setAddedExamination(eventsConfigure[CATEGORY_PHYSICAL_EXAMINATION].entities)
            setAddedQuestionnaires(eventsConfigure[CATEGORY_QUESTIONNAIRES].entities)
            setAddedProcedures(eventsConfigure[CATEGORY_PROCEDURES].entities)
            setAddedStudyProcedures(eventsConfigure[CATEGORY_STUDY_PROCEDURES].entities)
            setPatientRate('{p|$'+ eventsConfigure.TotalCost +'K}\n{'+eventsConfigure.CostRate + '|' + eventsConfigure.CostRate + '}')
            setCostData(eventsConfigure.CostData)
            setBurdenData(eventsConfigure.BurdenData)
            setTotalBurden(sumOfArr(eventsConfigure.BurdenData))
            setBurdenXAxis(eventsConfigure.BurdenXAxis)
            //init Activities by Modality chart data
           
            const tmpSoAConfig = {
              [CATEGORY_LABS]:eventsConfigure[CATEGORY_LABS].entities,
              [CATEGORY_PHYSICAL_EXAMINATION]:eventsConfigure[CATEGORY_PHYSICAL_EXAMINATION].entities,
              [CATEGORY_PROCEDURES]:eventsConfigure[CATEGORY_PROCEDURES].entities,
              [CATEGORY_QUESTIONNAIRES]:eventsConfigure[CATEGORY_QUESTIONNAIRES].entities,
              [CATEGORY_STUDY_PROCEDURES]:eventsConfigure[CATEGORY_STUDY_PROCEDURES].entities
            }          
            getModalitySeriesData(tmpSoAConfig)
            
            if(eventsConfigure.CostRate.length > 0){
              setShowTooltip(true)
              setShowPatientLabel(true)
            }
            if(eventsConfigure.Finished){
              setPatientChartColor(aChartColors)
              setBurdenChartColor(burdenColors.active)
              setLabelColors(aLabelColors)
            }

            setFilteredLabs(filterLibs(response[CATEGORY_LABS], eventsConfigure[CATEGORY_LABS].entities, minV, maxV))
            setFilteredExamination(filterLibs(response[CATEGORY_PHYSICAL_EXAMINATION], eventsConfigure[CATEGORY_PHYSICAL_EXAMINATION].entities, minV, maxV))
            setFilteredProcedures(filterLibs(response[CATEGORY_PROCEDURES], eventsConfigure[CATEGORY_PROCEDURES].entities, minV, maxV))
            setFilteredQuestionnaires(filterLibs(response[CATEGORY_QUESTIONNAIRES], eventsConfigure[CATEGORY_QUESTIONNAIRES].entities, minV, maxV))
            setFilteredStudyProcedures(filterLibs(response[CATEGORY_STUDY_PROCEDURES], eventsConfigure[CATEGORY_STUDY_PROCEDURES].entities, minV, maxV))
          
            setEventCriteria(eventsConfigure)
          } else {
            setFilteredLabs(filterLibs(response[CATEGORY_LABS], [], minV, maxV))
            setFilteredExamination(filterLibs(response[CATEGORY_PHYSICAL_EXAMINATION], [], minV, maxV))
            setFilteredProcedures(filterLibs(response[CATEGORY_PROCEDURES], [], minV, maxV))
            setFilteredQuestionnaires(filterLibs(response[CATEGORY_QUESTIONNAIRES], [], minV, maxV))
            setFilteredStudyProcedures(filterLibs(response[CATEGORY_STUDY_PROCEDURES], [], minV, maxV))
          }
      }
    };
    getStandardEventsLib();
  }, []);

  function filterLibs(orgLibs, addedEvents, minValue, maxValue){
    let filteredLibs = orgLibs.filter((d) => {
      if(d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue){
        var index = addedEvents.findIndex((domain) => d['Standard Event'] === domain['Standard Event']);
        if(index > -1){
          return Object.assign(d, {
            selected: true, 
            condition: addedEvents[index].condition, 
            totalVisit: addedEvents[index].totalVisit})
        } else {
          return Object.assign(d, {selected: false, condition: [], totalVisit: 0})
        }
      }
    })
    return filteredLibs
  }

  const panelHeader = () => {
    return (
        <div className="event-panelHeader">
            <div>
                <div style={{color:'#333', fontSize: '18px'}}><span>Impact</span></div>
            </div>
        </div>
    );
  };

  const eventLibHeader = (name, count, key) => {
    return (
      <Row className="section-header">
        <Col span={23}><span>{name}</span><span className="count-span">{count}</span></Col>
        <Col span={1} className="collapse-icon">{activeCollapse.indexOf(key) >= 0 ?(<MinusOutlined />):(<PlusOutlined />)}</Col>
      </Row>
    );
  };

  useEffect(()=>{

    const getVisits = () =>{
      let visitArr = [];
      for (let i = 0; i <= editNumbers.visitNumber-1; i++) {
        visitArr.push(i+1)
      }
     return visitArr
    }
    const visitArr = getVisits()

    setVisits(visitArr)
  },[editNumbers,numbers])

 

  const burdenOption = {
    title : {
      text: 'Patient Burden Total:'+totalBurden,
      subtext: burdenSubTitle,
      x:'center',
      y:'25%',
      left:'center',
      top:'top',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333'
      },
      subtextStyle: {
        fontSize: 12,
        fontWeight: 'normal',
        color: '#999'
      }
    },
    tooltip: {
      show: showTooltip,
      trigger: 'axis',
      axisPointer: {
          type: 'shadow'
      }
    },
    grid: {
        left: '10%',
        right: '4%',
        top: '30%',
        bottom: '6%',
        containLabel: true
    },
    legend: {
        data: ['Patient Burden']
    },
    xAxis: [
        {
          type: 'category',
          name: 'Visit Number',
          data: burdenXAxis,
          nameLocation: "middle", 
          nameRotate: 0, nameGap: 21,
          axisTick: {
              alignWithLabel: true
          }
        }
    ],
    yAxis: [
        { type: 'value', name:'Patient Burden', 
        nameRotate: 90, nameGap: 40, nameLocation: "middle", 
        axisLine: { lineStyle: { color: '#666666' } }, 
        axisLabel : { formatter : function(value) { return value; } }, }
    ],
    series: [
        {
            name: 'Patient Burder',
            type: 'bar',
            barWidth: '60%',
            color: burdenChartColor,
            data: burdenData,
            label: {
              show: showTooltip,
              position: 'top',
              fontSize: 12,
              color: '#666'
          },
        }
    ]
  };

  const costOption = {
    title : {
      text: 'Cost Per Patient',
      subtext: costSubTitle,
      x:'left',
      y:'top',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333'
      },
      subtextStyle: {
        fontSize: 12,
        fontWeight: 'normal',
        color: '#999'
      }
    },
    legend: {
      x:'left',
      y:'37%',
      orient: 'vertical',
      itemHeight: 9,
      itemWidth: 9,
      textStyle: {
        fontSize: 12,
        color: '#333'
      },
      data: [CATEGORY_LABS, CATEGORY_PHYSICAL_EXAMINATION, CATEGORY_PROCEDURES, CATEGORY_QUESTIONNAIRES, CATEGORY_STUDY_PROCEDURES]
    },
    grid: {
      left: '10%',
      right: '4%',
      top: '10%',
      bottom: '5%',
      containLabel: true
  },
    tooltip: {
      show: showTooltip,
      trigger: 'item',
      formatter: '{b} - ${c}',
      extraCssText:'background:#757373;color:white;font-size:8px'
    },
    series: [
      {
        type: 'pie',
        center: ['70%', '50%'],
        radius: ['50%', '80%'],
        avoidLabelOverlap: false,
        label: {
          show: true,
          position: 'center',
          formatter: function () {
            if(showPatientLabel){
              return patientRate
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
            GOOD: {
              color: labelColors.GOOD,
              fontSize: 12,
              fontWeight:'bold',
              backgroundColor: "white"
            },
            FAIR: {
              color: labelColors.FAIR,
              fontSize: 12,
              fontWeight:'bold',
              backgroundColor: "white"
            },
            POOR: {
              color: labelColors.POOR,
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
        color: patientChartColor,
        data: costData
      }
    ]
  };

 


  const handleEventChange = (tmpWeeks) =>{
    if(tmpWeeks != undefined && tmpWeeks.length > 0){
      setWeeks(tmpWeeks)
    }
    setResetWeeks(false)
    setPatientChartColor(iChartColors)
    setBurdenChartColor(burdenColors.inactive)
    setLabelColors(iLabelColors)
    setEventCriteria({
      'Finished' : false
    })
  }

  const statisticsPerVisit = (categories,idx)=>{
    //statistics of each column
    const modalityCollection={}
    const modalitySummary={}
    const columnConditionCollection = []

    if(categories[CATEGORY_LABS].length>0){
      categories[CATEGORY_LABS].forEach( ele=>{
        columnConditionCollection.push( ele.condition[idx])
      }) 
    }
    if(categories[CATEGORY_PHYSICAL_EXAMINATION].length>0){
      categories[CATEGORY_PHYSICAL_EXAMINATION].forEach( ele=>{
        columnConditionCollection.push( ele.condition[idx])
      })

    }
    if(categories[CATEGORY_PROCEDURES].length>0){
      categories[CATEGORY_PROCEDURES].forEach( ele=>{
        columnConditionCollection.push( ele.condition[idx])
      })
      
    }
    if(categories[CATEGORY_QUESTIONNAIRES].length>0){
      categories[CATEGORY_QUESTIONNAIRES].forEach( ele=>{
        columnConditionCollection.push( ele.condition[idx])
      })
    }
    if(categories[CATEGORY_STUDY_PROCEDURES].length>0){
      categories[CATEGORY_STUDY_PROCEDURES].forEach( ele=>{
        columnConditionCollection.push( ele.condition[idx])
      })
    }
    
    columnConditionCollection.filter(element=>element.modality&&element.modality!=="")
    .forEach( element=>{
    if( Object.keys(modalityCollection).indexOf(element.modality)<0 ){
      modalityCollection[element.modality]=[element]
    }else{
      modalityCollection[element.modality].push(element)
    }})
        
    modality_options.forEach( option=>{
      if(Object.keys(modalityCollection).indexOf(option.name)==-1){
        modalitySummary[option.name]=0
      }else{
        modalitySummary[option.name]=modalityCollection[option.name].length
      }
    })
    return modalitySummary
  }

  useEffect(()=>{
    const categories={
      [CATEGORY_LABS]:addedLabs,
      [CATEGORY_PHYSICAL_EXAMINATION]:addedExamination,
      [CATEGORY_PROCEDURES]:addedProcedures,
      [CATEGORY_QUESTIONNAIRES]:addedQuestionnaires,
      [CATEGORY_STUDY_PROCEDURES]:addedStudyProcedures,
    }
    getModalitySeriesData(categories)

  },[visits,addedLabs,addedExamination,addedProcedures,addedQuestionnaires,addedStudyProcedures])

  const getModalitySeriesData = (categories) =>{
    const modalitySeries = []
    
    const visitStacks=visits.map( (ele,idx)=>{
      return statisticsPerVisit(categories,idx)
    })
    if(visitStacks.filter(v=>v!==undefined).length==0) return
    modality_options.forEach((element,idx)=>{
      const data = visitStacks.map( v=>{
        return v[element.name]
      })
      modalitySeries.push({
        name: element.name,
        type: 'bar',
        stack: 'total',
        emphasis: {
          focus: 'series'
        },
        data,
        color:element.color
      })
    })
    
    setModalityChartData(modalitySeries)   
  }

  const saveEvents = async (scheduleOfEvents) =>{
    if(submitType === 1){
      props.handleGoBack(Object.assign(scheduleOfEvents,{
        'TotalCost': eventCriteria.TotalCost,
        'CostRate': eventCriteria.CostRate,
        'CostData': costData,
        'BurdenData': burdenData,
        'BurdenXAxis': burdenXAxis,
        'Finished': eventCriteria.Finished,
        'WeekNumber': editNumbers.weekNumber
      }))
      return;
    }
    setPatientChartColor(aChartColors)
    setBurdenChartColor(burdenColors.active)
    setLabelColors(aLabelColors)
    setShowPatientLabel(true)
    setWeeks(scheduleOfEvents.Weeks)

    let burdenMatrixList = []
    let tempBurdenXAxis = []
    for(var i =0; i< scheduleOfEvents.Visits; i ++){
      burdenMatrixList.push([0,0,0,0,0,0,0,0,0,0])
      tempBurdenXAxis.push((i+1)+'')
    }

    let labeTotalCost = 0
    let examinationTotalCost = 0
    let proceduresTotalCost = 0
    let questionairesTotalCost = 0
    let studyTotalCost = 0
    var categoryList = [CATEGORY_LABS, CATEGORY_PHYSICAL_EXAMINATION, CATEGORY_QUESTIONNAIRES, CATEGORY_PROCEDURES, CATEGORY_STUDY_PROCEDURES]
    for(const categoryIndex in categoryList){
      var category = categoryList[categoryIndex]
      let tempTotalCost = 0
      for(const a in scheduleOfEvents[category].entities) {
        tempTotalCost += Number(scheduleOfEvents[category].entities[a]['Dummy Cost']) * scheduleOfEvents[category].entities[a].totalVisit
        if(scheduleOfEvents[category].entities[a].condition.length > 0){
          for(let b = 0; b < scheduleOfEvents[category].entities[a].condition.length; b ++){
            if(scheduleOfEvents[category].entities[a].condition[b].modality!==""){
              let tempBurdenMatrix = []
              burdenMatrixList[b].map((item, idx) =>{
                //When modality is "Hospital", which means the item havs "Hospital Dependency"
                //Need to correct the dimension Value in SOA weight, change the value to 1
                let dimensionValue = scheduleOfEvents[category].entities[a].soaWeights[idx]
                if (idx == 1 && scheduleOfEvents[category].entities[a].condition[b].modality=="Hospital"){
                  dimensionValue = 1
                }
                tempBurdenMatrix.push(item + dimensionValue)
              })
              burdenMatrixList.splice(b, 1, tempBurdenMatrix)
            }
          }
        }
      }

      if(category == CATEGORY_LABS){
        labeTotalCost = tempTotalCost
      } else if (category == CATEGORY_PHYSICAL_EXAMINATION){
        examinationTotalCost = tempTotalCost
      } else if (category == CATEGORY_QUESTIONNAIRES){
        questionairesTotalCost = tempTotalCost
      } else if (category == CATEGORY_PROCEDURES){
        proceduresTotalCost = tempTotalCost
      } else if (category == CATEGORY_STUDY_PROCEDURES){
        studyTotalCost = tempTotalCost
      } 
    }
    // let labeTotalCost = 0
    // for(const a in scheduleOfEvents[CATEGORY_LABS].entities) {
    //   labeTotalCost += Number(scheduleOfEvents[CATEGORY_LABS].entities[a]['Dummy Cost']) * scheduleOfEvents[CATEGORY_LABS].entities[a].totalVisit
    //   if(scheduleOfEvents[CATEGORY_LABS].entities[a].condition.length > 0){
    //     for(let b = 0; b < scheduleOfEvents[CATEGORY_LABS].entities[a].condition.length; b ++){
    //       if(scheduleOfEvents[CATEGORY_LABS].entities[a].condition[b].modality!==""){
    //         let tempBurdenMatrix = []
    //         burdenMatrixList[b].map((item, idx) =>{
    //           tempBurdenMatrix.push(item + scheduleOfEvents[CATEGORY_LABS].entities[a].soaWeights[idx])
    //         })
    //         burdenMatrixList.splice(b, 1, tempBurdenMatrix)
    //       }
    //     }
    //   }
    // }

    // let examinationTotalCost = 0
    // for(const a in scheduleOfEvents[CATEGORY_PHYSICAL_EXAMINATION].entities) {
    //   examinationTotalCost += Number(scheduleOfEvents[CATEGORY_PHYSICAL_EXAMINATION].entities[a]['Dummy Cost']) * scheduleOfEvents[CATEGORY_PHYSICAL_EXAMINATION].entities[a].totalVisit
    //   if(scheduleOfEvents[CATEGORY_PHYSICAL_EXAMINATION].entities[a].condition.length > 0){
    //     for(let b = 0; b < scheduleOfEvents[CATEGORY_PHYSICAL_EXAMINATION].entities[a].condition.length; b ++){
    //       if(scheduleOfEvents[CATEGORY_PHYSICAL_EXAMINATION].entities[a].condition[b].modality!==""){
    //         let tempBurdenMatrix = []
    //         burdenMatrixList[b].map((item, idx) =>{
    //           tempBurdenMatrix.push(item + scheduleOfEvents[CATEGORY_PHYSICAL_EXAMINATION].entities[a].soaWeights[idx])
    //         })
    //         burdenMatrixList.splice(b, 1, tempBurdenMatrix)
    //       }
    //     }
    //   }
    // }

    // let proceduresTotalCost = 0
    // for(const a in scheduleOfEvents[CATEGORY_PROCEDURES].entities) {
    //   proceduresTotalCost += Number(scheduleOfEvents[CATEGORY_PROCEDURES].entities[a]['Dummy Cost']) * scheduleOfEvents[CATEGORY_PROCEDURES].entities[a].totalVisit
    //   if(scheduleOfEvents[CATEGORY_PROCEDURES].entities[a].condition.length > 0){
    //     for(let b = 0; b < scheduleOfEvents[CATEGORY_PROCEDURES].entities[a].condition.length; b ++){
    //       if(scheduleOfEvents[CATEGORY_PROCEDURES].entities[a].condition[b].modality!==""){
    //         let tempBurdenMatrix = []
    //         burdenMatrixList[b].map((item, idx) =>{
    //           tempBurdenMatrix.push(item + scheduleOfEvents[CATEGORY_PROCEDURES].entities[a].soaWeights[idx])
    //         })
    //         burdenMatrixList.splice(b, 1, tempBurdenMatrix)
    //       }
    //     }
    //   }
    // }

    // let questionairesTotalCost = 0
    // for(const a in scheduleOfEvents[CATEGORY_QUESTIONNAIRES].entities) {
    //   questionairesTotalCost += Number(scheduleOfEvents[CATEGORY_QUESTIONNAIRES].entities[a]['Dummy Cost']) * scheduleOfEvents[CATEGORY_QUESTIONNAIRES].entities[a].totalVisit
    //   if(scheduleOfEvents[CATEGORY_QUESTIONNAIRES].entities[a].condition.length > 0){
    //     for(let b = 0; b < scheduleOfEvents[CATEGORY_QUESTIONNAIRES].entities[a].condition.length; b ++){
    //       if(scheduleOfEvents[CATEGORY_QUESTIONNAIRES].entities[a].condition[b].modality!==""){
    //         let tempBurdenMatrix = []
    //         burdenMatrixList[b].map((item, idx) =>{
    //           tempBurdenMatrix.push(item + scheduleOfEvents[CATEGORY_QUESTIONNAIRES].entities[a].soaWeights[idx])
    //         })
    //         burdenMatrixList.splice(b, 1, tempBurdenMatrix)
    //       }
    //     }
    //   }
    // }

    // let studyTotalCost = 0
    // for(const a in scheduleOfEvents[CATEGORY_STUDY_PROCEDURES].entities) {
    //   studyTotalCost += Number(scheduleOfEvents[CATEGORY_STUDY_PROCEDURES].entities[a]['Dummy Cost']) * scheduleOfEvents[CATEGORY_STUDY_PROCEDURES].entities[a].totalVisit
    //   if(scheduleOfEvents[CATEGORY_STUDY_PROCEDURES].entities[a].condition.length > 0){
    //     for(let b = 0; b < scheduleOfEvents[CATEGORY_STUDY_PROCEDURES].entities[a].condition.length; b ++){
    //       if(scheduleOfEvents[CATEGORY_STUDY_PROCEDURES].entities[a].condition[b].modality!==""){
    //         let tempBurdenMatrix = []
    //         burdenMatrixList[b].map((item, idx) =>{
    //           tempBurdenMatrix.push(item + scheduleOfEvents[CATEGORY_STUDY_PROCEDURES].entities[a].soaWeights[idx])
    //         })
    //         burdenMatrixList.splice(b, 1, tempBurdenMatrix)
    //       }
    //     }
    //   }
    // }

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
    setPatientRate('{p|$'+ formatCostAvg(totalCost, 1000) +'K}\n{' +costBreakdown+ '|' + costBreakdown + '}')
    setCostData(tempCostData)
    setBurdenData(tempBurdenData)
    setTotalBurden(sumOfArr(tempBurdenData))
    setBurdenXAxis(tempBurdenXAxis)
    setShowTooltip(true)

    let newScenario = props.record.scenarios.find( i=> i['scenario_id'] == props.scenarioId)
    newScenario['Schedule of Events'] = Object.assign(scheduleOfEvents,{
      'TotalCost': '' + formatCostAvg(totalCost, 1000),
      'CostRate': costBreakdown,
      'CostData': tempCostData,
      'BurdenData': tempBurdenData,
      'BurdenXAxis': tempBurdenXAxis,
      'Finished': true,
      'WeekNumber': editNumbers.weekNumber,
      'patient_burden': patient_burden,
      'patient_burden_rate': patient_burden_rate
    })
    setEventCriteria(newScenario['Schedule of Events'])
    const newScenarioList = props.record.scenarios.map((item, id) =>{
      if(item['scenario_id'] == props.scenarioId){
          return newScenario
      } else {
          return item
      }
    })

    const categories={
      [CATEGORY_LABS]:scheduleOfEvents[CATEGORY_LABS].entities,
      [CATEGORY_PHYSICAL_EXAMINATION]:scheduleOfEvents[CATEGORY_PHYSICAL_EXAMINATION].entities,
      [CATEGORY_PROCEDURES]:scheduleOfEvents[CATEGORY_PROCEDURES].entities,
      [CATEGORY_QUESTIONNAIRES]:scheduleOfEvents[CATEGORY_QUESTIONNAIRES].entities,
      [CATEGORY_STUDY_PROCEDURES]:scheduleOfEvents[CATEGORY_STUDY_PROCEDURES].entities,
    }
    // setModalityChartData(getModalitySeriesData(categories))
    getModalitySeriesData(categories)

    let newTrial = props.record
    newTrial.scenarios = newScenarioList

    const resp = await updateStudy(newTrial)
    if (resp.statusCode == 200) {
      message.success('Save successfully')
      if(submitType != 0){
        props.history.push({pathname: '/trials', state: {trial_id: props.record['_id']}})
      }
      props.getTrialById()
    }
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

  function formatBurdenAvg(totalCost, divisor){
    if(totalCost === 0){
      return 0
    } else {
      let avg = Math.ceil(totalCost/divisor*100)
      return avg/100
    }
  }

  const callback = (key) => {
    setActiveCollapse(key)
  }

  const columns = [{
    title: 'Standard Event',
    dataIndex: 'Standard Event',
    key: 'Standard Event',
    width: '70%',
    render: (_, item) => {
      return <span className="event-text">{item['Standard Event']}</span>

    }
  }, {
    title: 'selected',
    dataIndex: 'selected',
    key: 'selected',
    width: '30%',
    render: (_, item) => {
      return item.selected ? (
        <div className="remove"><span onClick={(e)=> handleEvent(item)}>Remove</span></div>
      ) : (
        <div className="add"><span onClick={(e)=> handleEvent(item)}>Add</span></div>
      );
    }
  }]

  const handleEvent = (item) => {
    switch(item.Categories.trim()){
      case "Labs": 
        let index = filteredLabs.findIndex((d) => item['Standard Event'] == d['Standard Event'])
        const newData = [...filteredLabs]
        const newSelectedData = [...addedLabs]

        if(item.selected){
          newData.splice(index, 1, { ...item, ...{selected: false, condition: [], totalVisit: 0}});
          let selectedIndex = addedLabs.findIndex((d) => item['Standard Event'] == d['Standard Event'])
          newSelectedData.splice(selectedIndex, 1)
        } else {
          newData.splice(index, 1, { ...item, ...{selected: true}});
          newSelectedData.push(Object.assign(item, {selected: true}))
        }
        setFilteredLabs(newData)
        setAddedLabs(newSelectedData)
        break;

      case "Physical Examination": 
        let index2 = filteredExamination.findIndex((d) => item['Standard Event'] == d['Standard Event'])
        const newData2 = [...filteredExamination]
        const newSelectedData2 = [...addedExamination]

        if(item.selected){
          newData2.splice(index2, 1, { ...item, ...{selected: false, condition: [], totalVisit: 0}});
          let selectedIndex = addedExamination.findIndex((d) => item['Standard Event'] == d['Standard Event'])
          newSelectedData2.splice(selectedIndex, 1)
        } else {
          newData2.splice(index2, 1, { ...item, ...{selected: true}});
          newSelectedData2.push(Object.assign(item, {selected: true}))
        }
        setFilteredExamination(newData2)
        setAddedExamination(newSelectedData2)
        break;

      case "Procedures": 
        let index3 = filteredProcedures.findIndex((d) => item['Standard Event'] == d['Standard Event'])
        const newData3 = [...filteredProcedures]
        const newSelectedData3 = [...addedProcedures]

        if(item.selected){
          newData3.splice(index3, 1, { ...item, ...{selected: false, condition: [], totalVisit: 0}});
          let selectedIndex = addedProcedures.findIndex((d) => item['Standard Event'] == d['Standard Event'])
          newSelectedData3.splice(selectedIndex, 1)
        } else {
          newData3.splice(index3, 1, { ...item, ...{selected: true}});
          newSelectedData3.push(Object.assign(item, {selected: true}))
        }
        setFilteredProcedures(newData3)
        setAddedProcedures(newSelectedData3)
        break;

      case "Questionnaires": 
        let index4 = filteredQuestionnaires.findIndex((d) => item['Standard Event'] == d['Standard Event'])
        const newData4 = [...filteredQuestionnaires]
        const newSelectedData4 = [...addedQuestionnaires]

        if(item.selected){
          newData4.splice(index4, 1, { ...item, ...{selected: false, condition: [], totalVisit: 0}});
          let selectedIndex = addedQuestionnaires.findIndex((d) => item['Standard Event'] == d['Standard Event'])
          newSelectedData4.splice(selectedIndex, 1)
        } else {
          newData4.splice(index4, 1, { ...item, ...{selected: true}});
          newSelectedData4.push(Object.assign(item, {selected: true}))
        }
        setFilteredQuestionnaires(newData4)
        setAddedQuestionnaires(newSelectedData4)
        break;
      case "Study Procedures": 
        let index5 = filteredStudyProcedures.findIndex((d) => item['Standard Event'] == d['Standard Event'])
        const newData5 = [...filteredStudyProcedures]
        const newSelectedData5 = [...addedStudyProcedures]

        if(item.selected){
          newData5.splice(index5, 1, { ...item, ...{selected: false, condition: [], totalVisit: 0}});
          let selectedIndex = addedStudyProcedures.findIndex((d) => item['Standard Event'] == d['Standard Event'])
          newSelectedData5.splice(selectedIndex, 1)
        } else {
          newData5.splice(index5, 1, { ...item, ...{selected: true}});
          newSelectedData5.push(Object.assign(item, {selected: true}))
        }
        setFilteredStudyProcedures(newData5)
        setAddedStudyProcedures(newSelectedData5)
        break;
      default: break;
    }
    handleEventChange([])
  }

  const showConfigureModal = () =>{
    setShowConfigure(true)
  }

  const handleOk = () => {
    setShowConfigure(false)
    setHiddeTags(false)
    if(numbers.visitNumber === editNumbers.visitNumber && numbers.weekNumber === editNumbers.weekNumber){
      return
    }
    let weeksArr = [];
    if(resetWeeks){
      let tempBurdenXAxis = []
      for(var num = 1; num <= numbers.visitNumber; num++){
        tempBurdenXAxis.push(num)
      }
      setBurdenXAxis(tempBurdenXAxis)
      //Re-generate whole weeks when no change in SOA
      if (numbers.weekNumber < numbers.visitNumber){
        for(var num = 0; num < numbers.visitNumber - numbers.weekNumber + 1; num ++){
          weeksArr.push(1)
        }
        var size = weeksArr.length
        for(var num = 1; num <= numbers.visitNumber - size; num ++){
          weeksArr.push(num + 1)
        }
      } else if (numbers.weekNumber == numbers.visitNumber){
        for (let num = 1; num <= numbers.weekNumber; num ++){
          weeksArr.push(num)
        }
      } else {
        var quotient = Math.floor(numbers.weekNumber/numbers.visitNumber)
        weeksArr.push(1)
        if (numbers.visitNumber > 2){
          if ((numbers.visitNumber - 1) * (quotient + 1) - 1 >= numbers.weekNumber){
            quotient = quotient - ((numbers.visitNumber - 1) * (quotient + 1) - numbers.weekNumber) / numbers.visitNumber
          }
          for(let num = 2; num < numbers.visitNumber; num ++){
            weeksArr.push(Math.floor(num * (quotient + 1) - 1))
          }
        }
        if (numbers.visitNumber > 1){
          weeksArr.push(numbers.weekNumber)
        }
      }
      // weeksArr.push(1)
      // let week = Math.floor((numbers.weekNumber-1) / (numbers.visitNumber-1));
      // let sum = 1;
      // for (var i = 1; i <= numbers.visitNumber-1; i++) {
      //   sum = sum + week;
      //   if (sum > numbers.weekNumber || i === numbers.visitNumber - 1) sum = numbers.weekNumber;
      //   weeksArr.push(sum)
      // }
    } else {
      //Keep weeks options as much as possiable after SOA changed
      let week = 0;
      if(numbers.visitNumber > editNumbers.visitNumber && numbers.weekNumber > weeks[weeks.length - 1]){
        week = Math.floor((numbers.weekNumber - weeks[weeks.length - 1]) / (numbers.visitNumber - editNumbers.visitNumber));
      }
      let sum = 0;
      for (var i = 1; i <= numbers.visitNumber; i++) {
        if(weeks.length >= i){
          weeksArr.push(weeks[i-1])
          sum = weeks[i-1]
        } else {
          sum += week;
          if (sum > numbers.weekNumber || i === numbers.visitNumber) sum = numbers.weekNumber;
          weeksArr.push(sum)
        }
      }
    }
    
    setWeeks(weeksArr)
    setEditNumbers(numbers)
    setPatientChartColor(iChartColors)
    setBurdenChartColor(burdenColors.inactive)
    setLabelColors(iLabelColors)
    setEventCriteria({
      'Finished' : false
    })
  }

  const exportEvent = () =>{
    let str='Schedule of Events\n' + ',' + ',' + 'Visit'
    for(let i = 1; i <= numbers.visitNumber; i ++){
      str += ',' + i
    }

    str += '\n' + ',' + ',' + 'Week'
    for(let w = 0; w < weeks.length; w ++){
      str += ',' + weeks[w]
    }

    str += '\n' + ',' + ',' + 'Burden'
    for(let b = 0; b < burdenData.length; b ++){
      str += ',' + burdenData[b]
    }

    str += '\n' + 'Category' + ',Activity' + ',Cost'
    
    str += getEventContent(CATEGORY_LABS, addedLabs)
    str += getEventContent(CATEGORY_PHYSICAL_EXAMINATION, addedExamination)
    str += getEventContent(CATEGORY_PROCEDURES, addedProcedures)
    str += getEventContent(CATEGORY_QUESTIONNAIRES, addedQuestionnaires)
    str += getEventContent(CATEGORY_STUDY_PROCEDURES, addedStudyProcedures)

    props.handleSOAExport(str)
    // let exportContent = "\uFEFF";
    //   let blob = new Blob([exportContent + str], {
    //     type: "text/plain;charset=utf-8"
    //   });
  
    //   const date = Date().split(" ");
    //   const dateStr = date[1] + '_' + date[2] + '_' + date[3] + '_' + date[4];
    //   FileSaver.saveAs(blob, `SoA_${dateStr}.csv`);
  }

  function getEventContent(catrgory, events) {
    let subStr = ''
    for(const event in events){
      subStr += '\n' + catrgory + ',"' + events[event]['Standard Event'] + '",' + events[event]['Dummy Cost']
      if(events[event]['condition'].length > 0){
        for(const idx in events[event]['condition']){
          subStr += ',' + (events[event]['condition'][idx].checked ? 'x' : '')
        }
      }
    }
    return subStr
  }

  const formatter = (value) => {
    return value+'%'
  }

  const getFrequency = (value) => {

    setMinV(value[0])
    setMaxV(value[1])

    setFilteredLabs(filterLibs(orgLabs, addedLabs, value[0], value[1]))
    setFilteredExamination(filterLibs(orgExamination, addedExamination, value[0], value[1]))
    setFilteredQuestionnaires(filterLibs(orgQuestionnaires, addedQuestionnaires, value[0], value[1]))
    setFilteredProcedures(filterLibs(orgProcedures, addedProcedures, value[0], value[1]))
    setFilteredStudyProcedures(filterLibs(orgStudyProcedures, addedStudyProcedures, value[0], value[1]))
  }

   

  return (
    <div className="soa-content">
      <div className={`side-toolbar ${eventLib !== "0px" ? 'hidden' : ''}`} onClick={()=> setEventLib("300px")}>
        <div className="panel-label">Event Library</div>
        <div className="icon">&nbsp;<ArrowRightOutlined />&nbsp;</div>
      </div>
      <Row>
        <Col flex={eventLib} className={`event-left-container ${eventLib === "0px" ? 'hidden' : ''}`}>
          <Row style={{backgroundColor: '#F8F8F8'}}>
            <Col span={24}>
              <div className="item-header">
                <Row>
                  <Col span={20}>
                    <span>Event Library</span>
                  </Col>
                  <Col span={2}>
                  <Tooltip title={'View Historical Trial SOA'}>
                    <HistoryOutlined className="right-icon" onClick={() => props.setVisibleSOA(true)}></HistoryOutlined>
                  </Tooltip>
                  </Col>
                  <Col span={2}>
                  <Tooltip title={'Collapse Event Library'}>
                    <CloseOutlined className="right-icon" onClick={() => setEventLib("0px")}></CloseOutlined>
                  </Tooltip>
                  </Col>
                </Row>
                
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
                    <span>Select / Unselect events from library</span>
                  </div>
                </Col>
                <Col span={8} style={{textAlign:'right', paddingRight:'10px', fontSize:'14px'}}>
                  <Row>
                  <Col span={24}><span className="frequency" style={{ display: "block",width: "100px" }}>EVENT FREQUENCY</span></Col>
                  </Row>
                  <Row style={{width:'100%'}}>
                  <Col span={24}>
                    <div id="freqModal" ref={null} onClick={() => setVisibleSlider(true)}>
                      <span className="label">
                        {minV}%-{maxV}%
                      </span>
                      <EditFilled className={`${visibleSlider ? 'active' : ''}`}/>
                    </div>
                    </Col>
                  </Row>
                </Col>
              </Row>
              {visibleSlider ? (
              <div className="freqSection">
                <div className="title">
                  <span>Set Frequency</span>
                  <CloseOutlined
                    className="right-icon"
                    onClick={() => setVisibleSlider(false)}
                  ></CloseOutlined>
                </div>
                <br/>
                <div className="content">
                  <span>Criteria Frequency</span>
                  <span style={{ float: "right", fontWeight: 'bold' }}>
                    {minV}% - {maxV}%
                  </span>
                </div>
                <Slider
                  range={{ draggableTrack: true }}
                  defaultValue={[minV, maxV]}
                  tipFormatter={formatter}
                  onAfterChange={getFrequency}
                />
              </div>
              ) : (
              <></>
              )}
              <Row className="event-section">
                <Col span={24}>
                <Collapse className="eventLib" collapsible="header" onChange={callback} activeKey={activeCollapse}>
                  <Panel showArrow={false} header={eventLibHeader(CATEGORY_LABS, filteredLabs.length, "1")} key="1">
                    {filteredLabs.length>0 ? (
                      <Table dataSource={filteredLabs} columns={columns} pagination={false} showHeader={false} 
                      locale={{emptyText: 'No Data'}} rowKey={record => record['Standard Event']}/>
                    ): (
                      <></>
                    )}
                  </Panel>
                </Collapse>
                </Col>
              </Row>
              <Row className="event-section">
                <Col span={24}>
                <Collapse className="eventLib" collapsible="header" onChange={callback} activeKey={activeCollapse}>
                  <Panel showArrow={false} header={eventLibHeader(CATEGORY_PHYSICAL_EXAMINATION, filteredExamination.length, "2")} key="2">
                    {filteredExamination.length>0 ? (
                      <Table dataSource={filteredExamination} columns={columns} pagination={false} showHeader={false} 
                        locale={{emptyText: 'No Data'}} rowKey={record => record['Standard Event']}/>
                    ): (
                      <></>
                    )}
                  </Panel>
                </Collapse>
                </Col>
              </Row>
              <Row className="event-section">
                <Col span={24}>
                <Collapse className="eventLib" collapsible="header" onChange={callback} activeKey={activeCollapse}>
                  <Panel showArrow={false} header={eventLibHeader(CATEGORY_PROCEDURES, filteredProcedures.length, "3")} key="3">
                    {filteredProcedures.length>0 ? (
                      <Table dataSource={filteredProcedures} columns={columns} pagination={false} showHeader={false} 
                        locale={{emptyText: 'No Data'}} rowKey={record => record['Standard Event']}/>
                    ): (
                      <></>
                    )}
                  </Panel>
                </Collapse>
                </Col>
              </Row>
              <Row className="event-section">
                <Col span={24}>
                <Collapse className="eventLib" collapsible="header" onChange={callback} activeKey={activeCollapse}>
                  <Panel showArrow={false} header={eventLibHeader(CATEGORY_QUESTIONNAIRES, filteredQuestionnaires.length, "4")} key="4">
                    {filteredQuestionnaires.length>0 ? (
                      <Table dataSource={filteredQuestionnaires} columns={columns} pagination={false} showHeader={false} 
                        locale={{emptyText: 'No Data'}} rowKey={record => record['Standard Event']}/>
                    ): (
                      <></>
                    )}
                  </Panel>
                </Collapse>
                </Col>
              </Row>
              <Row className="event-section">
                <Col span={24}>
                <Collapse className="eventLib" collapsible="header" onChange={callback} activeKey={activeCollapse}>
                  <Panel showArrow={false} header={eventLibHeader(CATEGORY_STUDY_PROCEDURES, filteredStudyProcedures.length, "5")} key="5">
                    {filteredStudyProcedures.length>0 ? (
                      <Table dataSource={filteredStudyProcedures} columns={columns} pagination={false} showHeader={false} 
                        locale={{emptyText: 'No Data'}} rowKey={record => record['Standard Event']}/>
                    ): (
                      <></>
                    )}
                  </Panel>
                </Collapse>
                </Col>
              </Row>
            </Col>
            <Col flex="none">
              <div style={{ padding: '0 10px' }}></div>
            </Col>
          </Row>
        </Col>
        <Col flex="auto" className="event-right-container">
          <div style={{ padding: '10px 20px 0px 20px' }}>
            
            <Spin spinning={showConfigure}>
            <Row>
              
              <Col span={5} className={`${hiddeTags ? 'hidde' : ''}`}>
                <span className="none-click right">
                Number of Visits <InputNumber size="small" value={numbers.visitNumber} />
                </span>
              </Col>
              <Col span={6} className={`center ${hiddeTags ? 'hidde' : ''}`}>
                <span className="none-click">
                  Number of Weeks <InputNumber size="small" value={numbers.weekNumber} />&nbsp;
                </span>
                <EditFilled className="edit-icon" onClick={showConfigureModal}/>
              </Col>
              <Col span={3} className={`${hiddeTags ? 'hidde' : ''}`}>
                <Dropdown.Button style={{zIndex: 1}} size="small"
                  overlay={
                    <Menu>
                      <Menu.Item key="csv" onClick={exportEvent}>CSV</Menu.Item>
                    </Menu>
                  }
                  icon={<DownOutlined />}>
                  <DownloadOutlined />
                  EXPORT AS
                </Dropdown.Button>
              </Col>

              <Col span={24} className={`${hiddeTags ? 'hidde' : ''}`}>
              <Collapse defaultActiveKey={['1']} onChange={excluCallback} expandIconPosition="right" className="event-chart">
                <Panel header={panelHeader()} key="1">
                  <Row>
                    <Col span={8}>
                      <ReactECharts option={costOption} style={{ height: 175}}/>
                      <div style={{paddingLeft: '50%', fontSize: '14px', color: '#999'}}>
                        <span>Click on each metric to filter</span>
                      </div>
                    </Col>
                    <Col span={8}>

                      <ReactECharts option={burdenOption} style={{ height: 200}}/>
                    </Col>
                    <Col span={8}>
                      <ReactECharts option={modalityOption} style={{ height: 200}}/>
                    </Col>
                  </Row>
                </Panel>
              </Collapse>
              </Col>

              <Col span={24} style={{height: '25px'}}></Col>

              <Col span={24}>
                <div className="event-dashboard-container">
                    <EventList
                    endpoints={endpoints}
                      saveEvents={saveEvents}
                      exportEvent={exportEvent}
                      handleEventChange={handleEventChange}
                      numbers={editNumbers}
                      // updateNumbers={setNumbers}
                      labs={addedLabs}
                      examination={addedExamination}
                      procedures={addedProcedures}
                      questionnaire={addedQuestionnaires}
                      studyProcedures={addedStudyProcedures}
                      weeks={weeks}
                      submitType={submitType}
                      updateWeeks={setWeeks}
                    />
                </div>
              </Col>
            </Row>
            </Spin>
        </div>
        </Col>
      </Row>

      <Modal visible={showConfigure} title="" closable={false} mask={false}
        footer={null} style={{ left: '12%', top:200 }} centered={false} > 
        <Row className="configure-title">
         <span>Configure Schedule Of Events Table</span>
        </Row>
        <br/>
        <Row className="modal-filed">
          <Col span={12} className="label"><span>Number of Visits</span></Col>
          <Col span={12} className="input-number"><InputNumber min={1} step={1} onStep={onStepVisit} onChange={onChangeVisit} value={numbers.visitNumber} /></Col>
        </Row>
        <Row className="modal-filed">
          <Col span={12} className="label"><span>Number of Weeks</span></Col>
          <Col span={12} className="input-number"><InputNumber min={1} step={1} onStep={onStepWeek} onChange={onChangeWeek} value={numbers.weekNumber} /></Col>
        </Row>
        <Row style={{justifyContent: 'center', paddingTop: '20px'}}>
          <Button type="primary" className="step-btn create-btn" onClick={handleOk}>CREATE</Button>
        </Row>
      </Modal>
    </div>
  );
};

export default ScheduleEvents;
