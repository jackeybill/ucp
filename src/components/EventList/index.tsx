import React,{useState,useEffect} from "react";
import { Button, Collapse,Select,Input } from "antd";
import { CheckCircleFilled,CheckCircleTwoTone } from "@ant-design/icons";
import "./index.scss";

const { Panel } = Collapse;
const { Option } = Select;

const endpoints_map = [
  'Change in weight from baseline',
  'Change in FPG from baseline',
  '24-hour glucose profile',
  'Total number of weekly insulin injections to achieve glycemic'
]

const addedMetrics = [
  {
            "Standard Event": "12-lead ECG (central or local)",
            "Categories": "Procedures",
            "Dummy Cost": "140",
            "Anxiety Inducing": "1",
            "Hospital dependent": "0",
            "Physically Invasiveness": "1",
            "Blood Draw": "0",
            "Sedation": "0",
            "Injection": "0",
            "Urine": "0",
            "Requires Fasting": "0",
            "Longer than 2 hours": "0",
            "Questionnaire": "0",
            "selected": "false"
        },
        {
            "Standard Event": "Chest x-ray (posterior-anterior and lateral view) (local)",
            "Categories": "Procedures",
            "Dummy Cost": "60",
            "Anxiety Inducing": "1",
            "Hospital dependent": "0",
            "Physically Invasiveness": "1",
            "Blood Draw": "0",
            "Sedation": "0",
            "Injection": "1",
            "Urine": "0",
            "Requires Fasting": "0",
            "Longer than 2 hours": "0",
            "Questionnaire": "0",
            "selected": "false"
        },
        {
            "Standard Event": "Dilated fundoscopic examination",
            "Categories": "Procedures",
            "Dummy Cost": "100",
            "Anxiety Inducing": "1",
            "Hospital dependent": "0",
            "Physically Invasiveness": "1",
            "Blood Draw": "0",
            "Sedation": "0",
            "Injection": "0",
            "Urine": "0",
            "Requires Fasting": "0",
            "Longer than 2 hours": "0",
            "Questionnaire": "0",
            "selected": "false"
        }
 

]
  
  


const EventList = (props) => {
  console.log(props)
  const [metrics, setMetrics] = useState(addedMetrics)
  const { visitNumber, weekNumber } = props.numbers
  
  

  const renderVisit = () => {
    let visits = [];
     for (var i = 1; i <= visitNumber; i++) {
        visits.push(<div className="td">{i}</div>);
      }
    return (<>{visits}</>)
  }
  const renderWeek = () => {
    let weeks = [];
    let week = Math.floor(weekNumber / visitNumber)
    let remainder = weekNumber % visitNumber
    if (remainder > 0) week = week + 1
    console.log(week)
    let sum = 0;
    for (var i = 1; i <= visitNumber; i++) {
      sum = sum + week
      if(sum>weekNumber)sum=weekNumber
      weeks.push(<Input className="td" value={sum}/>)
      }
    return (<>{weeks}</>)
  }


  const endpointsSelector = () => {
    return (
      <Select
      showSearch
      style={{ width: '100%' }}
      placeholder="Search to Select"
      optionFilterProp="children"
      filterOption={(input, option) =>
        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
      }
      filterSort={(optionA, optionB) =>
        optionA.children.toLowerCase().localeCompare(optionB.children.toLowerCase())
      }
      >
        {
          endpoints_map.map((e,idx) => <Option value={e} key={idx}>{ e}</Option>)
        }
    </Select>
    )
  }
 
  return (
    <div className="event-list-container">
      <div className="container-top">
        <span>Schedule of Events</span>
        <Button type="primary" size="small">
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
                {renderWeek()}
              </div>
            </div>
          </div>
        </div>
        <Collapse defaultActiveKey={["1"]}>
          <Panel
            header={
              <div className="event-panel-head">
                <div className="event-title e-row">
                  <div className="name">Physical Metrics {`(${addedMetrics.length})`}
                    {/* <span className="add-event" onClick={onAddEvent}>Add Event</span> */}
                  </div>
                  <div className="cost">$200</div>
                  <div></div>
                </div>
                <div></div>
              </div>
            }
            key="1"
          >
            <div className="shedule-of-event-panel-body">
              {                
                addedMetrics.map((evt, idx) => {
                  return (
                    <div className="event-item">
                <div className="events-wrapper e-row">                 
                        <div className="my-event-td td f-2">{ evt['Standard Event']}</div>
                  <div className="endpoint-td td f-2">
                    {endpointsSelector()}
                  </div>
                        <div className="cost-td td f-1-small">${evt['Dummy Cost'] }</div>
                  <div className="visits-td td f-1-small">6</div>
                </div>
                <div className="status-row e-row">
                  <div className="colunm td"></div>
                  <div className="td"><span className="incon-wrapper">{evt['selected']?<CheckCircleFilled/> :<CheckCircleTwoTone twoToneColor="#ddd" />}</span></div>
                  <div className="td"><CheckCircleTwoTone twoToneColor="#ddd" /></div>
                  <div className="td"><CheckCircleTwoTone twoToneColor="#ddd" /></div>
                  <div className="td"><CheckCircleTwoTone twoToneColor="#ddd" /></div>
                  <div className="td"><CheckCircleTwoTone twoToneColor="#ddd" /></div>
                  <div className="td"><CheckCircleTwoTone twoToneColor="#ddd" /></div>
                  <div className="td"><CheckCircleTwoTone twoToneColor="#ddd" /></div>
                  <div className="td"><CheckCircleTwoTone twoToneColor="#ddd" /></div>
                  <div className="td"><CheckCircleTwoTone twoToneColor="#ddd" /></div>
                </div>
              </div>
                  )

                  
                  
                })
                  
              }
              
            </div>
          </Panel>
          <Panel header="This is panel header 2" key="2">
            <p>3</p>
          </Panel>
        </Collapse>
      </div>
    </div>
  );
};

export default EventList;
