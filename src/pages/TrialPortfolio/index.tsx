import React, { useState, useReducer, useEffect } from "react";
import { withRouter } from "react-router";
import { Modal, Input, Select, message, Button, Spin,Breadcrumb } from "antd";
import Cookies from "js-cookie";
import {
  PlusCircleOutlined,
  LeftCircleOutlined,
  RightCircleOutlined,
  CheckCircleOutlined,
  HomeOutlined,
  SearchOutlined,LoadingOutlined
} from "@ant-design/icons";
import { connect } from "react-redux";
import * as trialActions from "../../actions/trial.js";
import TrialList from "../../components/TrialList";
import TrialDetails from "../../components/TrialDetails";
import Endpoints from "../../components/Endpoints";
import Scenarios from "../../components/Scenarios";
import { getTrialList, addStudy, updateStudy } from "../../utils/ajax-proxy";
import { COUNTRY_MAP } from "../../utils/country-map";
import { Therapeutic_Area_Map } from "../../utils/area-map";
import addIcon from "../../assets/add.svg";

import "./index.scss";


const { Search } = Input;
const { TextArea } = Input;
const { Option } = Select;
export const phase_options = [
  "All",
  "Early Phase 1",
  "Phase 1",
  "Phase 2",
  "Phase 3",
  "Phase 4",
  "Not Applicable",
];
export const study_types = [
  "All",
  "Interventional Studies (Clinical Trials)",
  "Observational Studies",
  "Patient Registries",
  "Expanded Access Studies",
];

const initialCount = {
  inProgress: 0,
  completed: 0,
};

const initialStates = {
  trial_title: "",
  description: "",
  therapeutic_area: "",
  indication: "",
  trial_alias: "",
  study_type: "",
  study_phase: "",
  molecule_name: "",
  pediatric_study: "",
  study_country: "",
  // primary_endpoints:[],
  // secondary_endpoints: [],
  // tertiary_endpoints:[]
};

const step1 = "details";
const step2 = "endpoints";

