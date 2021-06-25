import React, { useState, useEffect } from "react";
import { Input, Select, Button } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { connect } from "react-redux";
import * as createActions from "../../../actions/createTrial.js";
import "./index.scss";

const { Option } = Select;
const roleList = ["Trial Designer"];

const TeamMembers = (props) => {
  const [id, setId] = useState("");
  const [role, setRole] = useState("");
  const [users, setUsers] = useState(props.newTrial.members);

  const handleInputChange = (e) => {
    setId(e.target.value);
  };

  const handleSelectChange = (e) => {
    console.log(e);
    setRole(e);
  };

  const handleAdd = () => {
    const tmp = users.slice(0);
    tmp.push({
      name:id,
      role,
      id,
    });
    setUsers(tmp);
    props.createTrial({
      members: tmp,
    });
  };

  const handleRemove = (id) => {
    const tmp = users.slice(0);
    const targetIdx = tmp.findIndex((e) => e.id == id);
    tmp.splice(targetIdx, 1);
    setUsers(tmp);
  };

  return (
    <div className="team-members-container">
      <div className="add-box">
        <div>
          <label>SEARCH AND ADD USERS</label>
          <Input
            allowClear
            placeholder="Enter user name"
            value={id}
            style={{ width: "100%", height: 30 }}
            onChange={(e) => handleInputChange(e)}
          />
        </div>
        <div>
          <label>SELECT ROLE</label>
          <Select
            value={role}
            placeholder="Select"
            style={{ width: "100%" }}
            onChange={handleSelectChange}
          >
            {roleList.map((role) => {
              return (
                <Option value={role} key={role}>
                  {role}
                </Option>
              );
            })}
          </Select>
        </div>
        <Button type="primary" onClick={handleAdd}>
          Add
        </Button>
      </div>
      <div className="user-list-wrapper">
        <span className="user-list-title">
          Total Users{" "}
          <i
            className={`count count-icon ${
              users.length > 0 ? "active-count" : "inactive-count"
            }`}
          >
            {users.length}
          </i>
        </span>
        <div className="user-list">
          {users.map((u) => {
            return (
              <div className="user-item" key={u.id}>
                <span className="icon">{u.name.slice(0, 2).toUpperCase()}</span>
                <div>
                  <span className="name">{u.name}</span>
                  <br />
                  <span className="id">{u.id}</span>
                </div>
                <div className="role">{u.role}</div>
                <CloseOutlined onClick={() => handleRemove(u.id)} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const mapDispatchToProps = (dispatch) => ({
  createTrial: (val) => dispatch(createActions.createTrial(val)),
});

const mapStateToProps = (state) => ({
  newTrial: state.trialReducer,
});
export default connect(mapStateToProps, mapDispatchToProps)(TeamMembers);
