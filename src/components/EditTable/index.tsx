import React, { useState, useEffect, useReducer} from 'react';
import 'antd/dist/antd.css';
import './index.scss';
import { Table, Input, InputNumber, Popconfirm, Form, Typography, Button, Popover, Modal, Collapse} from 'antd';
import {MoreOutlined, CheckOutlined, CloseOutlined, PlusCircleOutlined, CaretRightOutlined} from "@ant-design/icons";

const { TextArea } = Input;
const { Panel } = Collapse;

const EditableCell = ({ editing, dataIndex, title, inputType, record, index, children, ...restProps }) => {
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

const chars = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']
  
const initialEditable = {}
const EditTable = (props) => {
  
  const [form] = Form.useForm();
  const [data, setData] = useState([]);
  const [editingKey, setEditingKey] = useState('');
  const [conOrExcpKey, setConOrExcpKey] = useState();
  const [conOrExcpContent, setConOrExcpContent] = useState();
  const [conOrExp, setConOrExp] = useState('');
  const [visible, setVisible] = useState(false);
  const [editable, setEditable] = useReducer(
        (state, newState) => ({ ...state, ...newState }),
        { ...initialEditable }
  );
  useEffect(() => {
    setData(props.data)
  },[props.data])
 

  const handleSubCriteraInputChange = (key, e, record?, idx?, header?) => {
   
    let tmpData = data.slice(0)
    const targetRecord = tmpData.find(e=> e.Key==record.Key)
    targetRecord.Children[idx][key]=e.target.value
    setData(tmpData)
    
  }

  const isEditing = (record) => record.Key == editingKey;

  const edit = (record) => {
    form.setFieldsValue({
      "Eligibility Criteria": '',
      Values: '',
      Timeframe: '',
      ...record,
    });
    setEditingKey(record.Key);
  };

  const cancel = () => {
    setEditingKey('');
  };

  const save = async (key) => {
    try {
      const row = await form.validateFields();
     
      const newData = [...data];
      const index = newData.findIndex((item) => key === item.Key);

      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, { ...item, ...row });
        setData(newData);
        setEditingKey('');

        props.updateCriteria(newData, props.tableIndex)
      } else {
        newData.push(row);
        setData(newData);
        setEditingKey('');
        props.updateCriteria(newData, props.tableIndex)
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
    }
  };

  const handleAdd = () => {
    const newData = {
      Key: (data.length + 1) + '',
      "Eligibility Criteria": '',
      Values: '',
      Timeframe: '',
    }
    setData([...data, newData])
    edit(newData)
  };

  const handleDelete = async (record) => {
      const newData = [...data];
      const index = newData.indexOf(record);

      if (index > -1) {
        newData.splice(index, 1);
        const tempData = newData.map((item, id) =>{
          item.Key = (id + 1) + ''
          return item
        })
        setData(tempData);

        props.updateCriteria(newData, props.tableIndex)
      }
  };

  const handleAddSubCriteria = (record) => {
    const tmpData = data.slice(0)
    const targetRecord = tmpData.find(e=> e.Key==record.Key)
   
    if (!targetRecord.Children) {
      targetRecord.Children = [
      {
        "Key": "A",
        "Eligibility Criteria": "",
        "Timeframe": "",
        "Values": "",
      }
    ]
    setEditable({
    0:true
  })
  } 
    else {
      targetRecord.Children.push(
        {
          "Key": chars[targetRecord.Children.length],
          "Eligibility Criteria": "",
          "Timeframe": "",
          "Values": "",
        }
      )
       setEditable({
    [targetRecord.Children.length-1]:true
  })
  }
    setData(tmpData)
  }
  const deleteSubCriteria = (record, idx) => {
   
   
    const tmpData = data.slice(0)
    const targetRecord = tmpData.find(e=> e.Key==record.Key)
    targetRecord.Children.splice(idx, 1)
    targetRecord.Children = targetRecord.Children.map((item,index) =>{
      item.Key = chars[index]
      return item
    })

    setData(tmpData)
    
  }
  const saveSubCriteria = (record,subRecord,idx) => {
    setEditable({
      [idx]:false
    })
    const tmpData = data.slice(0)
    const targetRecord = tmpData.find(e=> e.Key==record.Key)
    targetRecord.Children[idx]= subRecord
    setData(tmpData)
    
  } 

  function callback(key) {
  }

const panelHeaderSection = (header, count) => {
  return (
      <div className="trial-panelHeader">
          <div>
              <div className="header-section"><span>{header}({count == 0? 0:count})</span>
              <PlusCircleOutlined className="right-icon" onClick={handleAdd}/></div>
          </div>
      </div>
  );
};

  const columns = [
    {
      title: "Key",
      dataIndex: "Key",
      width: '7%',
      editable: false,
    },
    {
      title: "Eligibility Criteria",
      dataIndex: "Eligibility Criteria",
      width: '28%',
      editable: true,
    }, {
      title: 'Values',
      dataIndex: 'Values',
      width: '28%',
      editable: true,
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
            <Input value={record["Values"]}/>
        ) : (
          <Typography.Link disabled={editingKey !== ''} onClick={() => edit(record)}>
            <div><span style={{fontSize: '14px'}}>{record.Values}</span></div>
          </Typography.Link>
        );
      }
    }, {
      title: 'Timeframe',
      dataIndex: 'Timeframe',
      width: '25%',
      editable: true
    }, {
      title: 'operation',
      dataIndex: 'operation',
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <span style={{float:'right'}}>
            <CheckOutlined onClick={() => save(record.Key)}/> &nbsp;&nbsp;
            <CloseOutlined onClick={cancel}/>
          </span>
        ) : (
          <Popover content={<div style={{display:'grid'}}>
                      <span className="popover-action" onClick={() => handleAddSubCriteria(record)}>Add sub-criteria</span>
                      <span className="popover-action" onClick={() => editConditionOrException(record)}>Add condition or exception</span>
                      <span className="popover-action" onClick={() => handleDelete(record)}>Delete</span>
                    </div>} 
                title={false} placement="bottomRight">
            <MoreOutlined style={{float:'right'}}/>
          </Popover>
        );
      }
    }
  ];

  const editConditionOrException = (record) => {
    setConOrExcpContent(record['Eligibility Criteria'])
    setConOrExcpKey(record.Key)
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
    const index = newData.findIndex((item) => conOrExcpKey === item.Key)

    if(index > -1){
      const oldItem = newData[index];
      const newItem = newData[index];
      newItem['Condition Or Exception'] = conOrExp

      newData.splice(index, 1, { ...oldItem, ...newItem });
      setData(newData)
      setConOrExp(null)
    }
    
    props.updateCriteria(newData, props.tableIndex)
  }
  const handleCancel = () =>{
    setVisible(false)
    setConOrExp(null)
  }
  return (
    <Form form={form} component={false}>
      <Collapse activeKey={props.defaultActiveKey} onChange={callback} expandIconPosition="left"
          expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}>
          <Panel header={panelHeaderSection(props.panelHeader, props.collapsible ? 0 : data.length)} 
            key={props.tableIndex} forceRender={false}>
      <Table pagination={false} showHeader={false} rowKey={record => record.Key}
        components={{ body: { cell: EditableCell } }} locale={{emptyText: 'No Data'}}
            dataSource={data} columns={mergedColumns} rowClassName="editable-row"
             expandable={{
               expandedRowRender: record => {
                 return (
                   <>
                     {
                       record.Children && record.Children.length > 0 && record.Children.map((subRecord,idx) => {
                         return(
                           <div className="sub-criteria-wrapper" key={idx}>
                             <div className="serial-number">
                              <span>{subRecord.Key}</span>
                             </div>
                             {editable[idx] ? (
                               <>
                                <Input value={subRecord['Eligibility Criteria']} onChange={ (e)=>handleSubCriteraInputChange('Eligibility Criteria',e,record,idx,props.header)}/>
                                <Input value={subRecord['Timeframe']} onChange={(e) => handleSubCriteraInputChange('Timeframe', e, record, idx, props.header)} />
                                <Input value={subRecord['Values']} onChange={ (e)=>handleSubCriteraInputChange('Values',e,record,idx,props.header)} />
                               </>                            
                             ) 
                              : (
                                <>
                                  <div className="sub-row-non-editable" onClick={()=>setEditable({[idx]:true})} >{subRecord['Eligibility Criteria']}</div>
                                  <div className="sub-row-non-editable" onClick={()=>setEditable({[idx]:true})}>{subRecord['Timeframe']}</div>
                                  <div className="sub-row-non-editable" onClick={()=>setEditable({[idx]:true})}>{subRecord['Values']}</div>
                              </>
                              )}                      
                             <div className="actions">
                              {editable[idx]&& <CheckOutlined style={{ color: 'green' }} onClick={()=>saveSubCriteria(record, subRecord,idx)}/>}
                              <CloseOutlined style={{ color: 'red' }} onClick={() =>deleteSubCriteria(record, idx)}/>
                            </div>                 
                        </div>
                         )                       
                       })                   
                     }                 
                   </>               
                 ) 
                },
      rowExpandable: record => record.Children,
    }}
          />
      </Panel>
      </Collapse>
        <Modal visible={visible} title="Add Condition or Exception" onOk={handleOk} onCancel={handleCancel}
          footer={[<Button key="submit" type="primary" onClick={handleOk}>Submit</Button>]}>
          <p>Add condition or exception for <b>{conOrExcpContent}</b></p>
          <p>Condition or Exception</p>
          <TextArea value={conOrExp} onChange={(e) => handleInputChange(e)} autoSize={{ minRows: 3, maxRows: 5 }}/>
        </Modal>
    </Form>
  );
};

export default EditTable;