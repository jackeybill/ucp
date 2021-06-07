import React, { useState, useReducer, useEffect } from "react";
import { Modal, Input, Select, message, Button } from "antd";
import Cookies from "js-cookie";
import {
  PlusCircleOutlined,
  LeftCircleOutlined,
  RightCircleOutlined,
  CheckCircleOutlined 
} from "@ant-design/icons";
import TrialList from "../../components/TrialList";
import TrialDetails from "../../components/TrialDetails";
import Endpoints from "../../components/Endpoints";
import { getTrialList, addStudy } from "../../utils/ajax-proxy";
import { COUNTRY_MAP } from "../../utils/country-map";

import "./index.scss";
import { divide } from "lodash";

const { TextArea } = Input;
const { Option } = Select;
const phase_options = [
  "All",
  "Early Phase 1",
  "Phase 1",
  "Phase 2",
  "Phase 3",
  "Phase 4",
  "Not Applicable",
];
const study_types = [
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
  primary_endpoints:[],
  secondary_endpoints: [],
  tertiary_endpoints:[]
};

const step1 = "details";
const step2 = "endpoints";

const TrialPortfolio = () => {
  const username = Cookies.get("username");
  const [showDetails, setShowDetails] = useState(false);
  const [status, setStatus] = useState("IN PROGRESS");
  const [rawData, setRawData] = useState([]);
  const [data, setData] = useState([]);
  const [phase, setPhase] = useState("All");
  const [area, setArea] = useState("");
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(step1);
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
  const handleCountryChange = (value) => {
    setArea(value);
  };

  const handleOk = async () => {
    // const params =  {
    //   // "nct_id": "NCT00000123",
    //   "study_type": "Interventional",
    //   "trial_title": "The Berkeley Orthokeratology Study",
    //   "study_phase": "Phase 3",
    //   "prediatric_study": "Yes",
    //   "indication": "Astigmatism",
    //   "description": "The Berkeley Orthokeratology Study",
    //   "therapeutic_area": "National Eye Institute (NEI)",
    //   "trial_alias": null,
    //   "molecule_name": null
    // }
    const resp = await addStudy(trial);
    if (resp.statusCode == 200) {
      setVisible(false);
      setStep(step1)
      message.success("New trial created successfully");
    }
  };

  const handleCancel = () => {
    setVisible(false);
  };

  const handleInputChange = (key, e) => {
    setTrial({
      [key]: e.target.value,
    });
  };
  const handleSelectChange = (key, v) => {
    setTrial({
      [key]: v,
    });
  };

  useEffect(() => {
    const tmpData = rawData.filter((d) => {
      d.status = d.status ? d.status : "";
      d["study_phase"] = d["study_phase"] ? d["study_phase"] : "Not Applicable";
      d["study_country"] = d["study_country"] ? d["study_country"] : ["China"];
      return (
        d.status.toLowerCase() == status.toLowerCase() &&
        (phase != "All" ? d["study_phase"].search(phase) != -1 : true)
      );
    });
    setData(tmpData);
  }, [status, rawData, area, phase]);

  useEffect(() => {
    setStatus("IN PROGRESS");
    const fetchList = async () => {
      const resp = await getTrialList();

      if (resp.statusCode == 200) {
        //mock some in progress data
        const source = resp.body.map((d, idx) => {
          d = JSON.parse(d);
          d["study_phase"] = d["study_phase"]
            ? d["study_phase"]
            : "Not Applicable";
          if (idx < 5) {
            d.status = "IN PROGRESS";
          }
          return d;
        });
        setRawData(source);
        console.log("all data-----", source);
        const inProgressArr = source.filter((d) => {
          return d.status && d.status.toUpperCase() == "IN PROGRESS";
        });
        const completedArr = source.filter((d) => {
          return d.status && d.status == "Completed";
        });
        setCount({
          inProgress: inProgressArr.length,
          completed: completedArr.length,
        });
      }
    };
    fetchList();
  }, []);

  return (
    <div className="trial-portfolio-container">
      {/* <TrialDetails/> */}
      <div className="upper">
        <span className="small-trial">MY TRIALS</span>
        <p className="title">Hello {username}</p>
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
        <div className="count">Your Current Trials ({data.length})</div>
        <div className="filter-selector">
          <div className="selector-item">
            <label>Therapeutic Area</label> <br />
            <Select
              defaultValue="All"
              value={area}
              style={{ width: 200 }}
              onChange={handleCountryChange}
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
          <div className="selector-item">
            <label> Trial Phase</label>
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
      <TrialList data={data} />
      <Modal
        title={
          <div className="trial-modal-header">
            <span>New Trial</span>
            <div className="action-timeline">
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
            </div>
          </div>
        }
        footer={
          <div
            className="trial-modal-footer"
          >
            {step == step1 ? (
              <div className="step1-footer">
                <RightCircleOutlined onClick={()=>setStep(step2)}/>
              </div>
            ) : (
              <div className="step2-footer">
                <LeftCircleOutlined onClick={()=>setStep(step1)}/>
                <Button type="primary" onClick={handleOk}>Create Trial</Button>
              </div>
            )}
          </div>
        }
        visible={visible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <div>
          {step == step1 ? (
            <div>
              <div className="trials-basic-info">
                <div className="trial-item">
                  <label htmlFor="">Trial Title</label>
                  <Input
                    style={{ width: 200, height: 30 }}
                    onChange={(e) => handleInputChange("trial_title", e)}
                    value={trial["trial_title"]}
                  />
                </div>
                <div className="trial-item">
                  <label htmlFor="">Description</label>
                  <TextArea
                    onChange={(v) => handleInputChange("description", v)}
                    value={trial["description"]}
                    autoSize={{ minRows: 3, maxRows: 5 }}
                  />
                </div>
                <div className="parallel-item ">
                  <div>
                    <label htmlFor="">Therapeutic Area</label>
                    <Input
                      style={{ width: 200, height: 30 }}
                      onChange={(v) => handleInputChange("therapeutic_area", v)}
                      value={trial["therapeutic_area"]}
                    />
                  </div>
                  <div className="trial-item">
                    <label htmlFor="">Indication</label>
                    <Input
                      style={{ width: 200, height: 30 }}
                      onChange={(v) => handleInputChange("indication", v)}
                      value={trial["indication"]}
                    />
                  </div>
                </div>
                <div className="parallel-item">
                  <div className="trial-item">
                    <label htmlFor="">Trial Alias</label>
                    <Input
                      style={{ width: 200, height: 30 }}
                      onChange={(v) => handleInputChange("trial_alias", v)}
                      value={trial["trial_alias"]}
                    />
                  </div>
                  <div className="trial-item">
                    <label htmlFor="">Study Type</label>
                    <Select
                      defaultValue="All"
                      // value={area}
                      style={{ width: 200 }}
                      // onChange={()=>handleSelectChange()}
                    >
                      {study_types.map((t) => {
                        return <Option value={t}>{t}</Option>;
                      })}
                    </Select>
                  </div>
                </div>
                <div className="parallel-item">
                  <div className="trial-item">
                    <label htmlFor="">Molecule Name</label>
                    <Input
                      style={{ width: 200, height: 30 }}
                      onChange={(v) => handleInputChange("study_type", v)}
                      value={trial["study_type"]}
                    />
                  </div>
                  <div className="trial-item">
                    <label htmlFor="">Study Phase</label>
                    <Select
                      defaultValue="All"
                      value={trial["study_phase"]}
                      style={{ width: 200 }}
                      onChange={(v) => handleSelectChange("study_phase", v)}
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
                      style={{ width: 200 }}
                      onChange={(v) => handleSelectChange("pediatric_study", v)}
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
                      style={{ width: 200 }}
                      onChange={(v) => handleSelectChange("study_country", v)}
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
          ) : (
            <div>
                <Endpoints onInput={handleInputChange}/>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default TrialPortfolio;
