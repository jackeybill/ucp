import React from 'react';
import { Table, Button } from 'antd';

const columns = [
  {
    title: 'Study Title',
    dataIndex: 'study_type',
  },
  {
    title: 'Company',
    dataIndex: 'country',
  },
  {
    title: 'Drug',
    dataIndex: 'study_type',
  },
  {
    title: 'Status',
    dataIndex: 'indication',
  },
  {
    title: 'Phase',
    dataIndex: 'phase',
  }
];

var data = [];

export interface SelectableTableProps {
  dataList: any;
}
 
export interface SvgComponentState {
  
}

class SelectableTable extends React.Component <SelectableTableProps>{
    
    constructor(props : SelectableTableProps){
        super(props);
        console.log(props.dataList)
        data = props.dataList
    }
    
  state = {
    selectedRowKeys: [], // Check here to configure the default column
    loading: false,
  };

  start = () => {
    this.setState({ loading: true });
    // ajax request after empty completing
    setTimeout(() => {
      this.setState({
        selectedRowKeys: [],
        loading: false,
      });
    }, 1000);
  };

  onSelectChange = selectedRowKeys => {
    console.log('selectedRowKeys changed: ', selectedRowKeys);
    this.setState({ selectedRowKeys });
  };

  render() {
    const { loading, selectedRowKeys } = this.state;
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange,
    };
    const hasSelected = selectedRowKeys.length > 0;
    return (
      <div id="selectedTable">
        {/* <div style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={this.start} disabled={!hasSelected} loading={loading}>
            Reload
          </Button>
          <span style={{ marginLeft: 8 }}>
            {hasSelected ? `Selected ${selectedRowKeys.length} items` : ''}
          </span>
        </div> */}
        <Table rowSelection={rowSelection} columns={columns} dataSource={data} 
        pagination={{pageSize: 5, showSizeChanger: true}}/>
      </div>
    );
  }
}

export default SelectableTable;