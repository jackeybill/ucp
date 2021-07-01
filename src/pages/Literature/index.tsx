import React, { useState, useEffect, useReducer } from "react";
import { Input, Menu, Dropdown, Checkbox, Collapse, InputNumber } from "antd";
import {
  DownOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import pdf from "../../assets/pdf.svg";
import "./index.scss";

const { Panel } = Collapse;
const articleSource = [
  "www.ema.europe.eu(10)",
  "www.accessdata.fda.gov(8)",
  "dailymed.nim.nih.gov(2)",
];
const paginationOptions = [10, 20, 30, 40, 50];
const fileTypes = ["pdf", "word", "txt"];
const drugNames = ["drug1", "drug2"];
const products = ["product1", "product2"];
const initialFilters = {
  articleSource: [],
  fileTypes: [],
  productTypes: [],
  drugNames: [],
};

const Literature = () => {
  const [number, setNumber] = useState(paginationOptions[0]);
  const [keyword, setKeyword] = useState("");
  const [filters, setFilters] = useReducer(
    (state, newState) => ({ ...state, ...newState }),
    { ...initialFilters }
  );
  const onCheckChange = (checkedValues, key) => {
    // console.log(checkedValues, key)
    setFilters({ [key]: checkedValues });
  };

  const sortMenu = (
    <Menu>
      <Menu.Item>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.antgroup.com"
        >
          1st menu item
        </a>
      </Menu.Item>
      <Menu.Item danger>a danger item</Menu.Item>
    </Menu>
  );

  const onKeywordChange = (e) => {
    setKeyword(e.target.value);
  };

  const onViewNumberChange = (value) => {
    setNumber(value);
  };

  console.log("filters----", filters);

  return (
    <div className="literature-search-container">
      <div className="search-wrapper">
        <span className="greeting">What would you like to search?</span>
        <div className="input-wrapper">
          <Input
            placeholder="Basic usage"
            value={keyword}
            onChange={onKeywordChange}
            allowClear
          />
          <div className="customize-sufix">
            <div className="total-numbers">100 results</div>
            <div className="sort-wrapper">
              <Dropdown overlay={sortMenu}>
                <a
                  className="ant-dropdown-link"
                  onClick={(e) => e.preventDefault()}
                >
                  Sort by <DownOutlined />
                </a>
              </Dropdown>
            </div>
            <div className="number-wrapper">
              View
              <InputNumber
                size="large"
                min={paginationOptions[0]}
                max={paginationOptions[paginationOptions.length - 1]}
                step={10}
                value={number}
                defaultValue={paginationOptions[0]}
                onChange={onViewNumberChange}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="main-content">
        <div className="sidebar">
          <div className="filter-by">Filter by</div>
          <div className="filter-item">
            <Collapse defaultActiveKey={["1"]} expandIconPosition="right">
              <Panel header="Article Source" key="1">
                <Checkbox.Group
                  options={articleSource}
                  onChange={(e) => onCheckChange(e, "articleSource")}
                />
              </Panel>
              <Panel header="File Type" key="fileTypes">
                <Checkbox.Group
                  options={fileTypes}
                  onChange={(e) => onCheckChange(e, "fileTypes")}
                />
              </Panel>
              <Panel header="Product Type" key="productTypes">
                <Checkbox.Group
                  options={products}
                  onChange={(e) => onCheckChange(e, "productTypes")}
                />
              </Panel>
              <Panel header="Drug Name" key="drugNames">
                <Checkbox.Group
                  options={drugNames}
                  onChange={(e) => onCheckChange(e, "drugNames")}
                />
              </Panel>
            </Collapse>
          </div>
        </div>
        <div className="literature-list">
          <div className="article-item">
            <p className="article-title">
              <a href="#">
                <img src={pdf} alt="" className="pdf-icon" />
                208119.pdf
              </a>
              <span className="tag">Recommended</span>
            </p>
            <div className="article-conent">
              ssad sfhjffh ahfahJS AKFHSkj hss  hh hsab akjhs akj hak halfaslgfa lgfal gjhcbj hsbc syfg efiueq fgpq efqe ifg uiqd
            </div>
            <div className="user-actions">
              <div className="action-btn">
                <span className="share-btn">
                  <ShareAltOutlined />
                  share
                </span>
                <span className="download-btn">
                  <DownloadOutlined />
                  download
                </span>
              </div>
              <div>Source:www.ema.europe.eu</div>
            </div>
                  </div>
                   <div className="article-item">
            <p className="article-title">
              <a href="#">
                <img src={pdf} alt="" className="pdf-icon" />
                208119.pdf
              </a>
              <span className="tag">Recommended</span>
            </p>
            <div className="article-conent">
              ssad sfhjffh ahfahJS AKFHSkj hss  hh hsab akjhs akj hak halfaslgfa lgfal gjhcbj hsbc syfg efiueq fgpq efqe ifg uiqd
            </div>
            <div className="user-actions">
              <div className="action-btn">
                <span className="share-btn">
                  <ShareAltOutlined />
                  share
                </span>
                <span className="download-btn">
                  <DownloadOutlined />
                  download
                </span>
              </div>
              <div>Source:www.ema.europe.eu</div>
            </div>
                  </div>
                   <div className="article-item">
            <p className="article-title">
              <a href="#">
                <img src={pdf} alt="" className="pdf-icon" />
                208119.pdf
              </a>
              <span className="tag">Recommended</span>
            </p>
            <div className="article-conent">
              ssad sfhjffh ahfahJS AKFHSkj hss  hh hsab akjhs akj hak halfaslgfa lgfal gjhcbj hsbc syfg efiueq fgpq efqe ifg uiqd
            </div>
            <div className="user-actions">
              <div className="action-btn">
                <span className="share-btn">
                  <ShareAltOutlined />
                  share
                </span>
                <span className="download-btn">
                  <DownloadOutlined />
                  download
                </span>
              </div>
              <div>Source:www.ema.europe.eu</div>
            </div>
                  </div>
                   <div className="article-item">
            <p className="article-title">
              <a href="#">
                <img src={pdf} alt="" className="pdf-icon" />
                208119.pdf
              </a>
              <span className="tag">Recommended</span>
            </p>
            <div className="article-conent">
              ssad sfhjffh ahfahJS AKFHSkj hss  hh hsab akjhs akj hak halfaslgfa lgfal gjhcbj hsbc syfg efiueq fgpq efqe ifg uiqd
            </div>
            <div className="user-actions">
              <div className="action-btn">
                <span className="share-btn">
                  <ShareAltOutlined />
                  share
                </span>
                <span className="download-btn">
                  <DownloadOutlined />
                  download
                </span>
              </div>
              <div>Source:www.ema.europe.eu</div>
            </div>
                  </div>
                   <div className="article-item">
            <p className="article-title">
              <a href="#">
                <img src={pdf} alt="" className="pdf-icon" />
                208119.pdf
              </a>
              <span className="tag">Recommended</span>
            </p>
            <div className="article-conent">
              ssad sfhjffh ahfahJS AKFHSkj hss  hh hsab akjhs akj hak halfaslgfa lgfal gjhcbj hsbc syfg efiueq fgpq efqe ifg uiqd
            </div>
            <div className="user-actions">
              <div className="action-btn">
                <span className="share-btn">
                  <ShareAltOutlined />
                  share
                </span>
                <span className="download-btn">
                  <DownloadOutlined />
                  download
                </span>
              </div>
              <div>Source:www.ema.europe.eu</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Literature;
