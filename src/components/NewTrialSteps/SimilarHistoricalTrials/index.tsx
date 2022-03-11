import React from "react";
import { Table, Row, Col, Select, Button, Spin, Slider, Tooltip } from "antd";
import { FilterOutlined } from "@ant-design/icons";
import CustomChart from "../../CustomChart";
import {
  phase_options,
  study_types,
  study_status,
} from "../../../pages/TrialPortfolio";
import { listStudy } from "../../../utils/ajax-proxy";
import { connect } from "react-redux";
import ReactECharts from "echarts-for-react";
import * as createActions from "../../../actions/createTrial.js";
import * as historyActions from "../../../actions/historyTrial";
import "./index.scss";

const { Option } = Select;

const columns = [
  {
    title: "NCT ID",
    dataIndex: "nct_id",
    ellipsis: true,
    render: (text) => <span className="nctid">{text || "-"}</span>,
  },
  {
    title: "Study Title",
    dataIndex: "brief_title",
    ellipsis: true,
  },
  {
    title: "Sponsor",
    dataIndex: "sponsor",
    ellipsis: true,
  },
  {
    title: "Status",
    dataIndex: "study_status",
    ellipsis: true,
  },
  {
    title: "Phase",
    dataIndex: "study_phase",
    ellipsis: true,
  },
];

interface HistoricalProps {
  createTrial?: any;
  newTrial?: any;
  indicationList?: any;
  shouldFetch?: boolean;
  fetchHistory?: any;
  historyTrial?: any;
  handleNewTrialSelectChangeHistory?:any;
}
const min = 1990;
const max = 2025;
const marks = {
  1990: "1990",
  1995: "1995",
  2000: "2000",
  2005: "2005",
  2010: "2010",
  2015: "2015",
  2020: "2020",
  2025: "2025",
};

const sponsorChartColor = [
  // "#d04a02",
  // "#d4520d",
  // "#d85d1c",
  // "#de6c30",
  // "#e47d47",
  // "#e68d5e",
  // "#e8aa89",
  "#F53500",
  "#E94700",
  "#EC5100",
  "#EE5B00",
  "#F06300",
  "#F27A26",
  "#F5924D",
  "#F8B180",
  "#FBD0B3",
  "#FDECE0",
];
const statusChartColor = [
  "#F53500",
  "#E94700",
  "#EC5100",
  "#EE5B00",
  "#F06300",
  "#F27A26",
  "#F5924D",
  "#F8B180",
  "#FBD0B3",
  "#FDECE0",
];

class SimilarHistoricalTrial extends React.Component<HistoricalProps> {
  constructor(props: HistoricalProps) {
    super(props);
    this.onFindTrials = this.onFindTrials.bind(this);
  }

  state = {
    current: 1,
    pageSize: 5,
    pageSizeOptions: ["5", "10", "20", "50", "100"],
    sideBar: 5,
    showFilter: true,
    studyType: this.props.newTrial.study_type || [],
    studyPhase: this.props.newTrial.study_phase || [],
    studyStatus: [],
    indication:
      this.props.newTrial.indication.length === 0
        ? this.props.indicationList
        : this.props.newTrial.indication,
    pediatric: this.props.newTrial.pediatric_study || "",
    dateFrom: 1990,
    dateTo: 2025,
    selectedRowKeys: this.props.newTrial.similarHistoricalTrials,
    spinning: false,
    data: [],
    rawData: this.props.historyTrial.historyData,
    statusChartData: [],
    sponsorChartData: [],
    optionOne: {},
    optionTwo: {},
    showStatusChart: true,
  };
  componentDidMount() {
    this.props.historyTrial.shouldFetch && this.getHistoryList();
    !this.props.historyTrial.shouldFetch &&
      this.onFindTrials(this.state.rawData);
  }

  getChartData(datasource, key) {
    let keyValues = [];
    datasource.forEach((e) => {
      keyValues.push(e[key]);
    });
    keyValues = Array.from(new Set(keyValues));
    const pieChartData = [];
    keyValues.forEach((v) => {
      const values = datasource.filter(
        (d) => d[key].toLowerCase() == v.toLowerCase()
      );
      pieChartData.push({
        value: values.length,
        name: v,
      });
    });
    return pieChartData;
  }

