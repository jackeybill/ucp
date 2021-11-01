import React, { useState } from "react";
import { Input, Select, Button, Tooltip } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { COUNTRY_MAP } from "../../utils/country-map";
import { addStudy } from "../../utils/ajax-proxy";
import { Therapeutic_Area_Map } from "../../utils/area-map";
import { phase_options, study_types } from "../../pages/TrialPortfolio";
import "./index.scss";

const { Option } = Select;

const TrialDetails = (props) => {
  const [editable, setEditable] = useState(false);
  const { record, onSave, onInputChange, onSelectChange } = props;
  const onEdit = () => {
    // setDisabled(false)
    setEditable(true);
    console.log(record);
    
  };
  const handleSave = async () => {
    await onSave();
    // setDisabled(true)
    setEditable(false);
  };

  return (
    <div className="trial-detail-container">
      <div className="top">
        <div className="title">
          <span className="nct-id">{record["nct_id"] || "-"}</span>
          <br />
          <span className="trail-alias">{record["trial_alias"]}</span>
          <span className="status">
            <i className={`${props.record.status=="In Progress"?"in-progress-icon":'complete-icon'} my_icon`}></i>{record["status"] || "In Progress"}
          </span>
          <br />
          <span className="update-time">
            Last updated {record["updateDate"] || record["createDate"] || "-"}
          </span>
        </div>
        <div>
          <Tooltip
            placement="leftBottom"
            color="#ffffff"
            title={
              <div className="action-list">
                <div onClick={onEdit}>Edit Details</div>
              </div>
            }
          >
            <SettingOutlined className={`setting-action ${props.record.status==="In Progress" ? '': 'hidden'}`}/>
          </Tooltip>
        </div>
      </div>
      <div className="info">
        <div className="info-row">
          <div className="trial-item">
            <label>Trial Title</label>
            {editable ? (
              <Input
                defaultValue={record["trial_title"]}
                onChange={(e) => onInputChange("trial_title", e)}
                style={{ width: 200, height: 30 }}
              />
            ) : (
              <span className="readonly-value">{record["trial_title"] || "-"}</span>
            )}
          </div>
          <div className="trial-item">
            <label>Study Phase</label>
            {editable ? (
              <Select
                defaultValue={record["study_phase"]}
                mode="multiple"
                allowClear
                style={{ width: 200 }}
                onChange={(e) => onSelectChange("study_phase", e)}
              >
                {phase_options.map((o) => {
                  return (
                    <Option value={o} key={o}>
                      {o}
                    </Option>
                  );
                })}
              </Select>
            ) : (
              <span className="readonly-value">
                {!record["study_phase"] && "-"}
                {
                    typeof record["study_phase"] =='string' && record["study_phase"]
                  }
                  {
                    typeof record["study_phase"] == 'object' ? (
                      <>
                        {record["study_phase"] && record["study_phase"].length > 0 && record["study_phase"].map((i, idx) => {
                          return idx < record["study_phase"].length - 1 ? i + ',' : i
                        })}
                      </>
                    ):''
                  } 
              </span>
            )}
          </div>
          <div className="trial-item">
            <label>Study Type</label>
            {editable ? (
              <Select
                defaultValue={record["study_type"]}
                mode="multiple"
                allowClear
                style={{ width: 200 }}
                onChange={(e) => onSelectChange("study_type", e)}
              >
                {study_types.map((t) => {
                  return (
                    <Option value={t} key={t}>
                      {t}
                    </Option>
                  );
                })}
              </Select>
            ) : (
              <span className="readonly-value">
                {!record["study_type"] && "-"}
                {
                    typeof record["study_type"] =='string' && record["study_type"]
                  }
                  {
                    typeof record["study_type"] == 'object' ? (
                      <>
                        {record["study_type"] && record["study_type"].length > 0 && record["study_type"].map((i, idx) => {
                          return idx < record["study_type"].length - 1 ? i + ',' : i
                        })}
                      </>
                    ):''
                  }  
              </span>
            )}
          </div>
          <div className="trial-item">
            <label>Study Country</label>
            {editable ? (
              <Select
                defaultValue={record["study_country"]}
                style={{ width: 200 }}
                onChange={(e) => onSelectChange("study_country", e)}
              >
                {COUNTRY_MAP.map((o) => {
                  return (
                    <Option value={o} key={o}>
                      {o}
                    </Option>
                  );
                })}
              </Select>
            ) : (
              <span className="readonly-value">{record["study_country"] || "-"}</span>
            )}
          </div>
        </div>
        <div className="info-row">
          <div className="trial-item">
            <label>Pediatric Study</label>
            {editable ? (
              <Select
                defaultValue={record["pediatric_study"]}
                style={{ width: 200 }}
                onChange={(e) => onSelectChange("pediatric_study", e)}
              >
                <Option value="true">YES</Option>
                <Option value="false">NO</Option>
              </Select>
            ) : (
              <span className="readonly-value">{record["pediatric_study"]=="false"?"NO":(record["pediatric_study"]=="true"?"YES": "-") || "-"}</span>
            )}
          </div>
          <div className="trial-item">
            <label>Indication</label>

            {editable ? (
              <Select
                defaultValue={record["indication"]}
                mode="multiple"
                allowClear
                style={{ width: 200 }}
                onChange={(v) => onSelectChange("indication", v)}
              >
                {props.indicationList.map((t) => {
                  return (
                    <Option value={t} key={t}>
                      {t}
                    </Option>
                  );
                })}
              </Select>
            ) : (
                <span className="readonly-value">
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
            )}
          </div>
          <div className="trial-item">
            <label>Therapeutic Area</label>
            {editable ? (
              <Select
                defaultValue={record["therapeutic_area"]}
                showSearch
                style={{ width: 200 }}
                onChange={(e) => onSelectChange("therapeutic_area", e)}
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >=
                  0
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
            ) : (
              <span className="readonly-value">{record["therapeutic_area"] || "-"}</span>
            )}
          </div>
          <div className="trial-item">
            {/* <label>Endpoints</label>
            <span className="view-endpoint">View Endpoints (12)</span> */}
          </div>
        </div>
      </div>
      {editable ? (
        <div className="edit-save-btn">
          <Button type="primary" onClick={handleSave}>
            Save
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default TrialDetails;
