import React from "react";
import { Table, Row, Col, Select, Button, Spin, Slider, Tooltip } from "antd";
import { FilterOutlined } from "@ant-design/icons";
import CustomChart from "../../CustomChart";
import { phase_options, study_types,study_status } from "../../../pages/TrialPortfolio";
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
    render: (text) => <span>{text || "-"}</span>,
  },
  {
    title: "Status",
    dataIndex: "study_status",
    ellipsis: true,
    render: (text) => <span>{text || "-"}</span>,
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
  historyTrial?:any
}
const min = 1990;
const max = 2020;
const marks = {
  1990: "1990",
  1995: "1995",
  2000: "2000",
  2005: "2005",
  2010: "2010",
  2015: "2015",
  2020: "2020",
};


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
    studyType: this.props.newTrial.study_type||"",
    studyPhase: this.props.newTrial.study_phase||"",
    studyStatus: "",
    indication: this.props.newTrial.indication||[],
    pediatric: this.props.newTrial.pediatric_study||"",
    dateFrom: 1990,
    dateTo: 2020,
    selectedRowKeys: this.props.newTrial.similarHistoricalTrials,
    spinning: false,
    data: [],
    rawData: this.props.historyTrial.historyData,
    statusChartData: [],
    sponsorChartData: [],
    optionOne: {},
    optionTwo: {},
    showStatusChart:true
  };
  componentDidMount() {
    this.props.historyTrial.shouldFetch && this.getHistoryList();
    !this.props.historyTrial.shouldFetch && this.onFindTrials(this.state.rawData)
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
      console.log('history list-----',JSON.parse(resp.body))
      const tmpData = JSON.parse(resp.body).map((d, idx) => {  
        d.key = d["nct_id"];
        d.sponsor = d.sponsor || '';
        d.study_status = d.study_status || '';
        return d;
      })
      this.onFindTrials(tmpData)
      this.setState({
        rawData: tmpData,
      });
      this.props.fetchHistory({
        historyData: tmpData,
        shouldFetch:false
      })
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

  handleLegendFormatter = (chartData, legenName) => {  
    const sum = chartData.reduce((accumulator, currentValue) => {
      return accumulator + currentValue.value
    }, 0)
    const targetVal = chartData.find(d => d.name == legenName).value
    let p = ((targetVal / sum) * 100).toFixed(2);
    return legenName + " - " + p + "%";  
  }

  onFindTrials = (datasource) => {

    const filteredData = datasource.filter((d) => {
      const date = d['start_date'].split('-')[0]
      return (
        (this.state.studyPhase != "" && this.state.studyPhase != "All"
          ? d.study_phase.indexof(this.state.studyPhase)>-1
          : true) &&
        (this.state.studyType != "" && this.state.studyType != "All"
          ? d.study_type == this.state.studyType
          : true) &&
        (this.state.studyStatus != "" && this.state.studyStatus != "All"
          ? d['study_status'] == this.state.studyStatus
          : true) &&
        (this.state.indication.length != "" && this.state.indication != "All"
          ? d.indication == this.state.indication
          : true) &&
        (this.state.pediatric != "" && this.state.pediatric != "All"
          ? d.pediatric == this.state.pediatric
          : true) &&  
        date>=this.state.dateFrom && date<=this.state.dateTo
      );
    });
    const statusData = this.getChartData(filteredData, "study_status");
    const sponsorData = this.getChartData(filteredData, "sponsor");
    this.setState({
      data: filteredData,
      statusChartData: statusData,
      sponsorChartData: sponsorData,
    });

    if (this.state.studyStatus != "" && this.state.studyStatus != "All") {
      this.setState({
        showStatusChart:false
      })
    } else {
      this.setState({
        showStatusChart:true
      })
    }
  };

  getOptionOne() {
    const optionOne = {
      title: {
        text: "By Sponsor",
        x: "left",
        y: "top",
        textStyle: {
          fontSize: 14,
        },
      },
      tooltip: {
        trigger: "item",
        formatter: function (params) {
          return (
            [params.name] +
            "-" +
            [params.value] 
          );
        },
      },
      legend: {
        x: "left",
        y: "60%",
        itemHeight: 7,
        textStyle: {
          fontSize: 8,
        },
        formatter: function (params) {
          const chartData = optionOne.series[0].data      
          const sum = chartData.reduce((accumulator, currentValue) => {
           return accumulator + currentValue.value
          }, 0)
          const targetVal = chartData.find(d => d.name == params).value
          let p = ((targetVal / sum) * 100).toFixed(2);
          return params + " - " + p + "%";
        },
      },
      series: [
        {
          type: "pie",
          center: ["30%", "35%"],
          radius: ["20%", "50%"],
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
          data: this.state.sponsorChartData,
        },
      ],
    };
    return optionOne;
  }

  getOptionTwo() {
    const optionTwo = {
      title: {
        text: "By Status",
        x: "left",
        y: "top",
        textStyle: {
          fontSize: 14,
          fontWeight: "bold",
        },
      },
      tooltip: {
        trigger: "item",
        formatter: function (params) {
          return (
            [params.name] +
            "-" +
            [params.value]
          );
        },
      },
      legend: {
        x: "left",
        y: "60%",
        itemHeight: 7,
        textStyle: {
          fontSize: 8,
        },
        formatter: function (params) {
          const chartData = optionTwo.series[0].data      
          const sum = chartData.reduce((accumulator, currentValue) => {
           return accumulator + currentValue.value
          }, 0)
          const targetVal = chartData.find(d => d.name == params).value
          let p = ((targetVal / sum) * 100).toFixed(2);
          return params + " - " + p + "%";
        },
      },
      series: [
        {
          type: "pie",
           center: ["30%", "35%"],
          radius: ["20%", "50%"],
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
            "#e8aa89"],
          data: this.state.statusChartData,
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
    console.log(this.state.sponsorChartData, this.state.statusChartData)
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
                     <Option value="All" key="All">All</Option>
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
                    <Option value="All" key="all">
                      All
                    </Option>
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
                    value={this.state.pediatric}
                    style={{ width: "100%" }}
                    onChange={(e) => this.onSelectChange("pediatric", e)}
                  >
                    {["All", "YES", "NO"].map((o) => {
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
                <div>
                  <Button type="primary" onClick={()=>this.onFindTrials(this.state.rawData)}>
                    Find Trials
                  </Button>
                </div>
              </>
            ) : null}
          </Col>

          <Col span={24 - this.state.sideBar} className="historical-desc">
            <Spin spinning={this.state.spinning} >
              <div className="chart-wrapper">
                <div className="summary-count">
                  <h4>{this.state.data && this.state.data.length}</h4>
                  <span className="num-desc">Total Number of Trials</span>
                </div>
                <div className="chart">
                  <ReactECharts option={this.getOptionOne()}></ReactECharts>          
                </div>
                <div className="chart">
                    {this.state.showStatusChart?<ReactECharts option={this.getOptionTwo()}></ReactECharts>:null}     
                </div>
              </div>
              {/* <Row>
                <Col span={6} style={{ borderRight: "1px solid #ddd" }}>
                  <h4>{this.state.data && this.state.data.length}</h4>
                  <span className="num-desc">Total Number of Trials</span>
                </Col>
                <Col span={12}>
                      
                </Col>
                <Col span={6}>
                  {this.state.showStatusChart?<ReactECharts option={this.getOptionTwo()}></ReactECharts>:null}               
                </Col>
              </Row> */}
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
  fetchHistory:(val) => dispatch(historyActions.fetchHistory(val)),
});

const mapStateToProps = (state) => ({
  newTrial: state.trialReducer,
  historyTrial:state.historyReducer,
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SimilarHistoricalTrial);
