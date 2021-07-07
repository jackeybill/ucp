import React, { useState, useReducer, useEffect } from "react";
import {Table, Collapse, Slider, Dropdown,Menu, Modal, Row, Col, InputNumber, Tooltip, Button, Spin} from "antd";
import {ArrowRightOutlined, CloseOutlined, EditFilled, MinusOutlined, PlusOutlined, DownOutlined, DownloadOutlined} from "@ant-design/icons";
import {getStandardEvents} from "../../utils/ajax-proxy";
import ReactECharts from 'echarts-for-react';
import "./index.scss";
import EvetnList from '../EventList';

const { Panel } = Collapse;

const iChartColors = ['#514c4a', '#65615f', '#86817f', '#a59e9b']
const aChartColors = ['#d04a02', '#ed7738', '#ed9d72', '#f5b795']

const defaultCostValue = [
  {value: 0, name: 'Physical Metrics'},
  {value: 0, name: 'Materials Distribution'},
  {value: 0, name: 'Lab Test / Samples'},
  {value: 0, name: 'Dosing / Intervention'}
]

const defaultBurdenValue = [
  {value: 0, name: 'Physical Metrics'},
  {value: 0, name: 'Materials Distribution'},
  {value: 0, name: 'Lab Test / Samples'},
  {value: 0, name: 'Dosing / Intervention'}
]

const initialNumber = {
  visitNumber: 9,
  weekNumber: 26
}

