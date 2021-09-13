import React, { useState, useEffect } from "react";
import { withRouter } from "react-router";
import Cookies from "js-cookie";
import { Form, Input, Button, Checkbox } from "antd";
import { getUrlParams } from "../../utils/utils";
import { login, verifyToken } from "../../utils/ajax-proxy";
import background from "../../assets/background.png";
import "./index.scss";
import Footer from '../../components/Footer'

const backgroundImg = {
  background: "url(" + background + ")",
  backgroundRepeat: "no-repeat",
  overflow: "hidden",
  marginLeft: "-3px",
  backgroundSize: "100%",
};

const LoginErr = "Invalidate username or password";

const Login = (props: any) => {
  const [form] = Form.useForm();
  const usernameLogin = async (values: any) => {
    const resp = await login(values);
    if (resp.statusCode == 200) {
      Cookies.set("role", values.role);
      Cookies.set("username", values.username);
      resp.body.AuthenticationResult &&
        verifyTokenFn(resp.body.AuthenticationResult.IdToken);
    } else {
      const errMsg = resp.body || LoginErr;
      form.setFields([
        {
          name: "username",
          errors: [errMsg],
        },
        {
          name: "password",
          errors: [errMsg],
        },
      ]);
    }
  };

  const verifyTokenFn = async (token: string) => {
    const result = await verifyToken(token);
    result && Cookies.set("username", result);
    result && props.history.push('/overview')  
  };

  // useEffect(() => {
  //   if (getUrlParams("authorization")) {
  //     // dont verify now, back-end not ready
  //     // verifyToken(getUrlParams('authorization'))
  //     Cookies.set("username", getUrlParams("gmail"));
  //    props.history.push('/overview')
  //   }
  // }, [window.location.href]);

  return (
    <>
      <div className="login__container">
        <div className="continer__left" style={backgroundImg}></div>
        <div className="continer__right">
          <div className="login__form-wrapper">
            <div className="welcome__title">
              Welcome to <br />
              Protocol Digitization
            </div>

            <div className="login__form">
              <Form
                name="normal_login"
                className="login-form"
                onFinish={usernameLogin}
                size="small"
                form={form}
              >
                <label htmlFor="username" className="form__label">
                  Username
                </label>
                <Form.Item
                  name="username"
                  rules={[
                    {
                      required: true,
                      message: "Please input your username!",
                    },
                  ]}
                  className="input__form-name"
                >
                  <Input size="small" />
                </Form.Item>
                <label htmlFor="password" className="form__label">
                  Password
                </label>
                <Form.Item
                  name="password"
                  rules={[
                    {
                      required: true,
                      message: "Please input your password!",
                    },
                  ]}
                  className="input__form-password"
                >
                  <Input type="password" size="small" />
                </Form.Item>

                <Form.Item>
                  <div className="form__footer">
                    <div className="left">
                      <Checkbox className="check__remember">Remember me</Checkbox>
                    </div>
                  </div>
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    className="login__button"
                  >
                    Login
                  </Button>
                  <div className="forget__password">Forgot password?</div>
                </Form.Item>
              </Form>
            </div>
          </div>
        </div>
      </div>
      <Footer></Footer>
    </>
  );
};

export default withRouter(Login);