  getHistoryList = async () => {
    this.setState({
      spinning: true,
    });
    const resp = await listStudy();
    this.setState({
      spinning: false,
    });

    if (resp.statusCode == 200) {
      console.log("history list-----", JSON.parse(resp.body));
      const tmpData = JSON.parse(resp.body).map((d, idx) => {
        d.key = d["nct_id"];
        d.sponsor = d.sponsor || "";
        d.study_status = d.study_status || "";
        return d;
      });
      this.onFindTrials(tmpData);
      this.setState({
        rawData: tmpData,
      });
      this.props.fetchHistory({
        historyData: tmpData,
        shouldFetch: false,
      });
    }
  };

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

  onSelectChange = (key, v) => {
    this.setState({
      [key]: v,
    });
    key==="studyPhase"&&this.props.handleNewTrialSelectChangeHistory("study_phase", v)
    key==="studyType"&&this.props.handleNewTrialSelectChangeHistory("study_type", v)
    key==="pediatric"&&this.props.handleNewTrialSelectChangeHistory("pediatric_study", v)
    key==="studyStatus"&&this.props.handleNewTrialSelectChangeHistory("study_status", v)
  };

  handleLegendFormatter = (chartData, legenName) => {
    const sum = chartData.reduce((accumulator, currentValue) => {
      return accumulator + currentValue.value;
    }, 0);
    const targetVal = chartData.find((d) => d.name == legenName).value;
    let p = ((targetVal / sum) * 100).toFixed(2);
    return legenName + " - " + p + "%";
  };

  onFindTrials = (datasource) => {
    let tempIndication =
      this.state.indication.length > 0 ? [...this.state.indication] : [];
    const filteredData = datasource.filter((d) => {
      const date = d["start_date"].split("-")[0];      
      return (
        (this.state.studyPhase.indexOf("All") == -1 && this.state.studyPhase.length > 0
          ? this.state.studyPhase.indexOf(d.study_phase) > -1
          : true) &&
        ( this.state.studyType.indexOf("All") == -1 && this.state.studyType.length > 0
          ? this.state.studyType.indexOf(d.study_type) > -1
          : true) &&
        ( this.state.studyStatus.indexOf("All") == -1 && this.state.studyStatus.length > 0
          ? this.state.studyStatus.indexOf(d["study_status"]) > -1
          : true) &&
        (tempIndication.length > 0
          ? tempIndication.indexOf(d.indication) > -1
          : true) &&
        (this.state.pediatric != "" && this.state.pediatric != "All"
          ? d.pediatric+'' == this.state.pediatric
          : true) &&
        date >= this.state.dateFrom &&
        date <= this.state.dateTo
      );
    });    
    const statusData = this.getChartData(filteredData, "study_status");
    const sponsorData = this.getChartData(filteredData, "sponsor");
    this.setState({
      data: filteredData,
      statusChartData: statusData,
      sponsorChartData: sponsorData,
    });

    if (this.state.studyStatus && this.state.studyStatus.indexOf("All") > -1) {
      this.setState({
        showStatusChart: false,
      });
    } else {
      this.setState({
        showStatusChart: true,
      });
    }
  };

  getOptionOne() {
    const optionOne = {
      title: {
        text: "By Sponsor",
        x: "5%",
        y: "top",
        textStyle: {
          fontSize: 14,
        },
      },
      tooltip: {
        trigger: "item",
        formatter: function (params,idx) {
          const chartData = optionOne.legend.data
          const sum = chartData.reduce((accumulator, currentValue) => {
            return accumulator + currentValue.value
          }, 0)
          let p = ((params.value / sum) * 100).toFixed(2);
          return params.name + " - " + p + "%";
        },
        position: ['5%', '10%'],
        textStyle:{
          fontSize: 12,
        },
        confine:false,
      },
      legend: {
        show:false,
        data: this.state.sponsorChartData
      //   x: "left",
      //   y: "60%",
      //   itemHeight: 7,
      //   textStyle: {
      //     fontSize: 8,
      //   },
      //   formatter: function (params) {
      //     const chartData = optionOne.series[0].data
      //     const sum = chartData.reduce((accumulator, currentValue) => {
      //      return accumulator + currentValue.value
      //     }, 0)
      //     const targetVal = chartData.find(d => d.name == params).value
      //     let p = ((targetVal / sum) * 100).toFixed(2);
      //     return params + " - " + p + "%";
      //   },
      },
      series: [
        {
          type: "pie",
          center: ["30%", "35%"],
          radius: ["20%", "40%"],
          avoidLabelOverlap: false,
          label: {
            show: false,
          },
          color: sponsorChartColor,
          data: this.state.sponsorChartData.sort((a, b) => {
            return b.value - a.value;
          })
          .slice(0, 10),
        },
      ],
    };
    return optionOne;
  }

