import React, { useState, useEffect, useReducer} from 'react';
import ReactDOM from 'react-dom';
import 'antd/dist/antd.css';
import './index.scss';
import { Table, Input, InputNumber, Popconfirm, Form, Typography, Button, Popover, Modal, Collapse} from 'antd';
import {MoreOutlined, CheckOutlined, CloseOutlined, PlusCircleOutlined, CaretRightOutlined} from "@ant-design/icons";
import { divide } from 'lodash';

const { TextArea } = Input;
const { Panel } = Collapse;

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

const initialStates = {
  "Eligibility Criteria": "",
  "Timeframe": "",
  "Values": "",
}

 const data1 = [
    {
      "Eligibility Criteria": "pregnancy test",
      "Timeframe": "-",
      "Values": "-",
    },
    {
      "Eligibility Criteria": "ANC",
      "Timeframe": "-",
      "Values": "-",
    },
    {
      "Eligibility Criteria": "contraception",
      "Timeframe": "-",
      "Values": "-",
    },
    {
      "Eligibility Criteria": "tubal ligation",
      "Timeframe": "-",
      "Values": "-",
      "Children": [
        {
          "Eligibility Criteria": "child1",
          "Timeframe": "c-1",
          "Values": "c-1",
        },
        {
          "Eligibility Criteria": "child2",
          "Timeframe": "c-2",
          "Values": "c-2",
        }
      ]
    },

 ]
  
const initialEditable = {}
const EditTable = (props) => {
  // console.log(props.data)
  const [form] = Form.useForm();
  const [data, setData] = useState(props.data);
  // const [data, setData] = useState(data1);
  const [editingKey, setEditingKey] = useState('');
  const [conOrExcpKey, setConOrExcpKey] = useState('');
  const [conOrExp, setConOrExp] = useState('');
  const [visible, setVisible] = useState(false);
  const [editable, setEditable] = useReducer(
        (state, newState) => ({ ...state, ...newState }),
        { ...initialEditable }
    );
  // const [subCriteria, setSubCriteria] =  useReducer(
  //       (state, newState) => ({ ...state, ...newState }),
  //       { ...initialStates }
  //   );
 

  const handleSubCriteraInputChange = (key, e, record?, idx?, header?) => {
    
    // setSubCriteria({
    //   [key]:e.target.value
    // })
debugger
   
    let tmpData = data.slice(0)
    const targetRecord = tmpData.find(e=> e['Eligibility Criteria']==record['Eligibility Criteria']&&e['Values']==record['Values']&&e['Timeframe']==record['Timeframe'])
    // console.log('------target----', targetRecord)
    targetRecord.Children[idx][key]=e.target.value
    // targetRecord[idx] = Object.assign(targetRecord[idx],{[key]:e.target.value})
    // const targetSubRecordIndex = targetRecord.Children.findIndex(e => e['Eligibility Criteria'] == subRecord['Eligibility Criteria'] && e['Values'] == subRecord['Values'] && e['Timeframe'] == subRecord['Timeframe']) 
    // targetRecord.Children.splice(targetSubRecordIndex, 1)
    // console.log('-targetRecord----', targetRecord)
    // console.log( '-----',tmpData)
    setData(tmpData)
    
  }

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
      // const newData=JSON.parse(JSON.stringify(data))
       console.log('----', newData)
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

  const handleAdd = () => {
    const newData = {
      key: mergedColumns.length,
      "Eligibility Criteria": ``,
      Values: '',
      Timeframe: ``,
    }
    setData([...data, newData])
    edit(newData)
  };

  const handleDelete = async (record) => {
      const newData = [...data];
      const index = newData.indexOf(record);

      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1);
        setData(newData);

        props.updateIclusionCriteria(newData, props.tableIndex)
      }
  };

  const handleAddSubCriteria = (record) => {
    const tmpData = data.slice(0)
    const targetRecord = tmpData.find(e=> e['Eligibility Criteria']==record['Eligibility Criteria']&&e['Values']==record['Values']&&e['Timeframe']==record['Timeframe'])
   
    if (!targetRecord.Children) {
      targetRecord.Children = [
      {
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
    const targetRecord = tmpData.find(e=> e['Eligibility Criteria']==record['Eligibility Criteria']&&e['Values']==record['Values']&&e['Timeframe']==record['Timeframe'])
    targetRecord.Children.splice(idx, 1)
    setData(tmpData)
    
  }
  const saveSubCriteria = (record,subRecord,idx) => {
    setEditable({
      [idx]:false
    })
    const tmpData = data.slice(0)
    const targetRecord = tmpData.find(e=> e['Eligibility Criteria']==record['Eligibility Criteria']&&e['Values']==record['Values']&&e['Timeframe']==record['Timeframe'])
    targetRecord.Children[idx]= subRecord
    setData(tmpData)
    
  } 

  function callback(key) {
    // if(key.indexOf("1") < 0){
    //     setRollHeight(true)
    // } else {
    //     setRollHeight(false)
    // }
    // setDefaultActiveKey(key)
    // setActiveKey(key)
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

const panelContent = (rates) => {
  return (
      <div className="trial-panelBody">
      <div>
          <span className="key">Trial Title</span><br/>
          <span className="value"> test</span>
      </div>
      </div>
  );
};

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
    // console.log('-----', record)
    // console.log('addSubCriteria for '+record['Eligibility Criteria'])
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
      <Collapse activeKey={props.defaultActiveKey} onChange={callback} expandIconPosition="left"
          expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}>
          <Panel header={panelHeaderSection(props.panelHeader, props.collapsible ? 0 : data.length)} 
            key={props.tableIndex} forceRender={false}>
      <Table pagination={false} showHeader={false} rowKey={record => record["Eligibility Criteria"]}
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
          <p>Add condition or exception for <b>{conOrExcpKey}</b></p>
          <p>Condition or Exception</p>
          <TextArea value={conOrExp} onChange={(e) => handleInputChange(e)} autoSize={{ minRows: 3, maxRows: 5 }}/>
        </Modal>
    </Form>
  );
};

export default EditTable;