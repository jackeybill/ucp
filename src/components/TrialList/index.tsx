import React, { useState, } from "react";
import { withRouter } from 'react-router';
import { Select, Collapse,Modal,Input,Tooltip} from "antd";
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { DeleteTrialList } from '../../utils/ajax-proxy'
import "./index.scss";
const { Panel } = Collapse;


function callback(key) {
  // console.log(key);
}

const panelHeader = (props, record) => {

  return (
    <div className="trial-panelHeader">
      <div>
      {record["trial_alias"] || "-"}<br/>
      <span className="update-time">Last updated {record.updateDate||'-'}</span>
      </div>
      <div>{record["molecule_name"] || "-"}</div>
      <div>{record["study_phase"] || "-"}</div>
      <div>{record["therapeutic_area"] || "-"}</div>
      {/* <div className="module_status_item">{record["module_status"] || "1/4"}
        <Tooltip placement="bottom"
          overlayClassName="module_status_tooltip"
          color="#ffffff"
          title={(
          <div className="module_status_wrapper">
            <div className="title">Module Status</div>
            <div className="status_row">
              <span className="name">Protocal Design</span>
              <span className="status in_progress">IN PROGRESS</span>
              </div>
               <div className="status_row">
              <span className="name">Country Allocation</span>
              <span className="status not_started">NOT STARTED</span>
              </div>
               <div className="status_row">
              <span className="name">Site Selection</span>
              <span className="status not_started">NOT STARTED</span>
              </div>
               <div className="status_row">
              <span className="name">Trial Budgeting</span>
              <span className="status not_started">NOT STARTED</span>
            </div>

          </div>
        )}>
         <span className="m-icon"><i>M</i></span>
      </Tooltip>      
      </div> */}
      <div>
        <span className="status" >
          <i className={`status-tag ${record["status"].toLowerCase() == "completed" ? 'completed' : 'in-progress'}`}></i> {record["status"] || "-"}
        </span>
        
      </div>
      <div>
      <span className="view-btn" onClick={(e)=>props.onViewTrial(e,record)}>VIEW TRIAL</span>
      </div>
      

    </div>
  );
};

const DeleteTrialListByID = async (id) => {
    const resp = await DeleteTrialList(id);
      if (resp.statusCode == 200) {
       console.log("delete successfully:",id);
      }
}

const panelContent = (record, onClick) => {

  return (
    <div className="trial-panelBody">
      <div>
        <span className="key">Trial Title</span><br/>
        <span className="value"> {record["trial_title"] || "-"}</span>
      </div>
      <div>
        <span className="key">Indication</span><br/>
        <span className="value">
          {
            typeof record["indication"] =='string' && record["indication"]
          }
          {
            typeof record["indication"] == 'object' ? (
              <>
                {record["indication"] && record["indication"].length > 0 && record["indication"].map((i, idx) => {
                  return idx < record["indication"].length - 1 ? i + ',' : i
                })}
              </>
            ):''
          }           
      </span>
      </div>
      <div>
        <span className="key">Study Type</span><br/>
        <span className="value"> {record["study_type"] || "-"}</span>
      </div>
      <div>
        <span className="key">Pediatric Study</span><br/>
        <span className="value"> {record["pediatric_study"] || "-"}</span>
      </div>
      <div>
        <span className="key">Study Country</span><br/>
        <span className="value"> {record["study_country"] || "-"}</span>
      </div>
      <div>
        <span className="delete-btn" onClick={()=>DeleteTrialListByID(record["_id"])}>DELETE TRIAL</span>
      </div>

      <div>
        {/* <span className="key">Endpoints</span><br/>
        <span className="value"> <span className="view-endpoint" onClick={onClick}>View Endpoints (12)</span></span> */}
      </div>
    </div>
  );
};




const TrailList = (props: any) => {
  const { data } = props
  const [phase, setPhase] = useState('All')
  const [area, setArea] = useState('')
  const [visible, setVisible] = useState(false)

  const handlePhaseChange = (value) => {
    setPhase(value)
  };
  const handleCountryChange = (value) => {
    setArea(value)
  }
  const showModal =() =>{
    setVisible(true)
  }

  return (
    <div className="trail-list-container">
      <div className="trails-list">
        <div className="list-columns">
          <div className="col-item">TRIAL ALIAS</div>
          <div className="col-item">MOLECULE NAME</div>
          <div className="col-item">STUDY PHASE</div>
          <div className="col-item">THERAPEUTIC AREA</div>
          {/* <div className="col-item">MODULE STATUS</div> */}
          <div className="col-item">TRIAL STATUS</div>
          <div className="col-item"></div>
        </div>
        <div>
          <Collapse
            onChange={callback}
            expandIconPosition="right"
            expandIcon={({ isActive }) => <DownOutlined style={{ color: '#CA4A04' }} rotate={isActive ? 180 : 0} />}          >
            {data.length > 0 && data.map((d, idx) => {
              return (
                <Panel header={panelHeader(props,d)} key={idx}>
                  {panelContent(d, showModal)}
                </Panel>
              );
            })}
            {
              data.length==0&& <div className="no-data">No data found</div>
            }
          </Collapse>
        </div>
          </div>

        <Modal title="Endpoints(12)" visible={visible} onOk={()=>setVisible(true)} onCancel={()=>setVisible(false)}>
          <p>Some contents...</p>
          <p>Some contents...</p>
          <p>Some contents...</p>
      </Modal>
          
          
    </div>
  );
};

export default withRouter(TrailList);
