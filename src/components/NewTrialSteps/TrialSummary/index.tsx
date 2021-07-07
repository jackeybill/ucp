import React, { useEffect, useState } from 'react';
import {
  Input,
  Select,
} from "antd";
import {
  PlusCircleOutlined,
  LeftCircleOutlined,
  RightCircleOutlined,
  CheckCircleOutlined,
  HomeOutlined,
  SearchOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { COUNTRY_MAP } from "../../../utils/country-map";
import { Therapeutic_Area_Map } from "../../../utils/area-map";
import { study_types, phase_options } from '../../../pages/TrialPortfolio'

const { Search } = Input;
const { TextArea } = Input;
const { Option } = Select;

const TrialSummary = (props) => {
  const { newTrial, handleNewTrialInputChange, handleNewTrialSelectChange } = props
  console.log( newTrial)

    return (
        <div className="trial-summary-container">
             <div className="trials-basic-info">
            <div className="trial-item">
              <label htmlFor="">Trial Alias</label>
              <Input
                style={{ width: "100%", height: 30 }}
                onChange={(v) => handleNewTrialInputChange("trial_alias", v)}
                value={newTrial["trial_alias"]}
              />
            </div>

            <div className="trial-item">
              <label htmlFor="">Description</label>
              <TextArea
                onChange={(v) => handleNewTrialInputChange("description", v)}
                value={newTrial["description"]}
                autoSize={{ minRows: 3, maxRows: 5 }}
              />
            </div>
            <div className="parallel-item ">
              <div className="trial-item">
                <label>Therapeutic Area</label>
                <Select
                  defaultValue="All"
                  value={newTrial["therapeutic_area"]}
                  showSearch
                  style={{ width: 250 }}
                  onChange={(v) =>
                    handleNewTrialSelectChange("therapeutic_area", v)
                  }
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
                <Select
                  defaultValue=""
                mode="multiple"
                allowClear
                  value={newTrial["indication"]}
                  style={{ width: 250 }}
                  onChange={(v) => handleNewTrialSelectChange("indication", v)}
              >
                  {props.indicationList.map((t) => {
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
                <label htmlFor="">Trial Title</label>
                <Input
                  style={{ width: 250, height: 30 }}
                  onChange={(e) => handleNewTrialInputChange("trial_title", e)}
                  value={newTrial["trial_title"]}
                />
              </div>
              <div className="trial-item">
                <label htmlFor="">Study Type</label>
                <Select
                  defaultValue="All"
                  value={newTrial["study_type"]}
                  style={{ width: 250 }}
                  onChange={(v) => handleNewTrialSelectChange("study_type", v)}
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
                  onChange={(v) =>
                    handleNewTrialInputChange("molecule_name", v)
                  }
                  value={newTrial["molecule_name"]}
                />
              </div>
              <div className="trial-item">
                <label htmlFor="">Study Phase</label>
                <Select
                  defaultValue="All"
                  value={newTrial["study_phase"]}
                  style={{ width: 250 }}
                  onChange={(v) => handleNewTrialSelectChange("study_phase", v)}
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
                  value={newTrial["pediatric_study"]}
                  style={{ width: 250 }}
                  onChange={(v) =>
                    handleNewTrialSelectChange("pediatric_study", v)
                  }
                >
                  <Option value="YES">YES</Option>
                  <Option value="NO">NO</Option>
                </Select>
              </div>
              <div className="trial-item">
                <label htmlFor="">Study Country</label>
                <Select
                  defaultValue="All"
                  value={newTrial["study_country"]}
                  style={{ width: 250 }}
                  onChange={(v) =>
                    handleNewTrialSelectChange("study_country", v)
                  }
                >
                  {COUNTRY_MAP.sort().map((o) => {
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
        
    )
}

export default TrialSummary;