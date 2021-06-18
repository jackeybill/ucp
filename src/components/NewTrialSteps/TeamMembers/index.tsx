import React, { useState, useEffect } from "react";
import { Input, Select, Button } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import "./index.scss";

const { Option } = Select;
const roleList = ["Trial Designer"];

const usersA = [
  {
    name: "user1",
    id: "001",
    role: "Trial Designer",
  },
  {
    name: "user2",
    id: "002",
    role: "Trial Designer",
  },
  {
    name: "user3",
    id: "003",
    role: "Trial Designer",
  },
];

const TeamMembers = () => {
  const [id, setId] = useState("");
  const [role, setRole] = useState("");
  const [users, setUsers] = useState(usersA);
    

  const handleInputChange = (e) => {
    setId(e.target.value);
  };

    const handleSelectChange = (e) => {
      console.log(e)
    setRole(e);
  };

    const handleAdd = () => {
        const tmp = users.slice(0)
        tmp.push({
            name:'test',
            role,
            id
        })
        setUsers(tmp)
  };

    const handleRemove = (id) => {
        const tmp = users.slice(0)
        const targetIdx = tmp.findIndex(e => e.id == id)
        tmp.splice(targetIdx,1)
        setUsers(tmp) 
  };

  return (
    <div className="team-members-container">
      <div className="add-box">
        <div>
          <label>SEARCH AND ADD USERS</label>
          <Input
            allowClear
            placeholder="Enter guid"
            value={id}
            style={{ width: "100%", height: 30 }}
            onChange={(e) => handleInputChange(e)}
          />
        </div>
        <div>
          <label>SELECT ROLE</label>
          <Select value={role} placeholder="Select" style={{ width: "100%" }} onChange={handleSelectChange}>
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
                  Total Users <i className={`count count-icon ${users.length>0?"active-count":"inactive-count"}`}>{ users.length}</i>
        </span>
        <div className="user-list">
          {users.map((u) => {
            return (
                <div className="user-item" key={u.id}>               
                <span className="icon">{u.name.slice(0,2).toUpperCase()}</span>
                <div>
                  <span className="name">{u.name}</span><br/>
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

export default TeamMembers;
