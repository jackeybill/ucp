import React from "react";
import { Button } from 'react-bootstrap';
import { Link } from "react-router-dom";
import pwcImg from "../../search/images/pwc.jpg";
import flagImg from "../../search/images/flag.png";
import profileImg from "../../search/images/profile.png";
import "./Header.scss";

interface HeaderProps {
  reset: () => void;
}

interface HeaderState {}

export default class Header extends React.Component<
  HeaderProps,
  HeaderState
> {

  render() {

    return (
      <div className="header">
        <div className="left">
          <Link to="/"><img src={pwcImg} onClick={this.props.reset}/></Link>
        </div>
        <div className="right">
          {/* <img src={flagImg} />
          <img src={profileImg} /> */}
          <Link to="/history"><div>History</div></Link>
        </div>
      </div>
    );
  }
}
