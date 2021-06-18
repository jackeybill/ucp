import React, { useState, useReducer, useEffect } from "react";
import { withRouter } from "react-router";
import {
  Modal,
  Input,
  Select,
  message,
  Button,
  Spin,
  Breadcrumb,
  Drawer,
  Timeline
} from "antd";
import Cookies from "js-cookie";
import {
  PlusCircleOutlined,
  LeftCircleOutlined,
  RightCircleOutlined,
  CheckCircleOutlined,
  HomeOutlined,
  SearchOutlined,
  LoadingOutlined,
  LeftOutlined
} from "@ant-design/icons";
import { connect } from "react-redux";
import * as trialActions from "../../actions/trial.js";
import TrialList from "../../components/TrialList";
import TrialDetails from "../../components/TrialDetails";
import TrialEndpoints from "../../components/NewTrialSteps/TrialEndpoints";
import TeamMembers from '../../components/NewTrialSteps/TeamMembers';
import SimilarHistoricalTrials from '../../components/NewTrialSteps/SimilarHistoricalTrials';
import Scenarios from "../../components/Scenarios";
import TrialSummary from '../../components/NewTrialSteps/TrialSummary';
import { getTrialList, addStudy, updateStudy, listStudy} from "../../utils/ajax-proxy";
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

const timeline = ["Trial Summary", "Trial Endpoints", "Similar Historical Trials","Team Members"]

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
  scenarios: [],
  // primary_endpoints:[],
  // secondary_endpoints: [],
  // tertiary_endpoints:[]
};

const step1 = "details";
const step2 = "endpoints";

