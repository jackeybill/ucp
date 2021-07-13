import React, { useState, useEffect } from "react";
import { withRouter } from "react-router";
import { Layout, Popconfirm, Tabs, Menu, Input, Breadcrumb } from "antd";
import { SearchOutlined, HomeOutlined } from "@ant-design/icons";
import TrialPortfolio from "../TrialPortfolio";
import FooterCompt from '../../components/Footer';
import ScenarioPage from '../ScenarioPage';
import Literature from '../Literature';
import Logo from "../../assets/pwc-logo-white.svg";
import Cookies from "js-cookie";

import "./index.scss";

const { TabPane } = Tabs;

const getUsername = (emailAddress: any) => {
  if (emailAddress.indexOf("@") == -1) return;
  let name = emailAddress.split("@")[0];
  if (name.indexOf(".") > 0) {
    name = name.split(".").join(" ");
  }
  return name;
};
const { Header, Content ,Footer} = Layout;

const GlobalLayout = (props: any) => {
  const [username, setUsername] = useState("");
  const [searchTxt, setSearchTxt] = useState("");
  const [showSearch, setShowSearch] = useState(false)
  const [current, setCurrent] = useState("trial")
  let content: any;

  useEffect(() => {
    if (Cookies.get("username")) {
      setUsername(Cookies.get("username"));
      // setCurrent(ROLE_MENUE_MAPPING[Cookies.get("role")][0]);
    } else {
      // props.history.push("/");
    }
  }, []);

  const onTextChange = (e) => {
    setSearchTxt(e.target.value);
  };

  function confirm() {
    Cookies.set("username", "");
    Cookies.set("role", "");
    props.history.push("/");
  }

  const renderContent = (searchTxt = "") => {
    const current = props.location.pathname;
    switch (current) {
      case "/trials":
        content = <TrialPortfolio keyWords={searchTxt} showSearch={ showSearch} setShowSearch={(v)=>setShowSearch(v)}/>;
        break;
      case "/scenario":
        content = (
          <ScenarioPage/>
        );
        break;
      case "/literature":
        content = (
          <Literature/>
        );
        break;
      default:
        break;
    }
    return content;
  };
  const handleClick = (e) => {
    setCurrent(e.key)
    props.history.push('/'+e.key)
  }

  return (
    <Layout className="intell-trial-layout">
      <Header>
        <div className="header-left">
          <div className="system__info">
            <img src={Logo} alt="" width="40px" height="40px" />
            <span className="system__info_title" onClick={()=>props.history.push('/trials')}>Intelligent Trial Design</span>
          </div>
          <div className="menu-box">
            <Menu mode="horizontal" defaultSelectedKeys={['trials']} selectedKeys={[current]} onClick={handleClick}>
              <Menu.Item key="trials">My Trials</Menu.Item>
              <Menu.Item key="literature">Literature Search</Menu.Item>
            </Menu>
          </div>
        </div>
        <div className="header-right">
          {
            showSearch && <Input
            placeholder="Search"
            prefix={<SearchOutlined />}
            style={{ width: 200, height: 30 }}
            onChange={onTextChange}
            value={searchTxt}
          />
          }      
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
        </div>
      </Header>
      <Content>
        {/* <Breadcrumb>
            <Breadcrumb.Item
              className="homepage"
              // onClick={() => setShowDetails(false)}
            >
              <span>
                <HomeOutlined />
                My Trials
              </span>
            </Breadcrumb.Item>
            <Breadcrumb.Item>Trial Design</Breadcrumb.Item>
          </Breadcrumb> */}
        {renderContent(searchTxt)}
      </Content>
       <Footer><FooterCompt/></Footer>
    </Layout>
  );
};

export default withRouter(GlobalLayout);
