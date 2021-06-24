import React from 'react';
import { Table } from 'antd';

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

export interface SelectableTableProps {
  dataList: any;
}
 
class SelectableTable extends React.Component <SelectableTableProps>{
    
    constructor(props : SelectableTableProps){
        super(props);
        console.log(props.dataList)
        data = props.dataList
    }

    state = {
      total: data.length,
      current: 1,
      pageSize: 5,
      pageSizeOptions: ['5', '10', '20', '50', '100']
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

  render() {
    return (
      <>
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
      </>
    );
  }
}

export default SelectableTable;