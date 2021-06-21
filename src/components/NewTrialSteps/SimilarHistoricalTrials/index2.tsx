import React, { useEffect, useState } from "react";
import { FilterOutlined } from "@ant-design/icons";
import { Table, Row, Col, Select } from "antd";
import { phase_options, study_types } from "../../../pages/TrialPortfolio";
import "./index.scss";

const { Option } = Select;

const SimilarHistoricalTrial = () => {
  return (
    <div className="similar-history-trial">
      <div className="tip"></div>
      <div className="main-content similar-history">
        <div className="filter-wrapper side-bar">
          <div className="toggle-icon">
            <FilterOutlined className="filter-icon" />
          </div>
          <div className="filters">
            <div className="filter-item">
              <label>STUDY PHASE</label>
              <Select
                // defaultValue={record["study_phase"]}
                style={{ width: 200 }}
                // onChange={(e) => onSelectChange("study_phase", e)}
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
            <div className="filter-item">
              <label>STUDY TYPE</label>
              <Select
                // defaultValue={record["study_phase"]}
                style={{ width: 200 }}
                // onChange={(e) => onSelectChange("study_phase", e)}
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
            <div className="filter-item">
              <label>STUDY STATUS</label>
              <Select
                // defaultValue={record["study_phase"]}
                style={{ width: 200 }}
                // onChange={(e) => onSelectChange("study_phase", e)}
              >
                {["Completed", "In Progress", "Not Started"].map((o) => {
                  return (
                    <Option value={o} key={o}>
                      {o}
                    </Option>
                  );
                })}
              </Select>
            </div>
            <div className="filter-item">
              <label>INDICATION</label>
              <Select
                // defaultValue={record["study_phase"]}
                style={{ width: 200 }}
                // onChange={(e) => onSelectChange("study_phase", e)}
              >
                {["Type 2 Diabetes"].map((o) => {
                  return (
                    <Option value={o} key={o}>
                      {o}
                    </Option>
                  );
                })}
              </Select>
            </div>
            <div className="filter-item">
              <label>PEDIATRIC</label>
              <Select
                // defaultValue={record["study_phase"]}
                style={{ width: 200 }}
                // onChange={(e) => onSelectChange("study_phase", e)}
              >
                {["YES", "NO"].map((o) => {
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
				<div className="right-content">
					<div className="top">
						<div className="trial-no">
							500
								<span>Total Number of Trials</span>
						</div>
						<div className="chart-wrapper">


						</div>

					</div>
					<div className="table-wrapper">
						

					</div>
                  
                  
         </div>
      </div>
    </div>
  );
};

export default SimilarHistoricalTrial;