const ScheduleEvents = (props) => {

  const [hiddeTags, setHiddeTags] = useState(true)
  const [showConfigure, setShowConfigure] = useState(true)
  const [eventLib, setEventLib] = useState(6)
  const [activeCollapse, setActiveCollapse] = useState(['1'])
  const [numbers, setNumbers] = useReducer(
    (state, newState) => ({ ...state, ...newState }),
    { ...initialNumber }
  );

  //Cost Per Patient Chart
  const [patientChartColor, setPatientChartColor] = useState(iChartColors)
  const [costData, setCostData] = useState(defaultCostValue)
  const [costSubTitle, setCostSubTitle] = useState("Average from Similar Historical \nTrials - $10.1K / Patient")
  const [showPatientLabel, setShowPatientLabel] = useState(false)
  const [patientRate, setPatientRate] = useState('{p|$9.4K}\n{good|GOOD}')

  //Patirnt Burden Chart
  const [burdenData, setBurdenData] = useState(defaultBurdenValue)
  const [burdenSubTitle, setBurdenSubTitle] = useState("Average from similar Historical \nTrials - 60")
  const [burdenXAxis, setBurdenXAxis] = useState(['1', '2', '3', '4', '5', '6', '7', '8', '9'])
  const [showTooltip, setShowTooltip] = useState(false)

  //Event Libs
  //Original data from backend
  const [orgMetrics, setOrgMetrics] = useState([])
  const [orgDistribution, setOrgDistribution] = useState([])
  const [orgLabSample, setOrgLabSample] = useState([])
  const [orgDiagnostics, setOrgDiagnostics] = useState([])
  const [orgDosing, setOrgDosing] = useState([])
  const [orgSurveys, setOrgSurveys] = useState([])

  //Filtered data based on the frequency and original data
  let [filteredMetrics, setFilteredMetrics] = useState([])
  let [filteredDistribution, setFilteredDistribution] = useState([])
  let [filteredLabSample, setFilteredLabSample] = useState([])
  let [filteredDiagnostics, setFilteredDiagnostics] = useState([])
  let [filteredDosing, setFilteredDosing] = useState([])
  let [filteredSurveys, setFilteredSurveys] = useState([])

  //Addedd data 
  let [addedMetrics, setAddedMetrics] = useState([])
  let [addedDistribution, setAddedDistribution] = useState([])
  let [addedLabSample, setAddedLabSample] = useState([])
  let [addedDiagnostics, setAddedDiagnostics] = useState([])
  let [addedDosing, setAddedDosing] = useState([])
  let [addedSurveys, setAddedSurveys] = useState([])

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

  function excluCallback(key) {
  }

  useEffect(() => {

    const getStandardEventsLib = async () => {
      var resp = await getStandardEvents();

      if (resp.statusCode == 200) {
          const response = JSON.parse(resp.body)
          console.log(response)
          setOrgMetrics(response['Physical Examination'])
          // setOrgDistribution(response.)
          setOrgLabSample(response.Labs)
          // setOrgDiagnostics(response.)
          // setOrgDosing(response.)
          setOrgSurveys(response.Questionnaires)


          setFilteredMetrics(response['Physical Examination'].filter((d) => {
            return Object.assign(d, {selected: false})
          }))
          // setOrgDistribution(response.)
          setFilteredLabSample(response.Labs.filter((d) => {
            return Object.assign(d, {selected: false})
          }))
          // setOrgDiagnostics(response.)
          // setOrgDosing(response.)
          setFilteredSurveys(response.Questionnaires.filter((d) => {
            return Object.assign(d, {selected: false})
          }))
      }
    };
    getStandardEventsLib();
  }, []);

  const panelHeader = () => {
    return (
        <div className="event-panelHeader">
            <div>
                <div style={{fontWeight: 'bold', fontSize: '16px'}}><span>Impact</span></div>
            </div>
        </div>
    );
  };

  const eventLibHeader = (name, count, key) => {
    return (
      <Row className="section-header">
        <Col span={23}><span>{name}</span><span className="count-span">{count}</span></Col>
        <Col span={1}>{activeCollapse.indexOf(key) >= 0 ?(<MinusOutlined />):(<PlusOutlined />)}</Col>
      </Row>
    );
  };

  const burdenOption = {
    title : {
      text: 'Patient Burden',
      subtext: burdenSubTitle,
      x:'left',
      y:'center',
      textStyle: {
        fontSize: 14,
        fontWeight: 'bold'
      },
      subtextStyle: {
        fontSize: 12,
        fontWeight: 'normal'
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
        left: '50%',
        right: '4%',
        top: '5%',
        bottom: '10%',
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
          nameRotate: 0, nameGap: 20,
          axisTick: {
              alignWithLabel: true
          }
        }
    ],
    yAxis: [
        { type: 'value', name:'Patient Burden', 
        nameRotate: 90, nameGap: 40, nameLocation: "middle", 
        axisLine: { lineStyle: { color: '#333' } }, 
        axisLabel : { formatter : function(value) { return value; } }, }
    ],
    series: [
        {
            name: 'Patient Burder',
            type: 'bar',
            barWidth: '60%',
            color:'#ed7738',
            data: burdenData
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
        fontSize: 14,
        fontWeight: 'bold'
      },
      subtextStyle: {
        fontSize: 12,
        fontWeight: 'normal'
      }
    },
    legend: {
      x:'left',
      y:'40/%',
      orient: 'vertical',
      itemHeight: 7,
      textStyle: {
        fontSize: 10
      },
      data: ['Physical Metrics', 'Materials Distribution', 'Lab Test / Samples', 'Dosing / Intervention']
    },
    tooltip: {
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
              color: '#aba9a9',
              fontSize: 16,
              backgroundColor: "white"
            },
            good: {
              color: 'green',
              fontSize: 8,
              fontWeight:'bold',
              backgroundColor: "white"
            },
            fair: {
              color: 'gray',
              fontSize: 8,
              fontWeight:'bold',
              backgroundColor: "white"
            },
            poor: {
              color: '#c33232',
              fontSize: 8,
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

  const callback = (key) => {
    setActiveCollapse(key)
  }

  const columns = [{
    title: 'Standard Event',
    dataIndex: 'Standard Event',
    key: 'Standard Event',
    width: '70%'
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
    // console.log(item.Categories)
    switch(item.Categories){
      case "Physical Examination": 
        let index = filteredMetrics.findIndex((d) => item['Standard Event'] == d['Standard Event'])
        const newData = [...filteredMetrics]
        const newSelectedData = [...addedMetrics]

        if(item.selected){
          newData.splice(index, 1, { ...item, ...{selected: false}});
          let selectedIndex = addedMetrics.findIndex((d) => item['Standard Event'] == d['Standard Event'])
          newSelectedData.splice(selectedIndex, 1)
        } else {
          newData.splice(index, 1, { ...item, ...{selected: true}});
          newSelectedData.push(Object.assign(item, {selected: true}))
        }
        setFilteredMetrics(newData)
        setAddedMetrics(newSelectedData)
        break;

      case "Labs": 
        let index2 = filteredLabSample.findIndex((d) => item['Standard Event'] == d['Standard Event'])
        const newData2 = [...filteredLabSample]
        const newSelectedData2 = [...addedLabSample]

        if(item.selected){
          newData2.splice(index2, 1, { ...item, ...{selected: false}});
          let selectedIndex = addedLabSample.findIndex((d) => item['Standard Event'] == d['Standard Event'])
          newSelectedData2.splice(selectedIndex, 1)
        } else {
          newData2.splice(index2, 1, { ...item, ...{selected: true}});
          newSelectedData2.push(Object.assign(item, {selected: true}))
        }
        setFilteredLabSample(newData2)
        setAddedLabSample(newSelectedData2)
        break;

      case "Questionnaires": 
        let index3 = filteredSurveys.findIndex((d) => item['Standard Event'] == d['Standard Event'])
        const newData3 = [...filteredSurveys]
        const newSelectedData3 = [...addedSurveys]

        if(item.selected){
          newData3.splice(index3, 1, { ...item, ...{selected: false}});
          let selectedIndex = addedSurveys.findIndex((d) => item['Standard Event'] == d['Standard Event'])
          newSelectedData3.splice(selectedIndex, 1)
        } else {
          newData3.splice(index3, 1, { ...item, ...{selected: true}});
          newSelectedData3.push(Object.assign(item, {selected: true}))
        }
        setFilteredSurveys(newData3)
        setAddedSurveys(newSelectedData3)
        break;

      case "Procedures": break;
      case "Study Procedures": break;
      default: break;
    }
  }

  const showConfigureModal = () =>{
    setShowConfigure(true)
  }

  const handleOk = () => {
    setShowConfigure(false)
    setHiddeTags(false)
  }

  return (
    <div className="tab-container">
      <div className={`side-toolbar ${eventLib > 0 ? 'hidden' : ''}`} onClick={()=> setEventLib(6)}>
        <div className="panel-label">Event Library</div>
        <div className="icon">&nbsp;<ArrowRightOutlined />&nbsp;</div>
      </div>
      <Row>
        <Col span={eventLib} className="event-left-container">
          <Row style={{backgroundColor: '#f3f3f3'}}>
            <Col span={24}>
              <div className="item-header">
                <Row>
                  <Col span={21}>
                    <span>Event Library</span>
                  </Col>
                  <Col span={3}>
                  <Tooltip title={'Collapse Event Library'}>
                    <CloseOutlined className="right-icon" onClick={() => setEventLib(0)}></CloseOutlined>
                  </Tooltip>
                  </Col>
                </Row>
                
              </div>
            </Col>
          </Row>
          <Row style={{borderBottom:'10px solid #f3f3f3'}}>
            <Col flex="none">
              <div style={{ padding: '0 10px' }}></div>
            </Col>
            <Col className="left-section">
              <Row style={{alignItems: 'center', marginBottom: '10px'}}>
                <Col span={16}>
                  <div className="item-option">
                    <span>Select / Unselect events from library</span>
                  </div>
                </Col>
                <Col span={8} style={{textAlign:'right', paddingRight:'10px', fontSize:'14px'}}>
                  <Row>
                  <Col span={24}><span>EVENT FREQUENCY</span></Col>
                  </Row>
                  <Row style={{width:'100%'}}>
                  <Col span={24}>
                    <div id="freqModal" ref={null}>
                      <span className="label">
                        80%-100%
                      </span>
                      <EditFilled />
                    </div>
                    </Col>
                  </Row>
                </Col>
              </Row>
              <Row className="event-section">
                <Col span={24}>
                <Collapse className="eventLib" collapsible="header" onChange={callback} activeKey={activeCollapse}>
                  <Panel showArrow={false} header={eventLibHeader('Physical Metrics', filteredMetrics.length, "1")} key="1">
                    <Table dataSource={filteredMetrics} columns={columns} pagination={false} showHeader={false} 
                      locale={{emptyText: 'No Data'}} rowKey={record => record['Standard Event']}/>
                  </Panel>
                </Collapse>
                </Col>
              </Row>
              <Row className="event-section">
                <Col span={24}>
                <Collapse className="eventLib" collapsible="header" onChange={callback} activeKey={activeCollapse}>
                  <Panel showArrow={false} header={eventLibHeader('Materials Distribution', filteredDistribution.length, "2")} key="2">
                    <Table dataSource={filteredDistribution} columns={columns} pagination={false} showHeader={false} 
                      locale={{emptyText: 'No Data'}} rowKey={record => record['Standard Event']}/>
                  </Panel>
                </Collapse>
                </Col>
              </Row>
              <Row className="event-section">
                <Col span={24}>
                <Collapse className="eventLib" collapsible="header" onChange={callback} activeKey={activeCollapse}>
                  <Panel showArrow={false} header={eventLibHeader('Lab Test / Samples', filteredLabSample.length, "3")} key="3">
                    <Table dataSource={filteredLabSample} columns={columns} pagination={false} showHeader={false} 
                      locale={{emptyText: 'No Data'}} rowKey={record => record['Standard Event']}/>
                  </Panel>
                </Collapse>
                </Col>
              </Row>
              <Row className="event-section">
                <Col span={24}>
                <Collapse className="eventLib" collapsible="header" onChange={callback} activeKey={activeCollapse}>
                  <Panel showArrow={false} header={eventLibHeader('Diagnostics / Procedures', filteredDiagnostics.length, "4")} key="4">
                    <Table dataSource={filteredDiagnostics} columns={columns} pagination={false} showHeader={false} 
                      locale={{emptyText: 'No Data'}} rowKey={record => record['Standard Event']}/>
                  </Panel>
                </Collapse>
                </Col>
              </Row>
              <Row className="event-section">
                <Col span={24}>
                <Collapse className="eventLib" collapsible="header" onChange={callback} activeKey={activeCollapse}>
                  <Panel showArrow={false} header={eventLibHeader('Dosing / Intervention', filteredDosing.length, "5")} key="5">
                    <Table dataSource={filteredDosing} columns={columns} pagination={false} showHeader={false} 
                      locale={{emptyText: 'No Data'}} rowKey={record => record['Standard Event']}/>
                  </Panel>
                </Collapse>
                </Col>
              </Row>
              <Row className="event-section">
                <Col span={24}>
                <Collapse className="eventLib" collapsible="header" onChange={callback} activeKey={activeCollapse}>
                  <Panel showArrow={false} header={eventLibHeader('Questionaries / Surveys', filteredSurveys.length, "6")} key="6">
                    <Table dataSource={filteredSurveys} columns={columns} pagination={false} showHeader={false} 
                      locale={{emptyText: 'No Data'}} rowKey={record => record['Standard Event']}/>
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
        <Col span={24 - eventLib} className="event-right-container">
          <div style={{ padding: '10px 20px 0px 20px' }}>
            <Row>
              <Col span={24}><h4>Schedule of Events</h4></Col>
            </Row>
            <Spin spinning={showConfigure}>
            <Row>
              <Col span={11}>
                <span className="tip1-desc">
                  Use the historical event library on the left to build the Schedule of Events.
                </span>
              </Col>
              <Col span={4} className={`${hiddeTags ? 'hidde' : ''}`}>
                <span className="tip1-desc none-click">
                Number of Visits <InputNumber size="small" value={numbers.visitNumber} />
                </span>
              </Col>
              <Col span={6} className={`center ${hiddeTags ? 'hidde' : ''}`}>
                <span className="tip1-desc center none-click">
                  Number of Weeks <InputNumber size="small" value={numbers.weekNumber} />&nbsp;
                </span>
                <EditFilled className="edit-icon" onClick={showConfigureModal}/>
              </Col>
              <Col span={3} className={`${hiddeTags ? 'hidde' : ''}`}>
                <Dropdown.Button style={{zIndex: 1}} size="small"
                  overlay={
                    <Menu>
                      <Menu.Item key="json" onClick={null}>JSON</Menu.Item>
                      <Menu.Item key="pdf" onClick={null}>PDF</Menu.Item>
                      <Menu.Item key="csv" onClick={null}>CSV</Menu.Item>
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
                    <Col span={12}>
                      <ReactECharts option={costOption} style={{ height: 140}}/>
                      <div style={{paddingLeft: '50%'}}>
                        <span>Click on each metrics to filter</span>
                      </div>
                    </Col>
                    <Col span={12}>
                      <ReactECharts option={burdenOption} style={{ height: 150}}/>
                    </Col>
                  </Row>
                </Panel>
              </Collapse>
              </Col>

              <Col span={24} style={{height: '25px'}}></Col>

              <Col span={24}>
                <div className="event-dashboard-container">
                  <EvetnList/>
                </div>
              </Col>
            </Row>
            </Spin>
        </div>
        </Col>
      </Row>

      <Modal visible={showConfigure} title="" closable={false} mask={false}
        footer={null} style={{ left: '12%', top:200 }} centered={false} > 
        <Row style={{justifyContent: 'center'}}>
         <span style={{fontSize: 16, fontWeight: 'bold'}}>Configure Schedule Of Events Table</span>
        </Row>
        <br/>
        <Row style={{justifyContent: 'center'}}>
         <span >Aliquam faucibus, odio nec commodo aliquam, neque felis placerat dui, a porta ante lectus dapibus</span>
        </Row>
        <br/>
        <Row className="modal-filed">
          <Col span={12} className="label"><span>Number of Visits</span></Col>
          <Col span={12} className="input-number"><InputNumber min={1} max={10} step={1} onStep={onStepVisit} value={numbers.visitNumber} /></Col>
        </Row>
        <Row className="modal-filed">
          <Col span={12} className="label"><span>Number of Weeks</span></Col>
          <Col span={12} className="input-number"><InputNumber min={1} max={26} step={1} onStep={onStepWeek} value={numbers.weekNumber} /></Col>
        </Row>
        <Row style={{justifyContent: 'center', paddingTop: '20px'}}>
          <Button type="primary" className="step-btn" onClick={handleOk}>CREATE</Button>
        </Row>
      </Modal>
    </div>
  );
};

export default ScheduleEvents;