  getOptionTwo() {
    const optionTwo = {
      title: {
        text: "By Status",
        x: "5%",
        y: "top",
        textStyle: {
          fontSize: 14,
          fontWeight: "bold",
        },
      },
      tooltip: {
        trigger: "item",
        formatter: function (params,idx) {
          const chartData = optionTwo.legend.data
              const sum = chartData.reduce((accumulator, currentValue) => {
               return accumulator + currentValue.value
              }, 0)
              let p = ((params.value / sum) * 100).toFixed(2);
              return params.name + " - " + p + "%";
        },
        position: ['5%', '10%'],
        textStyle:{
          fontSize: 12,
        },
        confine:false,
      },
      legend: {
        show:false,
        data: this.state.statusChartData
      //   x: "left",
      //   y: "60%",
      //   itemHeight: 7,
      //   textStyle: {
      //     fontSize: 8,
      //   },
      //   formatter: function (params,idx) {
      //     const chartData = optionTwo.series[0].data
      //     const sum = chartData.reduce((accumulator, currentValue) => {
      //      return accumulator + currentValue.value
      //     }, 0)
      //     const targetVal = chartData.find(d => d.name == params).value
      //     let p = ((targetVal / sum) * 100).toFixed(2);
      //     return params + " - " + p + "%";
      //   },
      },
      series: [
        {
          type: "pie",
          center: ["30%", "35%"],
          radius: ["20%", "40%"],
          avoidLabelOverlap: false,
          label: {
            show: false,
          },
          color: statusChartColor,
          data: this.state.statusChartData.sort((a, b) => {
            return b.value - a.value;
          })
          .slice(0, 10),
        },
      ],
    };
    return optionTwo;
  }

  onRowSelectChange = (selectedRowKeys) => {
    this.setState({ selectedRowKeys });
    this.props.createTrial({
      similarHistoricalTrials: selectedRowKeys,
    });
  };
  handleDateChange = (value) => {
    this.setState({
      dateFrom: value[0],
      dateTo: value[1],
    });
  };

