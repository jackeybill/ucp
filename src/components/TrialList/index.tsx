import React, { useState, } from "react";
import { withRouter } from 'react-router';
import { Select, Collapse,Modal,Input} from "antd";
import "./index.scss";
const { Panel } = Collapse;


function callback(key) {
  // console.log(key);
}

const panelHeader = (props,record) => {

  return (
    <div className="trial-panelHeader">
      <div>
      {/* {record["nct_id"] || "-"}<br/> */}
      {record["trial_alias"] || "-"}<br/>
      <span className="update-time">Last updated {record.updateDate||'-'}</span>
      </div>
      <div>{record["molecule_name"] || "-"}</div>
      <div>{record["study_phase"] || "-"}</div>
          <div>{record["therapeutic_area"] || "-"}</div>
           <div> <span className={`status-tag ${record["status"].toLowerCase()=="completed"?'completed':'in-progress'}`}>{record["status"] || "-"}</span>
          </div>
      <div>
      <span className="view-btn" onClick={(e)=>props.onViewTrial(e,record)}>View Trial</span>
       </div>
    </div>
  );
};

const panelContent = (record, onClick) => {
  return (
    <div className="trial-panelBody">
      <div>
        <span className="key">Trial Title</span><br/>
        <span className="value"> {record["trial_title"] || "-"}</span>
      </div>
      <div>
        <span className="key">Indication</span><br/>
        <span className="value"> {record["indication"] || "-"}</span>
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
          <div className="col-item">STATUS</div>
          <div className="col-item"></div>
        </div>
        <div>
          <Collapse
            onChange={callback}
            expandIconPosition="right"
          >
            {props.data.length > 0 && data.map((d, idx) => {
              return (
                <Panel header={panelHeader(props,d)} key={idx}>
                  {panelContent(d, showModal)}
                </Panel>
              );
            })}
            {/* {
                data.length==0&& <div>No data found</div>
            } */}
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