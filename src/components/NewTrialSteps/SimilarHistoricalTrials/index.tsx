import React from "react";
import { Table, Row, Col, Select, Button, Spin,Slider  } from "antd";
import { FilterOutlined } from "@ant-design/icons";
import CustomChart from "../../CustomChart";
import { phase_options, study_types } from "../../../pages/TrialPortfolio";
import { listStudy } from '../../../utils/ajax-proxy';
import { connect } from "react-redux";
import * as createActions from "../../../actions/createTrial.js";
import "./index.scss";

const { Option } = Select;

const columns = [
  {
    title: "Study Title",
    dataIndex: "brief_title",
    ellipsis: true,
  },
  {
    title: "Company",
    dataIndex: "-",
    ellipsis: true,
    render: (text) => <span>-</span>,
  },
  {
    title: "Drug",
    dataIndex: "indication",
    ellipsis: true,
  },
  {
    title: "Status",
    dataIndex: "-",
    ellipsis: true,
    render: (text) => <span>-</span>,
  },
  {
    title: "Phase",
    dataIndex: "phase",
    ellipsis: true,
  },
];


var chartData1 = [
  { value: 75, name: "AstraZaeneca" },
  { value: 12, name: "Pfizer" },
  { value: 8, name: "Merck" },
  { value: 8, name: "Boehringer Ingelheim" },
  { value: 75, name: "Novo Nordisk" },
  { value: 12, name: "Eli Lily" },
  { value: 8, name: "Abbott" },
];

var chartData2 = [
  { value: 75, name: "Completed" },
  { value: 25, name: "Recruiting" },
];
interface HistoricalProps {
  createTrial: any,
  newTrial:any
}


class SimilarHistoricalTrial extends React.Component<HistoricalProps> {
  constructor(props: HistoricalProps) {
    super(props);
    this.onFindTrials = this.onFindTrials.bind(this);
  }

  state = {
    current: 1,
    pageSize: 5,
    pageSizeOptions: ["5", "10", "20", "50", "100"],
    sideBar: 2,
    showFilter: false,
    studyType: "",
    studyPhase: "",
    studyStatus: "",
    indication: "",
    pediatric: "",
    studyDate: [],
    selectedRowKeys: this.props.newTrial.similarHistoricalTrials,
    spinning: false,
    data: [],
    rawData: [],
    marks: {
      2010: '2010',
      2012: '2012',
      2014: '2014',
      2016: '2016',
      2018: '2018',
      2020: '2020'
    }
  };
  componentDidMount() {
    this.getHistoryList()
  }

  getHistoryList = async () => {
    this.setState({
      spinning:true
    })
    const resp = await listStudy();
    this.setState({
      spinning:false
    })
      
    if (resp.statusCode == 200) {
      const tmpData = JSON.parse(resp.body).map((d) => {
        d.key = d["nct_id"]
        return d
      });
      console.log('history list----', tmpData)
      this.setState({
          data: tmpData,
          rawData:tmpData 
        })     
      }
  }

  changePage = (page) => {
    this.setState({
      current: page,
    });
  };

  onShowSizeChange = (current, pageSize) => {
    this.setState({
      current: current,
      pageSize: pageSize,
    });
  };

  showFilter = () => {
    if (this.state.showFilter) {
      this.setState({
        sideBar: 2,
        showFilter: false,
      });
    } else {
      this.setState({
        sideBar: 6,
        showFilter: true,
      });
    }
  };

  onSelectChange = (key, v) => {
    this.setState({
      [key]: v,
    });
  };

  onFindTrials = () => {
    const filteredData = this.state.rawData.filter((d) => {
      return (
        (this.state.studyPhase != ""
          ? d.phase == this.state.studyPhase
          : true) &&
        (this.state.studyType != ""
          ? d.study_type == this.state.studyType
          : true) &&
        (this.state.indication != ""
          ? d.indication == this.state.indication
          : true)
      );
    });
    this.setState({
      data: filteredData,
    });
  };

  optionOne = {
    title: {
      text: "By Sponsor",
      x: "left",
      y: "top",
      textStyle: {
        fontSize: 14,
      },
    },
    legend: {
      x: "left",
      y: "50%",
      itemHeight: 7,
      textStyle: {
        fontSize: 8,
      },
      formatter: function (name) {
        let tempData = chartData1;
        let total = 0;
        let tarValue = 0;
        for (let i = 0, l = tempData.length; i < l; i++) {
          total += tempData[i].value;
          if (tempData[i].name == name) {
            tarValue = tempData[i].value;
          }
        }
        let p = ((tarValue / total) * 100).toFixed(2);
        return name + " - " + p + "%";
      },
      data: [
        "Abbott",
        "Eli Lily",
        "Novo Nordisk",
        "Boehringer Ingelheim",
        "Merck",
        "Pfizer",
        "AstraZaeneca",
      ],
    },
    series: [
      {
        type: "pie",
        center: ["20%", "30%"],
        radius: ["18%", "38%"],
        avoidLabelOverlap: false,
        label: {
          show: false,
        },
        color: [
          "#d04a02",
          "#d4520d",
          "#d85d1c",
          "#de6c30",
          "#e47d47",
          "#e68d5e",
          "#e8aa89",
        ],
        data: chartData1,
      },
    ],
  };

