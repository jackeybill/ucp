import React, { useState, useReducer, useEffect } from "react";
import {Button, Collapse, Slider, Dropdown,Menu, Modal, Row, Col, InputNumber, Tabs, Tooltip, Checkbox, Input, message, Steps} from "antd";
import {LeftOutlined, HistoryOutlined, CloseOutlined, EditFilled, MinusOutlined, PlusOutlined, DownOutlined,DownloadOutlined} from "@ant-design/icons";

import "./index.scss";

import CustomChart from "../CustomChart";

const { Panel } = Collapse;

const defaultMatrixsList = [
  {name: 'Height', selected: false},
  {name: 'Weight', selected: false},
  {name: 'Blood Pressure', selected: false},
  {name: 'Waist Circumference', selected: false}
]

const ScheduleEvents = (props) => {

  const [activeTab, setActiveTab] = useState([1,0,0,0,0,0])
  const [matrixsList, setMatrixsList] = useState(defaultMatrixsList)

  const onStep = (value: number, info: { offset: number, type: 'up' | 'down' }) => {}

  function excluCallback(key) {
  }

  const selectMatrix = (idx) => {
    let tempList = [...matrixsList]
    let tempItem = matrixsList[idx]
    if(matrixsList[idx].selected){
      tempItem.selected = false
    } else {
      tempItem.selected = true
    }
    tempList.splice(idx, 1, tempItem)
    setMatrixsList(tempList)
  }

  const collapseSectionBar = (index) => {
    let tempActievTab = [...activeTab]
    var tempvalue
    if(activeTab[index] === 0){
      tempvalue = 1
    } else {
      tempvalue = 0
    }
    tempActievTab.splice(index, 1, tempvalue)
    setActiveTab(tempActievTab)
  }

  const panelHeader = () => {
    return (
        <div className="event-panelHeader">
            <div>
                <div className="bar-desc"><span>Impact</span></div>
                <div className="item-desc"><div className="bar-item item1"></div><span>Pre-Screening / Screening</span></div>
                <div className="item-desc"><span className="bar-item item2"></span><span>Physical Metrics</span></div>
                <div className="item-desc"><span className="bar-item item3"></span><span>Materials Distribution</span></div>
                <div className="item-desc"><span className="bar-item item4"></span><span>Lab Test / Samples</span></div>
                <div className="item-desc"><span className="bar-item item5"></span><span>Dosing / Intervention</span></div>
            </div>
        </div>
    );
  };

const iChartColors = ['#514c4a', '#65615f', '#86817f', '#a59e9b', '#c2c1c1']
const aChartColors = ['#d04a02', '#ed7738', '#ed9d72', '#f5b795']

const defaultCostValue = [
  {value: 620, name: 'Pre-Screening / Screening'},
  {value: 1560, name: 'Physical Metrics'},
  {value: 1875, name: 'Materials Distribution'},
  {value: 2200, name: 'Lab Test / Samples'},
  {value: 3125, name: 'Dosing / Intervention'}
]

const defaultBurdenValue = [
  {value: 620, name: 'Pre-Screening / Screening'},
  {value: 1560, name: 'Physical Metrics'},
  {value: 1875, name: 'Materials Distribution'},
  {value: 2200, name: 'Lab Test / Samples'},
  {value: 3125, name: 'Dosing / Intervention'}
]

  const burdenOption = {
    title : {
      text: 'Patient Burden',
      subtext: "Average from similar Historical \nTrials - 60",
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
          data: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
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
            data: [60, 72, 78, 75, 83, 78, 68, 84, 90]
        }
    ]
};

  const costOption = {
    title : {
      text: 'Cost Per Patient',
      subtext: "Average from Similar Historical \nTrials - $10.1K / Patient",
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
      trigger: 'item',
      formatter: '{b} - ${c}',
      extraCssText:'background:#757373;color:white;font-size:8px'
    },
    series: [
      {
        type: 'pie',
        center: ['60%', '50%'],
        radius: ['50%', '80%'],
        avoidLabelOverlap: false,
        label: {
          show: true,
          position: 'center',
          formatter: function (params) {
            return '{p|$9.4K}' + '\n{nm|GOOD}'
          },
          emphasis: {
            formatter: function (params) {
              if (params.dataIndex != 0) {
                return '{p|$9.4K}' + '\n{nm|GOOD}'
              }
            },
          },
          rich: {
            p: {
              fontSize: 16,
              backgroundColor: "white"
            },
            nm: {
              color: 'green',
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
        color: iChartColors,
        data: defaultBurdenValue
      }
    ]
  };

  return (
    <div className="tab-container">
      <Row>
        <Col span={6} className="event-left-container">
          <Row style={{backgroundColor: '#f3f3f3'}}>
            <Col span={24}>
              <div className="item-header">
                <span>Event Library</span>
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
                  <Row className="section-header">
                    <Col span={23}><span>Physical Metrics</span><span className="count-span">4</span></Col>
                    <Col span={1} onClick={()=> collapseSectionBar(0)}>{activeTab[0] === 1 ?(<MinusOutlined />):(<PlusOutlined />)}</Col>
                  </Row>
                  {matrixsList.map((medCon, idx) => {
                    return (
                      <Row className={`section-item ${activeTab[0] === 1? '':'hidde'}`} key={`matrix_${idx}`}>
                        <Col span={20}><span>{medCon.name}</span></Col>
                        <Col span={4} className="add" onClick={()=> selectMatrix(idx)}>
                          {medCon.selected ? (<span className="remove">Remove</span>):(<span>Add</span>)}</Col>
                      </Row>
                    );
                  })}
                </Col>
              </Row>
              <Row className="event-section">
                <Col span={24}>
                  <Row className="section-header">
                    <Col span={23}><span>Materials Distribution</span><span className="count-span">8</span></Col>
                    <Col span={1} onClick={()=> collapseSectionBar(1)}>{activeTab[1] === 1 ?(<MinusOutlined />):(<PlusOutlined />)}</Col>
                  </Row>
                </Col>
              </Row>
              <Row className="event-section">
                <Col span={24}>
                  <Row className="section-header">
                    <Col span={23}><span>Lab Test / Samples</span><span className="count-span">13</span></Col>
                    <Col span={1} onClick={()=> collapseSectionBar(2)}>{activeTab[2] === 1 ?(<MinusOutlined />):(<PlusOutlined />)}</Col>
                  </Row>
                </Col>
              </Row>
              <Row className="event-section">
                <Col span={24}>
                  <Row className="section-header">
                    <Col span={23}><span>Diagnostics / Procedures</span><span className="count-span">3</span></Col>
                    <Col span={1} onClick={()=> collapseSectionBar(3)}>{activeTab[3] === 1 ?(<MinusOutlined />):(<PlusOutlined />)}</Col>
                  </Row>
                </Col>
              </Row>
              <Row className="event-section">
                <Col span={24}>
                  <Row className="section-header">
                    <Col span={23}><span>Dosing / Intervention</span><span className="count-span">6</span></Col>
                    <Col span={1} onClick={()=> collapseSectionBar(4)}>{activeTab[4] === 1 ?(<MinusOutlined />):(<PlusOutlined />)}</Col>
                  </Row>
                </Col>
              </Row>
              <Row className="event-section">
                <Col span={24}>
                  <Row className="section-header">
                    <Col span={23}><span>Questionaries / Surveys</span><span className="count-span">4</span></Col>
                    <Col span={1} onClick={()=> collapseSectionBar(5)}>{activeTab[5] === 1 ?(<MinusOutlined />):(<PlusOutlined />)}</Col>
                  </Row>
                </Col>
              </Row>
            </Col>
            <Col flex="none">
              <div style={{ padding: '0 10px' }}></div>
            </Col>
          </Row>
        </Col>
        <Col span={18} className="event-right-container">
          <div style={{ padding: '10px 20px 0px 20px' }}>
            <Row>
              <Col span={24}><h4>Schedule of Events</h4></Col>
            </Row>
            <Row>
              <Col span={11}>
                <span className="tip1-desc">
                  Use the historical event library on the left to build the Schedule of Events.
                </span>
              </Col>
              <Col span={5}>
                <span className="tip1-desc right">
                Number of Visits <InputNumber size="small" min={1} max={10} step={1} onStep={onStep} defaultValue={3} />
                </span>
              </Col>
              <Col span={5}>
                <span className="tip1-desc center">
                Number of Weeks <InputNumber size="small" min={1} max={10} step={1} onStep={onStep} defaultValue={3} />
                </span>
              </Col>
              <Col span={3}>
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
            </Row>
            <Row>
              <Col span={24}>
              <Collapse defaultActiveKey={['1']} onChange={excluCallback} expandIconPosition="right" className="event-chart">
                <Panel header={panelHeader()} key="1">
                  <div className="chart-container">
                    <CustomChart
                      option={costOption}
                      height={120}
                    ></CustomChart>
                    <div className="filter-label">
                      <span>Click on each metrics to filter</span>
                    </div>
                  </div>
                  <div className="chart-container">
                    <CustomChart
                      option={burdenOption}
                      height={150}
                    ></CustomChart>
                  </div>
                </Panel>
              </Collapse>
              </Col>
            </Row>
            <Row>
            </Row>
        </div>
        </Col>
      </Row>
    </div>
  );
};

export default ScheduleEvents;
