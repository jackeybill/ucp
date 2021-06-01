import React,{useState} from "react";
import { Input, Select, Button } from 'antd';
import { COUNTRY_MAP } from "../../utils/country-map";
import { Therapeutic_Area_Map } from "../../utils/area-map";
import { phase_options, study_types } from '../../pages/TrialPortfolio';
import "./index.scss";

const { Option } = Select;

const TrialDetails = (props) => {
  // const [record, setRecord] = useState()
  // console.log('details-----', record)
  const [disabled, setDisabled] = useState(true)
  const { record, onSave, onInputChange, onSelectChange} = props
  console.log('details-----', record)

  const onEdit = () => {
    setDisabled(false)
  }
  const handleSave = async () => {
    await onSave()
    setDisabled(true)
  }
  
  return (
    <div className="trial-detail-container">
      <div className="top">
        <div className="title">
          <span className="nct-id">2001</span>
          <br />
          <span className="trail-alias">
            <Input defaultValue={record['trial_alias']} style={{ width: 200, height: 30 }} disabled={disabled}/>
            </span>
          <br />
          <span className="update-time">Last updated 03 April, 2021</span>
        </div>
        <div > <span className="status">In progress</span> </div>
      </div>
      <div className="info">
        <div className="info-row">
          <div className="trial-item">
            <label>Trial Title</label>
            <Input defaultValue={record['trial_title'] } style={{ width: 200, height: 30 }} disabled={ disabled}/>

            {/* <span>{record['trial_title']||"-"}</span> */}
          </div>
          <div className="trial-item">
            <label>Study Phase</label>
            
            {/* <span>{record['study_phase']||"-"}</span> */}
            <Select
              disabled={ disabled}
              defaultValue={record['study_phase']}
                  // value={phase}
                  // defaultValue="All"
                  style={{ width: 200 }}
                  // onChange={handlePhaseChange}
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
          <div className="trial-item">
            <label>Study Type</label>
            {/* <span>{record['study_type']||"-"}</span> */}
            <Select
              disabled={ disabled}
                    defaultValue={record['study_type']}
                    // value={area}
                    style={{ width: 200 }}
                    // onChange={()=>handleTrialSelectChange()}
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
          <div className="trial-item">
            <label>Study Country</label>
            {/* <span>{record['study_country']||"-"}</span> */}
            <Select
              disabled={ disabled}
                    // defaultValue="All"
                    defaultValue={record['study_country']}
                    style={{ width: 200 }}
                    // onChange={(v) => handleTrialSelectChange("study_country", v)}
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
        <div className="info-row">
          <div className="trial-item">
            <label>Pediatric Study</label>
            {/* <span>{record['prediatric_study']||"-"}</span> */}
            <Select
              disabled={ disabled}
                    defaultValue={record['prediatric_study']}
                    // value={trial["pediatric_study"]}
                    style={{ width: 200 }}
                    // onChange={(v) => handleTrialSelectChange("pediatric_study", v)}
                  >
                    <Option value="YES">YES</Option>
                    <Option value="NO">NO</Option>
                  </Select>
          </div>
          <div className="trial-item">
            <label>Indication</label>
            {/* <span>{record['indication'] || "-"}</span> */}
            <Input
              disabled={ disabled}
                    style={{ width: 200, height: 30 }}
                    // onChange={(v) => handleTrialInputChange("indication", v)}
                    defaultValue={record['indication']}
                  />
          </div>
          <div className="trial-item">
            <label>Therapeutic Area</label>
            {/* <span>{record['therapeutic_Area']||"-"}</span> */}
            <Select
              disabled={ disabled}
                  defaultValue={record['therapeutic_Area']}
                  // value={area}
                  showSearch
                  style={{ width: 200 }}
                  // onChange={handleAreaChange}
                  // onSearch={onSearch}
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
            <label>Endpoints</label>
            <span className="view-endpoint">View Endpoints (12)</span>
          </div>
        </div>
      </div>
      <div className="edit-save-btn"> <Button type="primary" onClick={disabled?onEdit:handleSave}>{disabled?'Edit':'Save'}</Button></div>
    </div>
  );
};

export default TrialDetails;