  optionTwo = {
    title: {
      text: "By Status",
      x: "left",
      y: "top",
      textStyle: {
        fontSize: 14,
        fontWeight: "bold",
      },
    },
    legend: {
      x: "left",
      y: "50%",
      itemHeight: 7,
      textStyle: {
        fontSize: 8,
      },
      formatter: function (name) {
        let tempData = chartData2;
        let total = 0;
        let tarValue = 0;
        for (let i = 0, l = tempData.length; i < l; i++) {
          total += tempData[i].value;
          if (tempData[i].name == name) {
            tarValue = tempData[i].value;
          }
        }
        let p = ((tarValue / total) * 100).toFixed(2);
        return name + " - " + p + "%";
      },
      data: ["Completed", "Recruiting"],
    },
    series: [
      {
        type: "pie",
        center: ["40%", "30%"],
        radius: ["30%", "65%"],
        avoidLabelOverlap: false,
        label: {
          show: false,
        },
        color: ["#d04a02", "#ed7738"],
        data: chartData2,
      },
    ],
  };
  onRowSelectChange = (selectedRowKeys) => {
    console.log("selectedRowKeys changed: ", selectedRowKeys);
    this.setState({ selectedRowKeys });
    this.props.createTrial({
      similarHistoricalTrials:selectedRowKeys
    })
  };
  handleDateChange = (value) => {
    console.log( value)
    
  }

  render() {
    const rowSelection = {
      selectedRowKeys: this.state.selectedRowKeys,
      onChange: this.onRowSelectChange,
    };
    return (
      <div className="historical-trial-list">
        <Row>
          <Col span={24} style={{ marginBottom: "10px" }}>
            <span className="step-desc">
              Refine the list of similar historical trials that you will use to
              design your trial.
            </span>
          </Col>
        </Row>
        <Row>
          <Col span={this.state.sideBar} className="side-bar">
            <FilterOutlined onClick={this.showFilter} className="filter-icon" />
            {this.state.showFilter ? (
              <>
                <div className="filter-item">
                  <label>STUDY PHASE</label>
                  <Select
                    value={this.state.studyPhase}
                    style={{ width: "100%" }}
                    onChange={(e) => this.onSelectChange("studyPhase", e)}
                  >
                    {phase_options.map((o) => {
                      return (
                        <Option value={o} key={o}>
                          {o}
                        </Option>
                      );
                    })}
                  </Select>
                </div>

                <div className="filter-item">
                  <label>STUDY TYPE</label>
                  <Select
                    value={this.state.studyType}
                    style={{ width: "100%" }}
                    onChange={(e) => this.onSelectChange("studyType", e)}
                  >
                    {study_types.map((o) => {
                      return (
                        <Option value={o} key={o}>
                          {o}
                        </Option>
                      );
                    })}
                  </Select>
                </div>
                <div className="filter-item">
                  <label>STUDY STATUS</label>
                  <Select
                    value={this.state.studyStatus}
                    style={{ width: "100%" }}
                    onChange={(e) => this.onSelectChange("studyStatus", e)}
                  >
                    {["Completed", "In Progress", "Not Started"].map((o) => {
                      return (
                        <Option value={o} key={o}>
                          {o}
                        </Option>
                      );
                    })}
                  </Select>
                </div>
                <div className="filter-item">
                  <label>INDICATION</label>
                  <Select
                    value={this.state.indication}
                    style={{ width: "100%" }}
                    onChange={(e) => this.onSelectChange("indication", e)}
                  >
                    {["Type 2 Diabetes"].map((o) => {
                      return (
                        <Option value={o} key={o}>
                          {o}
                        </Option>
                      );
                    })}
                  </Select>
                </div>
                <div className="filter-item">
                  <label>PEDIATRIC</label>
                  <Select
                    value={this.state.pediatric}
                    style={{ width: "100%" }}
                    onChange={(e) => this.onSelectChange("pediatric", e)}
                  >
                    {["YES", "NO"].map((o) => {
                      return (
                        <Option value={o} key={o}>
                          {o}
                        </Option>
                      );
                    })}
                  </Select>
                </div>
                <div className="filter-item">
                  <label>STUDY START DATE</label>
                  <Slider min={2010} max={2020} range marks={this.state.marks} dots defaultValue={[2010, 2020]} onChange={ this.handleDateChange}/>
                </div>
                <div>
                  <Button type="primary" onClick={this.onFindTrials}>
                    Find Trials
                  </Button>
                </div>
              </>
            ) : null}
          </Col>
         
          <Col span={24 - this.state.sideBar} className="historical-desc">
             <Spin spinning={this.state.spinning}>
              <Row>
                <Col span={6} style={{ borderRight: "1px solid #ddd" }}>
                  <h4>{this.state.data && this.state.data.length}</h4>
                  <span className="num-desc">Total Number of Trials</span>
                </Col>
                <Col span={12}>
                  <CustomChart
                    option={this.optionOne}
                    height={200}
                  ></CustomChart>
                </Col>
                <Col span={6}>
                  <CustomChart
                    option={this.optionTwo}
                    height={200}
                  ></CustomChart>
                </Col>
              </Row>
              <Row>
                <Table
                  columns={columns}
                  dataSource={this.state.data}
                  pagination={{
                    position: ["bottomRight"],
                    // pageSize: this.state.pageSize,
                    pageSize: 5,
                    onChange: this.changePage,
                    current: this.state.current,
                    total: this.state.data.length,
                    // showTotal: (total, range) => `${range[0]}-${range[1]} of ${this.state.data.length} items`,
                    // showSizeChanger: true,
                    // onShowSizeChange: this.onShowSizeChange,
                    // pageSizeOptions: this.state.pageSizeOptions
                  }}
                  sticky
                  // scroll={{y: 300}}
                  rowSelection={rowSelection}
                />          
              </Row>
              </Spin>
            </Col>
        </Row>
      </div>
    );
  }
}


const mapDispatchToProps = (dispatch) => ({
  createTrial: (val) => dispatch(createActions.createTrial(val)),
});

const mapStateToProps = (state) => ({
  newTrial: state.trialReducer,

});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SimilarHistoricalTrial);