const TrialPortfolio = (props) => {
  const { keyWords, showSearch, setShowSearch } = props;
  const username = Cookies.get("username");
  const [showDetails, setShowDetails] = useState(false);
  const [status, setStatus] = useState("IN PROGRESS");
  const [rawData, setRawData] = useState([]);
  const [data, setData] = useState([]);
  const [phase, setPhase] = useState("All");
  const [area, setArea] = useState("All");
  const [visible, setVisible] = useState(false);
  const [currentTrial, setCurrentTrial] = useState({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [historicalTrialData, setHistoricalTrialData] = useState([])

  const [trial, setTrial] = useReducer(
    (state, newState) => ({ ...state, ...newState }),
    { ...initialStates }
  );
  const [newTrial, setNewTrial] = useReducer(
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

  const hanldeNextStep = async () => {
    if(historicalTrialData.length == 0){
      const resp = await listStudy();
      if (resp.statusCode == 200) {
        setHistoricalTrialData(JSON.parse(resp.body))
      }
    }
    setStep(step+1)
  }

  const handleOk = async () => {
    const resp = await addStudy(newTrial);

    if (resp.statusCode == 200) {
      setVisible(false);
      const trialId = resp.body;
      // setShowSearch(true)
      // setStep(step1)
      message.success("Create successfully");
      setLoading(true);
      const result = await getTrialList();
      setShowDetails(true);

      setLoading(false);
      const latestTrial =
        result.body && result.body.find((i) => i["_id"] == trialId);
      setTrial(JSON.parse(JSON.stringify(latestTrial)));
      setNewTrial(initialStates);
    }
  };

  const handleUpdate = async () => {
    const resp = await updateStudy(trial);

    if (resp.statusCode == 200) {
      message.success("Save successfully");
    }
  };

  const onViewTrial = (e, record) => {
    debugger;
    e.preventDefault();
    setShowDetails(true);
    setTrial(JSON.parse(JSON.stringify(record)));
  };

  const handleCancel = () => {
    setStep(0)
    setVisible(false);
    setNewTrial(initialStates);
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

  const handleNewTrialInputChange = (key, e) => {
    setNewTrial({
      [key]: e.target.value,
    });
  };
  const handleNewTrialSelectChange = (key, v) => {
    setNewTrial({
      [key]: v,
    });
  };

  useEffect(() => {
    setShowSearch(!showDetails);
  }, [showDetails]);

  useEffect(() => {
    const tmpData = rawData.filter((d) => {
      d.status = d.status ? d.status : "";
      d["study_phase"] = d["study_phase"] ? d["study_phase"] : "";
      d["study_country"] = d["study_country"] ? d["study_country"] : [""];
      d["therapeutic_area"] = d["therapeutic_area"]
        ? d["therapeutic_area"]
        : "";
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

      const isIncluded = searchedFields.map((f) => {
        return f.search(keyWords.toLowerCase()) != -1;
      });

      return (
        d.status.toLowerCase() == status.toLowerCase() &&
        (phase != "All" ? d["study_phase"] == phase : true) &&
        (area != "All" ? d["therapeutic_area"] == area : true) &&
        (keyWords ? isIncluded.find((e) => e == true) : true)
      );
    });
    setData(tmpData);
  }, [status, rawData, area, phase, keyWords]);

  useEffect(() => {
    !showDetails && setTrial(initialStates);

    setStatus("IN PROGRESS");
    const fetchList = async () => {
      setLoading(true);
      const resp = await getTrialList();
      setLoading(false);
      if (resp.statusCode == 200) {
        const source = resp.body;
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
            <div className="count">
              Your {status == "IN PROGRESS" ? "Current" : "Completed"} Trials (
              {data.length})
            </div>
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
          <Spin
            spinning={loading}
            indicator={<LoadingOutlined style={{ color: "#ca4a04" }} />}
          >
            <TrialList data={data} onViewTrial={onViewTrial} />
          </Spin>
        </>
      ) : (
        <>
          <Breadcrumb>
            <Breadcrumb.Item
              className="homepage"
              onClick={() => setShowDetails(false)}
            >
              <span>
                <HomeOutlined />
                My Trials
              </span>
            </Breadcrumb.Item>
            <Breadcrumb.Item>Trial Design</Breadcrumb.Item>
          </Breadcrumb>
          <div className="trial-details-wrapper">
            <TrialDetails
              record={trial}
              onSave={handleUpdate}
              onInputChange={handleTrialInputChange}
              onSelectChange={handleTrialSelectChange}
            />
            <Scenarios record={trial} />
          </div>
        </>
      )}

      <Drawer
        title="New Trial"
        placement="right"
        closable={true}
        onClose={handleCancel}
        visible={visible}
        footer={
          <div className="action-btn-footer">
            <div className="left-action">
              <Button size="small"  onClick={handleCancel}>Cancel</Button>
              {step > 0 && step <=(timeline.length-1)? <span className="go-prev-step" onClick={()=>setStep(step-1)}><LeftOutlined />{ timeline[step-1]}</span>:null}
            </div>          
            {
              <Button  size="small" type="primary" onClick={step>=(timeline.length-1)?handleOk:hanldeNextStep}>
                {
                  step>=(timeline.length-1)? "Create Trial":`Next Step:${timeline[step+1]}`
                }            
              </Button>
            }
          </div>
        }
      >
        <div className="new-trial-wrapper">
          <div className="navigation-bar">
            <span className="navigation-title">Steps</span>
            <Timeline>
              {
                timeline.map((t, idx) => <Timeline.Item color={ idx==step?"#ca4a04":"gray"} className={idx==step?"current-step":""} key={t}> {t}</Timeline.Item> )
              }
            </Timeline>    
          </div>
          <div className="main-content">
            <span className="title">{timeline[step]}</span>         
            {step==0 && <TrialSummary handleNewTrialInputChange={handleNewTrialInputChange} handleNewTrialSelectChange={ handleNewTrialSelectChange} newTrial={newTrial}/>}
            {step==1 && <TrialEndpoints />}
            {step==2 && <SimilarHistoricalTrials dataList={historicalTrialData}/>}
            {step==3 && <TeamMembers/>}     
          </div>
        </div>
      </Drawer>
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
