import React from 'react';
import { Table } from 'antd';

const columns = [
  {
    title: "NCT ID",
    dataIndex: "nct_id",
    ellipsis: true,
  },
  {
    title: 'Study Title',
    dataIndex: 'brief_title',
    ellipsis: true
  },
 {
    title: "Sponsor",
    dataIndex: "sponsor",
    ellipsis: true,
    render: (text) => <span>{text || "-"}</span>,
  },
  {
    title: 'Status',
    dataIndex: "study_status",
    ellipsis: true
  },
  {
    title: "Phase",
    dataIndex: "study_phase",
    ellipsis: true,
  },
];

export interface SelectableTableProps {
  dataList: any;
}
 
class SelectableTable extends React.Component <SelectableTableProps>{
  
    constructor(props : SelectableTableProps){
        super(props);
        console.log(props.dataList)
    }

    state = {
      data: [],
      total: 0,
      current: 1,
      pageSize: 5,
      pageSizeOptions: ['5', '10', '20', '50', '100']
    };

    componentWillReceiveProps(props) {
      this.setState({
        data: props.dataList,
        total: props.dataList.length
      })
    }

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

  render() {
    return (
      <>
        <Table 
        columns={columns} dataSource={this.state.data} 
        pagination={{ 
          position: ['bottomRight'],
          pageSize: this.state.pageSize, 
          onChange: this.changePage,
          current: this.state.current,
          total: this.state.total,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          showSizeChanger: true, 
          onShowSizeChange: this.onShowSizeChange,
          pageSizeOptions: this.state.pageSizeOptions
        }} sticky 
        // scroll={{y: 300}}
        />
      </>
    );
  }
}

export default SelectableTable;