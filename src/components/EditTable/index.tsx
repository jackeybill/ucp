import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import 'antd/dist/antd.css';
import './index.scss';
import { Table, Input, InputNumber, Popconfirm, Form, Typography, Button, Popover, Modal } from 'antd';
import {MoreOutlined, CheckOutlined, CloseOutlined} from "@ant-design/icons";

const { TextArea } = Input;

const EditableCell = ({editing, dataIndex, title, inputType, record, index, children, ...restProps }) => {
  const inputNode = inputType === 'number' ? <InputNumber /> : <Input />;
  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item name={dataIndex} style={{margin: 0}}
          rules={[ { required: true, message: `Please Input ${title}!` } ]} >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

const EditTable = (props) => {
  const [form] = Form.useForm();
  const [data, setData] = useState(props.data);
  const [editingKey, setEditingKey] = useState('');
  const [conOrExcpKey, setConOrExcpKey] = useState('');
  const [conOrExp, setConOrExp] = useState('');
  const [visible, setVisible] = useState(false);

  const isEditing = (record) => record['Eligibility Criteria'] === editingKey;

  const edit = (record) => {
    form.setFieldsValue({
      "Eligibility Criteria": '',
      Values: '',
      Timeframe: '',
      ...record,
    });
    setEditingKey(record['Eligibility Criteria']);
  };

  const cancel = () => {
    setEditingKey('');
  };

  const save = async (key) => {
    try {
      const row = await form.validateFields();
      const newData = [...data];
      const index = newData.findIndex((item) => key === item['Eligibility Criteria']);

      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, { ...item, ...row });
        setData(newData);
        setEditingKey('');

        props.updateIclusionCriteria(newData, props.tableIndex)
      } else {
        newData.push(row);
        setData(newData);
        setEditingKey('');
        props.updateIclusionCriteria(newData, props.tableIndex)
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
    }
  };

  // const handleAdd = () => {
  //   const newData = {
  //     key: mergedColumns.length,
  //     "Eligibility Criteria": ``,
  //     Values: '',
  //     Timeframe: ``,
  //   }
  //   setData([...data, newData])
  //   edit(newData)
  // };

  const columns = [{
      title: "Eligibility Criteria",
      dataIndex: "Eligibility Criteria",
      width: '25%',
      editable: true,
    }, {
      title: 'Values',
      dataIndex: 'Values',
      width: '25%',
      editable: true,
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
            <Input value={record["Values"]}/>
        ) : (
          <Typography.Link disabled={editingKey !== ''} onClick={() => edit(record)}>
            <div><span>{record.Values}</span></div>
          </Typography.Link>
        );
      }
    }, {
      title: 'Timeframe',
      dataIndex: 'Timeframe',
      width: '40%',
      editable: true
    }, {
      title: 'operation',
      dataIndex: 'operation',
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <span style={{float:'right'}}>
            <CheckOutlined onClick={() => save(record['Eligibility Criteria'])}/> &nbsp;&nbsp;
            <CloseOutlined onClick={cancel}/>
          </span>
        ) : (
          <Popover content={<div style={{display:'grid'}}>
                      <span>Add sub-criteria</span>
                      <span className="popover-action" onClick={() => editConditionOrException(record)}>Add condition or exception</span>
                      <span>delet</span>
                    </div>} 
                title={false} placement="bottomRight">
            <MoreOutlined style={{float:'right'}}/>
          </Popover>
        );
      }
    }
  ];

  const editConditionOrException = (record) =>{
    console.log('addSubCriteria for '+record['Eligibility Criteria'])
    setConOrExcpKey(record['Eligibility Criteria'])
    setConOrExp(record['Condition Or Exception'])
    setVisible(true)
  }

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }

    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      })
    };
  });

  const handleInputChange = (e) =>{
    setConOrExp(e.target.value)
  }

  const handleOk = async () => {
    setVisible(false)

    const newData = [...data]
    const index = newData.findIndex((item) => conOrExcpKey === item['Eligibility Criteria'])

    if(index > -1){
      const oldItem = newData[index];
      const newItem = newData[index];
      newItem['Condition Or Exception'] = conOrExp

      newData.splice(index, 1, { ...oldItem, ...newItem });
      setData(newData)
      setConOrExp(null)
    }
    
    props.updateIclusionCriteria(newData, props.tableIndex)
  }
  const handleCancel = () =>{
    setVisible(false)
    setConOrExp(null)
  }

  return (
    <Form form={form} component={false}>
      {/* <Button onClick={handleAdd} type="primary" style={{ marginBottom: 16 }}>
          Add a row
        </Button> */}
      <Table pagination={false} showHeader={false} rowKey={record => record["Eligibility Criteria"]}
        components={{ body: { cell: EditableCell } }} locale={{emptyText: 'No Data'}}
        dataSource={data} columns={mergedColumns} rowClassName="editable-row" />

        <Modal visible={visible} title="Add Condition or Exception" onOk={handleOk} onCancel={handleCancel}
          footer={[<Button key="submit" type="primary" onClick={handleOk}>Submit</Button>]}>
          <p>Add condition or exception for <b>{conOrExcpKey}</b></p>
          <p>Condition or Exception</p>
          <TextArea value={conOrExp} onChange={(e) => handleInputChange(e)} autoSize={{ minRows: 3, maxRows: 5 }}/>
        </Modal>
    </Form>
  );
};

export default EditTable;