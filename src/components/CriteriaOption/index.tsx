import React, { useState, useReducer, useEffect } from "react";
import { Input, Button, Tooltip } from "antd";
import { CheckOutlined, RightOutlined, LeftOutlined  } from "@ant-design/icons";

const CriteriaOption = (props) => {
  const domain = props.demographic;
  const [activeType, setActiveType] = useState(0);
  const [activeMore, setActiveMore] = useState(0);

  useEffect(() => {
    const res = props.selectedEle.findIndex((e) => {
      return e["Eligibility Criteria"] == domain.Text;
    });
    setActiveType(res != -1 ? 1 : 0);
  }, [props.selectedEle, props.minValue, props.maxValue]);

  const handleOptionSelect = (domain, e) => {
    if (activeType == 0) {
      setActiveType(1);
      props.handleOptionSelect(domain, 1, props.index, props.idx);
    } else {
      setActiveType(0);
      props.handleOptionSelect(domain, 0, props.index, props.idx);
    }
  };

  const handleMore = (val, e) => {
    if (activeMore == 0) {
      setActiveMore(1);
      props.handleMoreSelect(val, 1, props.index, props.idx);
    } else {
      setActiveMore(0);
      props.handleMoreSelect(val, 0, props.index, props.idx);
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
            <span className="left-wrapper" onClick={(e) => handleOptionSelect(domain, e)}>
              <span className="select-text">
                {domain.Text}
              </span>
              <span className="right-add">
                Add
              </span>
            </span>
            <span className="more-button" onClick={(e) => handleMore(domain, e)}>
              {activeMore== 0 ?<RightOutlined style={{color: '#7C7C7C', fontSize: 13}} />:<LeftOutlined style={{color: '#7C7C7C', fontSize: 13}}/>}
            </span>
          </div>
      ) : (
        <div className="select-option selected" >
          <span className="left-wrapper" onClick={(e) => handleOptionSelect(domain, e)}>
            <span className="select-text">
              {domain.Text}
            </span>
            <span className="right-icon">
              <CheckOutlined />
            </span>
          </span>
          <span className="more-button" onClick={(e) => handleMore(domain, e)}>
              {activeMore== 0 ?<RightOutlined style={{color: '#7C7C7C', fontSize: 13}}/>:<LeftOutlined style={{color: '#7C7C7C', fontSize: 13}}/>}
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