const TrialPortfolio = (props) => {
  console.log( props)
  const { keyWords,showSearch, setShowSearch } = props;
  const username = Cookies.get("username");
  const [showDetails, setShowDetails] = useState(false);
  const [status, setStatus] = useState("IN PROGRESS");
  const [rawData, setRawData] = useState([]);
  const [data, setData] = useState([]);
  const [phase, setPhase] = useState("All");
  const [area, setArea] = useState("All");
  const [visible, setVisible] = useState(false);
  const [currentTrial, setCurrentTrial] = useState({});
  const [loading, setLoading] = useState(false)
  
  // const [step, setStep] = useState(step1);

  const [trial, setTrial] = useReducer(
    (state, newState) => ({ ...state, ...newState }),
    { ...initialStates }
  );
  const [count, setCount] = useReducer(
    (state, newState) => ({ ...state, ...newState }),
    { ...initialCount }
  );



  const handlePhaseChange = (value) => {
    setPhase(value);
  };
  const handleAreaChange = (value) => {
    setArea(value);
  };


  const handleOk = async () => { 
    const resp = await addStudy(trial);

    if (resp.statusCode == 200) {
      setVisible(false);
      // setShowSearch(true)
      // setStep(step1)
      message.success("Create successfully");
      setLoading(true)
      const resp = await getTrialList();
      setShowDetails(true);
      
      setLoading(false)
      const latestTrial = resp.body && resp.body.find( i=> i['trial_title']==trial['trial_title'])
      setTrial(latestTrial)
      
    }
  };

  const handleUpdate = async () => {
    const resp = await updateStudy(trial);
    
    if (resp.statusCode == 200) {
      message.success("Save successfully");
    }
  }

  const onViewTrial = (e, record) => {
    e.preventDefault();
    setShowDetails(true);
    setTrial(record)
  };

  const handleCancel = () => {
    setVisible(false);
  };

  const handleTrialInputChange = (key, e) => {
    setTrial({
      [key]: e.target.value,
    });
  };
  const handleTrialSelectChange = (key, v) => {
    setTrial({
      [key]: v,
    });
  };

  useEffect(() => {
    setShowSearch(!showDetails)
  },[showDetails])

  useEffect(() => {
    const tmpData = rawData.filter((d) => {
      d.status = d.status ? d.status : "";
      d["study_phase"] = d["study_phase"] ? d["study_phase"] : "";
      d["study_country"] = d["study_country"] ? d["study_country"] : [""];
      d["therapeutic_area"] = d["therapeutic_area"] ? d["therapeutic_area"] : "";
      // search text matches one of the below fields
      let searchedFields = [
        d["trial_title"],
        d["trial_alias"],
        d["molecule_name"],
        d["study_phase"],
        d["study_country"][0],
        d["therapeutic_area"],
        d["status"],
        d["study_type"],
        d["prediatric_study"],       
      ];
      searchedFields = searchedFields.filter(Boolean);
      searchedFields = searchedFields.map((i) =>
        typeof i == "string" ? i.toLowerCase() : String(i)
      );

      const isIncluded = searchedFields.map(f => {
        return f.search(keyWords.toLowerCase())!=-1 
      })

      return (
        d.status.toLowerCase() == status.toLowerCase() &&
        // (phase != "All" ? d["study_phase"].search(phase) != -1 : true) &&
        // (area != "All" ? d["therapeutic_area"].search(area) != -1 : true) &&
        (phase != "All" ? d["study_phase"]==phase : true) &&
        (area != "All" ? d["therapeutic_area"]==area : true) &&
        // (keyWords ? searchedFields.includes(keyWords.toLowerCase()) : true)
        (keyWords ? isIncluded.find(e=>e==true)  : true)
      );
    });
    setData(tmpData);
  }, [status, rawData, area, phase, keyWords]);

  useEffect(() => {
    !showDetails && setTrial(initialStates)
    
    setStatus("IN PROGRESS");
    const fetchList = async () => {
      setLoading(true)
      const resp = await getTrialList();
      setLoading(false)
      if (resp.statusCode == 200) {
        const source=resp.body
        setRawData(source);
        console.log("all data-----", source);
        const inProgressArr = source.filter((d) => {
          return d.status && d.status.toUpperCase() == "IN PROGRESS";
        });
        const completedArr = source.filter((d) => {
          return d.status && d.status.toUpperCase() == "COMPLETED";
        });
        setCount({
          inProgress: inProgressArr.length,
          completed: completedArr.length,
        });
      }
    };
    fetchList();
  }, [showDetails]);

  return (
    <div className="trial-portfolio-container">
      {!showDetails ? (
        <>        
          <div className="upper">
            <span className="small-trial">MY TRIALS</span>
            <p className="title">Hello, {username}</p>
            <span className="sub-title">
              Here is a glance of your trial portfolio.
            </span>
            <div className="action-part">
              <div className="status-filter">
                <div
                  className={`in-progress item ${
                    status == "IN PROGRESS" ? "active" : ""
                  }`}
                  onClick={() => setStatus("IN PROGRESS")}
                >
                  <span className="number">{count.inProgress}</span>
                  <span className="status">IN PROGRESS</span>
                </div>
                <div
                  className={`complete item ${
                    status == "COMPLETED" ? "active" : ""
                  }`}
                  onClick={() => setStatus("COMPLETED")}
                >
                  <span className="number">{count.completed}</span>
                  <span className="status">COMPLETED</span>
                </div>
              </div>
              <div className="add-btn" onClick={() => setVisible(true)}>
                <PlusCircleOutlined />
                New Trial
              </div>
            </div>
          </div>

          <div className="list-top">
            <div className="count">Your {status=="IN PROGRESS"?"Current":"Completed"} Trials ({data.length})</div>
            <div className="filter-selector">
              <div className="selector-item">
                <label>Therapeutic Area</label> <br />
                <Select
                  defaultValue="All"
                  value={area}
                  showSearch
                  style={{ width: 200 }}
                  onChange={handleAreaChange}
                 
                  filterOption={(input, option) =>
                    option.children
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {Therapeutic_Area_Map.map((o) => {
                    return (
                      <Option value={o} key={o}>
                        {o}
                      </Option>
                    );
                  })}
                </Select>
              </div>
              <div className="selector-item">
                <label> Study Phase</label>
                <br />
                <Select
                  value={phase}
                  defaultValue="All"
                  style={{ width: 200 }}
                  onChange={handlePhaseChange}
                >
                  {phase_options.map((o) => {
                    return (
                      <Option value={o} key={o}>
                        {o}
                      </Option>
                    );
                  })}
                </Select>
              </div>
            </div>
          </div>
          <Spin spinning={loading} indicator={<LoadingOutlined style={{color:'#ca4a04'}}/>}>
           <TrialList data={data} onViewTrial={onViewTrial} />      
        </Spin>    
        </>
      ) : (
          <>
          <Breadcrumb>
              <Breadcrumb.Item className="homepage" onClick={() =>setShowDetails(false)}>         
            <span><HomeOutlined />My Trials</span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>Trial Design</Breadcrumb.Item>
        </Breadcrumb>
          <div className="trial-details-wrapper">             
            <TrialDetails record={trial} onSave={handleUpdate} onInputChange={handleTrialInputChange} onSelectChange={handleTrialSelectChange}/>         
            <Scenarios record={trial}/>
            </div>
            </>
      )}

      <Modal
        title={
          <div className="trial-modal-header">
            <span>New Trial</span>
            {/* <div className="action-timeline">
              <div className="step">
                {
                  step == step2 ? (
                    <CheckCircleOutlined style={{ color: '#d04a02' }}/>
                  ):<span className="num step1 active">1</span>
                }              
                <span className="name active">Trial Details</span>
              </div>
              <div className="line"></div>
              <div className="step">
                <span className={`num ${step == step2 ? 'active' : ''}`}>2</span>
                <span className={`name ${step == step2 ? 'active' : ''}`}>Add Trial Endpoints</span>
              </div>
            </div> */}
          </div>
        }
        footer={
          <Button type="primary" onClick={handleOk}>
            Create Trial
          </Button>
          // <div
          //   className="trial-modal-footer"
          // >
          //   {step == step1 ? (
          //     <div className="step1-footer">
          //       <RightCircleOutlined onClick={()=>setStep(step2)}/>
          //     </div>
          //   ) : (
          //     <div className="step2-footer">
          //       <LeftCircleOutlined onClick={()=>setStep(step1)}/>
          //       <Button type="primary" onClick={handleOk}>Create Trial</Button>
          //     </div>
          //   )}
          // </div>
        }
        visible={visible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <div>
          {/* {step == step1 ? ( */}
          <div>
            <div className="trials-basic-info">
              <div className="trial-item">
                <label htmlFor="">Trial Title</label>
                <Input
                  style={{ width: 250, height: 30 }}
                  onChange={(e) => handleTrialInputChange("trial_title", e)}
                  value={trial["trial_title"]}
                />
              </div>
              <div className="trial-item">
                <label htmlFor="">Description</label>
                <TextArea
                  onChange={(v) => handleTrialInputChange("description", v)}
                  value={trial["description"]}
                  autoSize={{ minRows: 3, maxRows: 5 }}
                />
              </div>
              <div className="parallel-item ">
                <div className="trial-item">
                  <label>Therapeutic Area</label>
                  <Select
                    defaultValue="All"
                    value={trial["therapeutic_area"]}
                    showSearch
                    style={{ width: 250 }}
                    onChange={(v) => handleTrialSelectChange("therapeutic_area", v)}
                    filterOption={(input, option) =>
                      option.children
                        .toLowerCase()
                        .indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {Therapeutic_Area_Map.map((o) => {
                      return (
                        <Option value={o} key={o}>
                          {o}
                        </Option>
                      );
                    })}
                  </Select>
                </div>
                <div className="trial-item">
                  <label htmlFor="">Indication</label>
                  <Input
                    style={{ width: 250, height: 30 }}
                    onChange={(v) => handleTrialInputChange("indication", v)}
                    value={trial["indication"]}
                  />
                </div>
              </div>
              <div className="parallel-item">
                <div className="trial-item">
                  <label htmlFor="">Trial Alias</label>
                  <Input
                    style={{ width: 250, height: 30 }}
                    onChange={(v) => handleTrialInputChange("trial_alias", v)}
                    value={trial["trial_alias"]}
                    disabled
                  />
                </div>
                <div className="trial-item">
                  <label htmlFor="">Study Type</label>
                  <Select
                    defaultValue="All"
                    value={trial["study_type"]}             
                    style={{ width: 250 }}
                    onChange={(v) => handleTrialSelectChange("study_type", v)}
                  >
                    {study_types.map((t) => {
                      return (
                        <Option value={t} key={t}>
                          {t}
                        </Option>
                      );
                    })}
                  </Select>
                </div>
              </div>
              <div className="parallel-item">
                <div className="trial-item">
                  <label htmlFor="">Molecule Name</label>
                  <Input
                    style={{ width: 250, height: 30 }}
                    onChange={(v) => handleTrialInputChange("molecule_name", v)}
                    value={trial["molecule_name"]}
                  />
                </div>
                <div className="trial-item">
                  <label htmlFor="">Study Phase</label>
                  <Select
                    defaultValue="All"
                    value={trial["study_phase"]}
                    style={{ width: 250 }}
                    onChange={(v) => handleTrialSelectChange("study_phase", v)}
                  >
                    {phase_options.map((o) => {
                      return (
                        <Option value={o} key={o}>
                          {o}
                        </Option>
                      );
                    })}
                  </Select>
                </div>
              </div>
              <div className="parallel-item">
                <div className="trial-item">
                  <label htmlFor="">Pediatric Study</label>
                  <Select
                    defaultValue="All"
                    value={trial["pediatric_study"]}
                    style={{ width: 250 }}
                    onChange={(v) => handleTrialSelectChange("pediatric_study", v)}
                  >
                    <Option value="YES">YES</Option>
                    <Option value="NO">NO</Option>
                  </Select>
                </div>
                <div className="trial-item">
                  <label htmlFor="">Study Country</label>
                  <Select
                    defaultValue="All"
                    value={trial["study_country"]}
                    style={{ width: 250 }}
                    onChange={(v) => handleTrialSelectChange("study_country", v)}
                  >
                    {COUNTRY_MAP.map((o) => {
                      return (
                        <Option value={o} key={o}>
                          {o}
                        </Option>
                      );
                    })}
                  </Select>
                </div>
              </div>
            </div>
          </div>
          {/* ) : (
            <div>
                <Endpoints onInput={handleTrialInputChange}/>
            </div>
          )} */}
        </div>
      </Modal>
    </div>
  );
};



const mapDispatchToProps = (dispatch) => ({
  showSearch: (val) => dispatch(trialActions.showSearch(val)),
});

const mapStateToProps = (state) => ({
  show: state.trialReducer,
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(TrialPortfolio));
