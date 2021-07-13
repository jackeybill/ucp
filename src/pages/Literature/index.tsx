import React, { useState, useEffect, useReducer } from "react";
import { Input, Menu, Dropdown, Checkbox, Collapse, InputNumber } from "antd";
import {
  DownOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  SearchOutlined,
  CloseCircleOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
} from "@ant-design/icons";
import pdf from "../../assets/pdf.svg";
import "./index.scss";

interface literatureIF {
  fileType?:String,
  productTypes?:String,
  drugNames?:String,
  title: String,
  text: String,
  articleSource:String,
}

const { Panel } = Collapse;
const source = [
  "www.ema.europe.eu",
  "www.accessdata.fda.gov",
  "dailymed.nim.nih.gov",
];

const mockData = [
  {
    fileTypes:"pdf",
    productTypes:'',
    drugNames:'',
    title: "208119.pdf",
    text: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, insulin do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    articleSource: "www.ema.europe.eu",
  },
  {
    fileTypes:"pdf",
    productTypes:'',
    drugNames:'',
    title: "208120.pdf",
    text: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, insulin do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    articleSource: "www.ema.europe.eu",
  },
  {
    fileTypes:"txt",
    productTypes:'',
    drugNames:'',
    title: "208121.txt",
    text: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, insulin do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    articleSource: "dailymed.nim.nih.gov",
  },
  {
    fileTypes:"txt",
    productTypes:'',
    drugNames:'',
    title: "208122.txt",
    text: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, insulin do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    articleSource: "dailymed.nim.nih.gov",
  },
  {
    fileTypes:"pdf",
    productTypes:'',
    drugNames:'',
    title: "208127.pdf",
    text: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, insulin do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    articleSource: "www.ema.europe.eu",
  },
  {
    fileTypes:"docx",
    productTypes:'',
    drugNames:'',
    
    title: "208123.docx",
    text: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, insulin do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    articleSourcee: "www.accessdata.fda.gov",
  },
  {
    fileTypes:"pdf",
    productTypes:'',
    drugNames:'',
    title: "208124.pdf",
    text: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, insulin do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    articleSource: "www.accessdata.fda.gov",
  },
  {
    fileTypes:"docx",
    productTypes:'',
    drugNames:'',
    title: "208125.docx",
    text: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, insulin do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    articleSource: "www.ema.europe.eu",
  },
  {
    fileTypes:"docx",
    productTypes:'',
    drugNames:'',
    title: "208126.docx",
    text: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, insulin do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    articleSource: "www.ema.europe.eu",
  },
];

const paginationOptions = [10, 20, 30, 40, 50];
const fileTypes = ["pdf", "docx", "txt"];
const drugNames = ["drug1", "drug2"];
const products = ["product1", "product2"];
const initialFilters = {
  articleSource: [],
  fileTypes: [],
  productTypes: [],
  drugNames: [],
};

const Literature = (props:any) => {
  const [number, setNumber] = useState(paginationOptions[0]);
  const [keyword, setKeyword] = useState("");
  const [pageNumber, setPageNumber] = useState(10);
  const [dataSource, setDatasource] = useState(mockData)
  const [filteredData, setFilteredData]=  useState(mockData)
  const [filters, setFilters] = useReducer(
    (state, newState) => ({ ...state, ...newState }),
    { ...initialFilters }
  );

  useEffect(() => {
    let tmpArr =[]
    let tmpFilteredData = dataSource.slice(0) 
    Object.keys(filters).forEach( (key) =>{
      if(filters[key].length>0){
        let tmpData= dataSource.slice(0).filter( (d)=>{        
         return filters[key].length>0 && filters[key].indexOf(d[key])>-1
        })
        tmpFilteredData = tmpArr.concat(tmpData)
        return tmpFilteredData
      }
    })
    setFilteredData(tmpFilteredData)  
  }, [filters])

  const onCheckChange = (checkedValues, key) => {
    setFilters({ [key]: checkedValues });
  };

  const sortMenu = (
    <Menu>
      <Menu.Item>
        <a
          target="_blank"
          // rel="noopener noreferrer"
          // href="https://www.antgroup.com"
        >
          time
        </a>
      </Menu.Item>
    </Menu>
  );

  const onKeywordChange = (e) => {
    setKeyword(e.target.value);
  };

  const onViewNumberChange = (value) => {
    setNumber(value);
  };

  return (
    <div className="literature-search-container">
      <div className="search-wrapper">
        <span className="greeting">What would you like to search?</span>
        <div className="input-wrapper">
          <Input
            value={keyword}
            onChange={onKeywordChange}
            allowClear
            prefix={<SearchOutlined />}
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
                  options={source}
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
          {filteredData.map((data, idx) => {
            return (
              <div className="article-item">
                <p className="article-title">
                  <a href="#">
                    <img src={pdf} alt="" className="pdf-icon" />
                    {data.title}
                  </a>
                  {idx == 0 ? <span className="tag">Recommended</span> : null}
                </p>
                <div className="article-conent">{data.text}</div>
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
                  <div>Source:{data.articleSource}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Literature;
