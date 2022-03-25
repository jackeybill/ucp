import React, { useState, useEffect } from "react";
import { withRouter } from "react-router";
import { Layout, Popconfirm, Menu} from "antd";
import Cookies from "js-cookie";

import ProtocolSection from "../ProtocolSection";
import Footer from '../../components/Footer'
import Overview from "../Overview";
import ChartPage from '../ChartPage'
import Logo from "../../assets/pwc-logo-dark.svg";

import "./index.scss";

const getUsername = (emailAddress: any) => {
  if (emailAddress.indexOf("@") == -1) return;
  let name = emailAddress.split("@")[0];
  if (name.indexOf(".") > 0) {
    name = name.split(".").join(" ");
  }
  return name;
};

const { Header, Content} = Layout;

const GlobalLayout = (props: any) => {
  const [username, setUsername] = useState("");
  const [current, setCurrent] = useState("")

  let content:any

  useEffect(() => {
    if (Cookies.get("username")) {
      setUsername(Cookies.get("username"));
      // setCurrent(ROLE_MENUE_MAPPING[Cookies.get("role")][0]);
    } else {
      // props.history.push("/");
    }
  }, []);

  useEffect(()=>{
    setCurrent(props.match.path.slice(1))
  },[])

  function confirm() {
    Cookies.set("username", "");
    Cookies.set("role", "");
    props.history.push("/");
  }

  const renderContent = () => {
    const current = props.location.pathname
    switch (current) {
      case "/summary":
        content = (
          <ChartPage/>
        );
        break;
      case "/overview":
        content = (
          <Overview/>
        );
        break;
      case "/protocol-sections":
        content = (
          <ProtocolSection/>
        );
        break;
      case "/extraction":
        content = (
          <ProtocolSection/>
        );
        break; 
      default:
        break;
    }
    return content;
  };

 
  const handleClick = (e) => {
    setCurrent(e.key)
    console.log(e.key);
    
    props.history.push('/'+e.key)
  }

  return (
    <Layout className="pa__layout">
      <Header>
        <div className="system__info">
          <img src={Logo} alt="" width="44px" height="44px" onClick={()=>props.history.push('/overview') }/>
          <span>Protocol Digitization</span>
        </div>
        <div className="menu-box">
          <Menu mode="horizontal" selectedKeys={[current]} onClick={handleClick}>
            <Menu.Item key="summary">Summary</Menu.Item>
            <Menu.Item key="overview">List</Menu.Item>
          </Menu>
        </div>
        <div className="user__info">
          <Popconfirm
            className="logout__container"
            title={
              <div className="info__pop">
                <div className="user__tag">
                  {username.slice(0, 2).toLocaleUpperCase()}
                </div>
                <div className="username">
                  <div>{getUsername(username)}</div>
                  <span>{username}</span>
                </div>       
              </div>
            }
            icon={null}
            placement="bottomLeft"
            onConfirm={confirm}
            okText="Sign out"
            okType="text"
            cancelText={<div className="cancel_btn"></div>}
          >
            <div className="user__tag">
              {username.slice(0, 2).toLocaleUpperCase()}
            </div>
          </Popconfirm>
        </div>
      </Header>
      <Content>{renderContent()}</Content>
      <Footer></Footer>
    </Layout>
  );
};

export default withRouter(GlobalLayout)