  render() {
    const rowSelection = {
      selectedRowKeys: this.state.selectedRowKeys,
      onChange: this.onRowSelectChange,
      selections: [
        Table.SELECTION_ALL,
        {
          key: 'current_page',
          text: 'Select current page',
          onSelect: this.onRowSelectChange
        },
        // {
        //   key: 'current_page2',
        //   text: 'Select all in current page',
        //   onSelect: changableRowKeys => {
        //     let newSelectedRowKeys = [];
        //     newSelectedRowKeys = changableRowKeys.filter((key, index) => {
        //       if (index % 2 !== 0) {
        //         return false;
        //       }
        //       return true;
        //     });
        //     this.setState({ selectedRowKeys: newSelectedRowKeys });
        //   },
        // },
        Table.SELECTION_NONE,
      ],
    };
    return (
      <div className="historical-trial-list">
        <Row>
          <Col span={this.state.sideBar} className="side-bar">
            <div className="filter-item filter-label">
              <span>Filters</span>
            </div>
            <div className="filter-item">
              <label>STUDY PHASE</label>
              <Select
                mode="multiple"
                allowClear
                value={this.state.studyPhase || ["All"]}
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
                mode="multiple"
                allowClear
                value={this.state.studyType || ["All"]}
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
                mode="multiple"
                allowClear
                value={this.state.studyStatus || ["All"]}
                style={{ width: "100%" }}
                onChange={(e) => this.onSelectChange("studyStatus", e)}
              >
                <Option value="All" key="All">
                  All
                </Option>
                {study_status.sort().map((o) => {
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
                mode="multiple"
                allowClear
                value={this.state.indication}
                style={{ width: "100%" }}
                onChange={(e) => this.onSelectChange("indication", e)}
              >
                {this.props.indicationList.map((o) => {
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
                value={this.state.pediatric || "All"}
                style={{ width: "100%" }}
                onChange={(e) => this.onSelectChange("pediatric", e)}
              >
                {/* {["All", "YES", "NO"].map((o) => {
                  return (
                    <Option value={o} key={o}>
                      {o}
                    </Option>
                  );
                })} */}
                 <Option value="All" key="All">All</Option> 
                 <Option value="true" key="true">YES</Option> 
                 <Option value="false" key="false">NO</Option>
              </Select>
            </div>
            <div className="filter-item">
              <label>STUDY START DATE</label>
              <Slider
                step={null}
                min={min}
                max={max}
                range={{ draggableTrack: true }}
                marks={marks}
                dots
                value={[this.state.dateFrom, this.state.dateTo]}
                onChange={this.handleDateChange}
              />
            </div>
            <div className="filter-item find-trial-btn-wrapper">
              <Button onClick={() => this.onFindTrials(this.state.rawData)}>
                Find Trials
              </Button>
            </div>
          </Col>

          <Col span={24 - this.state.sideBar} className="historical-desc">
            <Spin spinning={this.state.spinning}>
              <div className="title">Similar Historical Trials</div>
              <div className="title-desc">
                Refine the list of similar historical trials that you will use
                to design your trial.
              </div>
              <div className="summary-count">
                {this.state.data && this.state.data.length}
                <span className="num-desc">&nbsp;Total Number of Trials</span>
              </div>
              <div className="chart-wrapper">
                <div className="chart">
                  <div className="my-echart-wrapper">
                    <ReactECharts option={this.getOptionOne()}></ReactECharts>
                  </div>
                  <div className="my-legend-wrapper">
                    {this.state.sponsorChartData
                      .sort((a, b) => {
                        return b.value - a.value;
                      })
                      .slice(0, 5)
                      .map((d, idx) => {
                        const chartData = this.state.sponsorChartData;
                        const sum = chartData.reduce(
                          (accumulator, currentValue) => {
                            return accumulator + currentValue.value;
                          },
                          0
                        );
                        let percent = ((d.value / sum) * 100).toFixed(2);
                        return (
                          <div className="custom-legend">
                            <span
                              className="my_legend"
                              style={{
                                backgroundColor: sponsorChartColor[idx],
                              }}
                            ></span>
                            <i className="my_legend_text">{`${d.name} - ${percent}%`}</i>
                          </div>
                        );
                      })}
                  </div>
                </div>
                <div className="chart">
                  {this.state.showStatusChart ? (
                    <>
                      <div className="my-echart-wrapper">
                        <ReactECharts option={this.getOptionTwo()}></ReactECharts>
                      </div>
                      <div className="my-legend-wrapper">
                        {this.state.statusChartData
                          .sort((a, b) => {
                            return b.value - a.value;
                          })
                          .slice(0, 5)
                          .map((d, idx) => {
                            const chartData = this.state.statusChartData;
                            const sum = chartData.reduce(
                              (accumulator, currentValue) => {
                                return accumulator + currentValue.value;
                              },
                              0
                            );
                            let percent = ((d.value / sum) * 100).toFixed(2);
                            return (
                              <div className="custom-legend">
                                <span
                                  className="my_legend"
                                  style={{
                                    backgroundColor: statusChartColor[idx],
                                  }}
                                ></span>
                                <i className="my_legend_text">{`${d.name} - ${percent}%`}</i>
                              </div>
                            );
                          })}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
              <Row>
                <Table
                  columns={columns}
                  dataSource={this.state.data}
                  pagination={{
                    position: ["bottomRight"],
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} of ${this.state.data.length} items`,
                    // pageSize: this.state.pageSize,
                    pageSize: 5,
                    onChange: this.changePage,
                    current: this.state.current,
                    total: this.state.data.length,

                    // showSizeChanger: true,
                    // onShowSizeChange: this.onShowSizeChange,
                    // pageSizeOptions: this.state.pageSizeOptions
                  }}
                  // sticky
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
  fetchHistory: (val) => dispatch(historyActions.fetchHistory(val)),
});

const mapStateToProps = (state) => ({
  newTrial: state.trialReducer,
  historyTrial: state.historyReducer,
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SimilarHistoricalTrial);
