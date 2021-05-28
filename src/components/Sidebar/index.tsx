import React from "react";
import { UserOutlined } from "@ant-design/icons";
import "./index.scss";

const Sidebar = (props: any) => {
  const info = props.info;
  return (
    <div className="sidebar__container">
      <div className="name-tag">
        <UserOutlined />
        <div>
          <p>{info.name || "-"}</p>
          <span>{info.sex || "-"}</span>
          <br />
          <span>
            {info.birth || "-"}, {info.age || "-"} y/o
          </span>
        </div>
      </div>
      <div className="item">
        <label>ELIGIBILITY</label>
        <p>{info.eligibility || "-"}</p>
      </div>
      <div className="item">
        <label>MEMBER ID</label>
        <p>{info["MEMBER ID"] || "-"}</p>
      </div>
      {/* <div className="item">
        <label>BHP</label>
        <p>02/01/2018-12/31/2025</p>
      </div> */}
      <div className="item">
        <label>LANGUAGE(1st)</label>
        <p>{info.language || "-"}</p>
      </div>
      {/* <div className="item">
        <label>PCP</label>
        <p>MD Sean Owens</p>
      </div> */}
      <div className="item">
        <label>PHONE</label>
        <p>{info.phone || "-"}</p>
      </div>
      {/* <div className="item">
        <label>Primary case owener(s)</label>
        <p>Kevin Valdez</p>
      </div> */}
      {/* <div className="item">
        <label>Secondary case owener(s)</label>
        <p>Kathleen Guerrero</p>
      </div> */}
    </div>
  );
};

export default Sidebar;
