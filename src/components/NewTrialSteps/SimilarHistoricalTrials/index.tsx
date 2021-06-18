import React from 'react';
import { Table, Row, Col } from 'antd';
import { FilterOutlined} from "@ant-design/icons";
import CustomChart from "../../CustomChart";

import './index.scss';

const columns = [

  {
    title: 'Study Title',
    dataIndex: 'brief_title',
    ellipsis: true
  },
  {
    title: 'Company',
    dataIndex: '-',
    ellipsis: true,
    render: text => <span>-</span>
  },
  {
    title: 'Drug',
    dataIndex: 'indication',
    ellipsis: true
  },
  {
    title: 'Status',
    dataIndex: '-',
    ellipsis: true,
    render: text => <span>-</span>
  },
  {
    title: 'Phase',
    dataIndex: 'phase',
    ellipsis: true
  }
];

var data = [];

var chartData1 = [
  {value: 75, name: 'AstraZaeneca'},
  {value: 12, name: 'Pfizer'},
  {value: 8, name: 'Merck'},
  {value: 8, name: 'Boehringer Ingelheim'},
  {value: 75, name: 'Novo Nordisk'},
  {value: 12, name: 'Eli Lily'},
  {value: 8, name: 'Abbott'}
]

var chartData2 = [
  {value: 75, name: 'Completed'},
  {value: 25, name: 'Recruiting'}
]

export interface SelectableTableProps {
  dataList: any;
}

// const SimilarHistoricalTrial = () => {
class SimilarHistoricalTrial extends React.Component <SelectableTableProps>{    
    constructor(props : SelectableTableProps){
        super(props);
        console.log(props.dataList)
        data = props.dataList
    }

    state = {
      total: data.length,
      current: 1,
      pageSize: 5,
      pageSizeOptions: ['5', '10', '20', '50', '100'],
      sideBar: 2,
      showFilter: false
    };

    changePage = (page) => {
      this.setState({
        current: page
      })
    }

    onShowSizeChange = (current, pageSize) => {
      this.setState({
        current: current,
        pageSize: pageSize
      })
    }

    showFilter = () =>{
      console.log(this.state.showFilter)
      if(this.state.showFilter){
        this.setState({
          sideBar: 2,
          showFilter: false
        })
      } else {
        this.setState({
          sideBar: 4,
          showFilter: true
        })
      }
    }

    optionOne = {
      title : {
        text: 'By Sponsor',
        x:'left',
        y:'top',
        textStyle: {
          fontSize: 14
        }
      },
      legend: {
        x:'left',
        y:'50%',
        itemHeight: 7,
        textStyle: {
          fontSize: 8
        },
        formatter: function(name) {
          let tempData = chartData1;
          let total = 0;
          let tarValue = 0;
          for (let i = 0, l = tempData.length; i < l; i++) {
              total += tempData[i].value;
              if (tempData[i].name == name) {
                  tarValue = tempData[i].value;
              }
          }
          let p = (tarValue / total * 100).toFixed(2);
          return name + ' - ' + p + '%';
        },
        data: ['Abbott',
        'Eli Lily', 
        'Novo Nordisk',
        'Boehringer Ingelheim',
        'Merck',
        'Pfizer',
        'AstraZaeneca'
        ]
      },
      series: [{
        type: 'pie',
        center: ['20%', '30%'],
        radius: ['18%', '38%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
        },
        color: ['#d04a02', '#d4520d', '#d85d1c', '#de6c30', '#e47d47','#e68d5e','#e8aa89'],
        data: chartData1
      }]
    };

    optionTwo = {
      title : {
        text: 'By Status',
        x:'left',
        y:'top',
        textStyle: {
          fontSize: 14,
          fontWeight: 'bold'
        }
      },
      legend: {
        x:'left',
        y:'50%',
        itemHeight: 7,
        textStyle: {
          fontSize: 8
        },
        formatter: function(name) {
          let tempData = chartData2;
          let total = 0;
          let tarValue = 0;
          for (let i = 0, l = tempData.length; i < l; i++) {
              total += tempData[i].value;
              if (tempData[i].name == name) {
                  tarValue = tempData[i].value;
              }
          }
          let p = (tarValue / total * 100).toFixed(2);
          return name + ' - ' + p + '%';
        },
        data: ['Completed', 'Recruiting']
      },
      series: [{
        type: 'pie',
        center: ['40%', '30%'],
        radius: ['30%', '65%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
        },
        color:['#d04a02', '#ed7738'],
        data: chartData2
      }]
    };

  render() {
    return (
      <div className="historical-trial-list">
        <Row><Col span={24} style={{marginBottom: '10px'}}>
          <span className="step-desc">Refine the list of similar historical trials that you will use to design your trial.</span>
        </Col></Row>
        <Row>
        <Col span={this.state.sideBar} className="side-bar">
        <FilterOutlined onClick={this.showFilter} className="filter-icon"/>
        </Col>
        <Col span={24 - this.state.sideBar} className="historical-desc">
          <Row>
            <Col span={6} style={{borderRight: '1px solid #ddd'}}>
              <h4>{data.length}</h4><span className="num-desc">Total Number of Trials</span>
            </Col>
            <Col span={12}>
              <CustomChart option={this.optionOne} height={200}></CustomChart>
            </Col>
            <Col span={6}>
              <CustomChart option={this.optionTwo} height={200}></CustomChart>
            </Col>
          </Row>
          <Row>
        <Table  
        columns={columns} dataSource={data} 
        pagination={{ 
          position: ['bottomRight'],
          pageSize: this.state.pageSize, 
          onChange: this.changePage,
          current: this.state.current,
          total: data.length,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          showSizeChanger: true, 
          onShowSizeChange: this.onShowSizeChange,
          pageSizeOptions: this.state.pageSizeOptions
        }} sticky 
        // scroll={{y: 300}}
        />
        </Row>
        </Col>
        </Row>
      </div>
    );
  }
}

export default SimilarHistoricalTrial