import React, { useState, useReducer, useEffect } from "react";
import { Input, Button, Tooltip, Popover } from "antd";
import { CheckOutlined, RightOutlined, LeftOutlined  } from "@ant-design/icons";

const CriteriaOption = (props) => {
  const domain = props.demographic;
  const optionText = props.demographic.Text?props.demographic.Text:props.demographic['Standard Event']
  const [activeType, setActiveType] = useState(0);
  const [activeMore, setActiveMore] = useState(0);

  useEffect(() => {
    if(props.assignedType !=="None"){
      const res = props.selectedEle.findIndex((e) => {
        return e["Eligibility Criteria"] == props.demographic['Standard Event']
      });
      const resSecondary = props.selectedEleSecondary.findIndex((e) => {
        return e["Eligibility Criteria"] == props.demographic['Standard Event']
      });
      setActiveType(res != -1 ||resSecondary != -1 ? 1 : 0); 
    } else {
      const res = props.selectedEle.findIndex((e) => {
        return props.demographic.Text?e["Eligibility Criteria"] == domain.Text:(e["Eligibility Criteria"]?e["Eligibility Criteria"] == props.demographic['Standard Event']:e["Standard Event"] == props.demographic['Standard Event'])
      });
      setActiveType(res != -1? 1 : 0); 
    } 
    if(props.demographic.showMore === true) {
      if(props.showMoreDetail) {
        setActiveMore(1);
        props.handleMoreSelect('', true, props.index, props.idx);
      } else {
        setActiveMore(0);
        props.handleMoreSelect('', false, props.index, props.idx);
      } 
    } else {
        setActiveMore(0);
    }

  }, [props.selectedEle, props.selectedEleSecondary, props.minValue, props.maxValue, props.showMoreDetail,props.demographic.showMore]);

  const handleOptionSelect = (domain, e) => {
    if (activeType == 0) {
      setActiveType(1);
      props.handleOptionSelect(domain, 1, props.index, props.idx, 'Primary');
    } else {
      setActiveType(0);
      props.handleOptionSelect(domain, 0, props.index, props.idx, 'Primary');
    }
  };

  const handleOptionSelectForSecondary = (domain, e) => {
    if (activeType == 0) {
      setActiveType(1);
      props.handleOptionSelectSecondary(domain, 1, props.index, props.idx, 'Secondary');
    } else {
      setActiveType(0);
      props.handleOptionSelectSecondary(domain, 0, props.index, props.idx, 'Secondary');
    }
  };

  const handleMore = (val, e) => {
    if (activeMore == 0) {
      setActiveMore(1);
      props.handleMoreSelect(val, true, props.index, props.idx);
    } else {
      setActiveMore(0);
      props.handleMoreSelect(val, false, props.index, props.idx);
    }
  }

  return (
    <div className="criteria-option-wrapper">
      {activeType == 0 ? (
        // <Tooltip
        //   title={
        //     "Frequency " + Math.floor(domain.Frequency * 10000) / 100 + "%"
        //   }
        // >
          
        // </Tooltip>
        <div
            className="select-option"
          >
            <span className="left-wrapper">
              <span className="select-text">
                {optionText}
              </span>
             { props.assignedType !=="None"?(
                <Popover 
                  placement="right" 
                  title={<span>Add to</span>} 
                  content={<div>
                            <p style={{cursor: 'pointer'}} onClick={(e) => handleOptionSelect(domain, e)}>Primary Endpoint</p>
                            <p style={{cursor: 'pointer'}}  onClick={(e) => handleOptionSelectForSecondary(domain, e)}>Secondary Endpoint</p> 
                          </div>} 
                  trigger="click">
                    <span className="right-add">
                      Add
                    </span>                
                </Popover>
              ):(<span className="right-add" onClick={(e) => handleOptionSelect(domain, e)}>
              Add
            </span>)}
            </span>
            <span className="more-button" onClick={(e) => handleMore(domain, e)}>
              {activeMore === 0 ?<RightOutlined style={{color: '#7C7C7C', fontSize: 13}} />:<LeftOutlined style={{color: '#7C7C7C', fontSize: 13}}/>}
            </span>
          </div>
      ) : (
        <div className="select-option selected" >
          <span className="left-wrapper" onClick={(e) => handleOptionSelect(domain, e)}>
            <span className="select-text">
              {optionText}
            </span>
            <span className="right-icon">
              <CheckOutlined />
            </span>
          </span>
          <span className="more-button" onClick={(e) => handleMore(domain, e)}>
              {activeMore === 0 ?<RightOutlined style={{color: '#7C7C7C', fontSize: 13}}/>:<LeftOutlined style={{color: '#7C7C7C', fontSize: 13}}/>}
          </span>
        </div>
      )}
    </div>

    // <div style={{ display: "inline-block" }}>
    //   {activeType == 0 ? (
    //     <Tooltip
    //       title={
    //         "Frequency " + Math.floor(domain.Frequency * 10000) / 100 + "%"
    //       }
    //     >
    //       <span
    //         className="select-option"
    //         onClick={(e) => handleOptionSelect(domain, e)}
    //       >
    //         <span className="select-text">
    //           {domain.Text}
    //          </span>
    //       </span>
    //     </Tooltip>
    //   ) : (
    //     <div className="select-option selected" onClick={(e) => handleOptionSelect(domain, e)}>
    //       <span className="select-text">
    //         <CheckOutlined />
    //         {domain.Text}
    //       </span>
    //     </div>
    //   )}
    // </div>
  );
};

export default CriteriaOption;
