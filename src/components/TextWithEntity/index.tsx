import React, { useState, useEffect } from "react";
import { Button, Select, Tooltip, message } from "antd";
import { saveText } from "../../utils/ajax-proxy";
import successIcon from "../../assets/success.svg";
import warnIcon from "../../assets/warn.svg";
import { connect } from "react-redux";
import {ENDPOINT_SECTION} from '../../pages/ProtocolSection'
import * as fileActions from "../../actions/file.js";
import "./index.scss";
import { isTable } from "../Extraction";

const { Option } = Select;

interface TextWithEntityIF {
  summary?: {};
  activeType?: string;
  searchTxt?: string;
  wordsCollection: any;
  showTooltip?: boolean;
  showConcepts?: boolean;
  currentLabel?: string;
  score?: string;
  entityTypes?: Array<any>;
  showConfidence?: boolean;
  mId?: string;
  hashKey?: string;
  entity?: string;
  path?: string;
  firstMarkId?: string;
  activeSection?: string;
  handleChange?: (e) => void;
  onChangeActiveType?: (e) => void;
  hanldeRemoveCategory?: (e) => void;
  handleSaveContent?: Function;
  updateWordsCollection?: (e) => void;
  updateTableDatasource?: Function;
  readFile?: (e) => void;
  fileReader?:{}
  tableBody?:any,   
  tableBodyColumnIndex?:any,
  tableBodyRowIndex?:any
  isEndPointTable?:any
}

interface markIF {
  id: string;
  type: string;
  text: string;
  category: string;
  children: Array<any>;
  score: 1;
}



export const formatWord = (w) => {
  w = w.toLowerCase()
  if (w.indexOf("_") != -1) {
    let wArr =w.split('_').map(a => {  
      return a = a.slice(0,1).toUpperCase() + a.slice(1,a.length)
    })
     w = wArr.join(" ")
  } else {
    w = w.slice(0,1).toUpperCase() + w.slice(1,w.length)
  }
  return w
}

const renderConcepts = (concepts = [], text = "", entity = "") => {
  if (entity=="MedDRA") {
    return (
      <div className="concept-box meddra-concept-box">
        <span>LLT:<i>{concepts[0].LLT}</i></span>
        <span>PT:<i>{concepts[0].PT}</i></span>
        <span>HLT:<i>{concepts[0].HLT}</i></span>
        <span>HLGT:<i>{concepts[0].HLGT}</i></span>
        <span>SOC:<i>{concepts[0].SOC }</i></span>
      </div> 
    )
  }
  return (
    <div className="concept-box">
      {concepts.length > 0 &&
        <div className="concept-item">
          <div className="item-desc">
            <p className="desc-title">Top inferred concepts</p>
            { concepts.map((c) => {
              return (
                <div className="code">
                  {c.Code?<span>{c.Code}</span>:''}
                  <div className="desc-box" >
                    {c.Description?<p className="desc">{c.Description}</p>:''}
                    {c.Score?<p className="score">{ c.Score?c.Score.toFixed(2):'-' } score</p>:''}         
                  </div>
                </div>  
              )
            })}                   
          </div>
        </div>
        }
    </div>
  );
};

const renderMark = (markParams, entity) => {
  const {
    word,
    searchTxt,
    showConfidence = false,
    showConcepts = false,
    concepts = [],
  } = markParams;

  let term = word.children.map(c => {
    return c.term||""
  }).join(' ')

  if (showConcepts && concepts.length > 0) {
    let text = word.children.map(c => {
      return c.text
    }).join(' ')  
    if (text.indexOf(",") > -1) text = text.slice(0, text.length - 1) 
    return (
      <Tooltip key={word.id} placement="right" title={renderConcepts(concepts, text, entity)}>
        <mark
          key={word.children[0].id}
          id={word.id}
          className={`id_${word.category}`}
        >
          {word.children.map((child,idx) => {
            return (
              <span
                id={child.id}
                key={idx}
                className={`key-word ${word.category} ${
                  searchTxt &&
                  word.text.toLowerCase().indexOf(searchTxt.toLowerCase()) > -1
                    ? "matched-word"
                    : ""
                }`}
              >
                {child.text}{" "}
              </span>
            );
          })}
          <span
            id={word.id}
            key={`cate-${word.id}`}
            className={`cate-label ${
              searchTxt &&
              word.category.toLowerCase().indexOf(searchTxt.toLowerCase()) > -1
                ? "matched-word"
                : ""
            }`}
          >
            {formatWord(word.category)}&nbsp; 
          </span>
        </mark>
      </Tooltip>
    );
  }
  return (
    <mark
      key={word.id}
      id={word.id}
      className={`id_${word.category} ${
        showConfidence?(word.score && word.score.toFixed(2) * 100>=80 ? "suc" : "warn"):""
      }`}
    >
      {word.children.map((child) => {
        child.text.indexOf('\t')!=-1 && child.text.replace('\n','<br/>')
        return (
          <span
            id={child.id}
            key={child.id}
            className={`key-word ${word.category} ${
              searchTxt &&
              word.text.toLowerCase().indexOf(searchTxt.toLowerCase()) > -1
                ? "matched-word"
                : ""
            }`}
          >
            {child.text}{" "}
          </span>
        );
      })}
      <span
        id={word.id}
        key={`cate-${word.id}`}
        className={`cate-label ${
          searchTxt &&
          word.category.toLowerCase().indexOf(searchTxt.toLowerCase()) > -1
            ? "matched-word"
            : ""
        }`}
      >
        {formatWord(word.category)}&nbsp;
      </span>
      </mark>
      
  );
};

const renderTooltipTitle = (
  word,
  currentId,
  currentScore,
  currentLabel,
  handleChange,
  entityTypes,
  wordsCollection,
  updateWordsCollection,
  saveParamsObj,
  handleSaveContent,
  readFile,
  fileReader,
  entity,
  tableBody,
  tableBodyColumnIndex,
  tableBodyRowIndex,
  isEndPointTable
) => {
  const id = word.id;
  const score = word.score || "";
  let text = word.children.map(c => {
      return c.text
  }).join(' ')
  if (text.indexOf(",") > -1) text = text.slice(0, text.length - 1)
  
  return (
    <div className="mark-tooltip-container">
      <div className="highlighted-text">
        {text}
      </div>
      <div className="score">
        Confidence Score:
        {
          !currentScore &&
          <span className={`${score && score.toFixed(2) * 100 >= 80 ? "suc" : "warn"}`}>{(score * 100).toFixed(0)}%</span>
        }
        {
          currentScore&&id!==currentId &&
           <span className={`${score && score.toFixed(2) * 100 >= 80 ? "suc" : "warn"}`}>{(score * 100).toFixed(0)}%</span>       
        }
        {
          currentScore&&id==currentId &&
           <span className= "suc">{(currentScore * 100).toFixed(0)}%</span>
        }
      </div>
      <div className="type-selector">
        Change Entity Type
        <Select
          value={currentLabel?currentLabel:word.category}
          style={{ width: 200 }}
          onChange={(v)=>handleChange(id,v)}
        >
          {entityTypes.map((i,idx) => {
            return (
              <Option value={i} key={idx}>
                {formatWord(i)}
              </Option>
            );
          })}
        </Select>
        <br />
        <span
          className="remove-btn"
          onClick={(e) =>
            hanldeRemoveCategory(id, wordsCollection, updateWordsCollection, saveParamsObj,readFile,fileReader,isEndPointTable,tableBodyRowIndex,tableBodyColumnIndex)
          }
        >
          Remove Entity
        </span>
      </div>
      <div className="bottom">
        <Button
          type="primary"
          onClick={() =>
            handleSaveContent(
              id,
              currentScore,
              currentLabel,
              wordsCollection,
              updateWordsCollection,
              saveParamsObj,
              tableBody,   
              tableBodyColumnIndex,
              tableBodyRowIndex
            )
          }
        >
          Save
        </Button>
      </div>
    </div>
  );
};

const hanldeRemoveCategory = async(mid, wordsCollection, updateWordsCollection,saveParamsObj,readFile,fileReader,isEndPointTable,tableBodyRowIndex,tableBodyColumnIndex) => {
 
  const tempWordsCollection = wordsCollection.slice(0);
  const startWordIdx = tempWordsCollection.findIndex((wObj) => {
    return wObj.type == "mark" && wObj.id == mid;
  });
  const targetWordObj = tempWordsCollection[startWordIdx];
  const childrenItem = targetWordObj.children;
  tempWordsCollection.splice(startWordIdx, 1, ...childrenItem);
  updateWordsCollection(tempWordsCollection);
  const markCollection = tempWordsCollection.filter((w) => w.type == "mark");

  const { hashKey, entity, activeSection, path } = saveParamsObj;
  let paramBody,updatedData
   if(isEndPointTable){
    updatedData = fileReader.file 
    updatedData[hashKey][activeSection][0].tableResult[tableBodyRowIndex+1][tableBodyColumnIndex].comprehendMedical[entity].label=tempWordsCollection
    
    paramBody = {
      [hashKey]: {
        [activeSection]: [
          {
            tableResult: updatedData
          },
        ],
      },
    };
   }else{
    updatedData = fileReader.file
    updatedData[hashKey][activeSection][0].comprehendMedical[entity].label = tempWordsCollection;

    paramBody = {
      [hashKey]: {
        [activeSection]: [
          {
            comprehendMedical: {
              [entity]: {
                 label: tempWordsCollection,
              },
            },
          },
        ],
      },
    };
   }

     
  const saveRes = await saveText(paramBody, path);
  if (saveRes.statusCode == "200") {
      message.success("Remove successfully");
      readFile({
        updatedSection: paramBody,
        file: updatedData,
      });
    }
};

const TextWithEntity = (props: TextWithEntityIF) => {
  const {
    hashKey,
    activeType,
    searchTxt,
    entity,
    wordsCollection,
    showTooltip,
    entityTypes,
    updateWordsCollection,
    handleSaveContent,
    activeSection,
    path,
    readFile,
    tableBody,
    tableBodyColumnIndex,
    tableBodyRowIndex,
    isEndPointTable,
    updateTableDatasource
  } = props;

  const [currentLabel, setCurrentLabel] = useState("");
  const [currentScore, setCurrentScore] = useState(null)
  const [currentId, setCurrentId] = useState(null)
  const saveParamsObj = {
    hashKey,
    entity,
    activeSection,
    path,
  };

  const onChange = (id,v) => {
    setCurrentId(id)
    setCurrentScore(1)
    setCurrentLabel(v);
  };

  const getSelectedIds = (start, end) => {
    if (end == start) {
      return [start];
    } else {
      const selectionId = [];
      for (let i = start; i <= end; i++) {
        selectionId.push(i + "");
      }
      return selectionId;
    }
  };

  const handleKeyDown = (e) => {
    if (e.target.nodeName != "SPAN") return;
    setCurrentLabel("");
    const selectedObject = window.getSelection();
    const startId =
      selectedObject.getRangeAt(0) &&
      selectedObject
        .getRangeAt(0)
        .startContainer.parentElement.getAttribute("id");
    const endId =
      selectedObject.getRangeAt(0) &&
      selectedObject
        .getRangeAt(0)
        .endContainer.parentElement.getAttribute("id");
    const idRange = getSelectedIds(startId, endId);
    const tempWordsCollection = wordsCollection.slice(0);
    const selectedWordObj = tempWordsCollection.filter((wObj, idx) => {
      return idRange.includes(wObj.id + "");
    });

    if (!selectedWordObj[0] || !selectedWordObj[0].text) return;
    const startWordObjIdx = tempWordsCollection.findIndex((wObj, idx) => {
      return wObj.id == selectedWordObj[0].id;
    });
    const newMarkObj: markIF = {
      id: `m-${tempWordsCollection[startWordObjIdx].id}`,
      type: "mark", //'span'
      text: "",
      category: currentLabel,
      children: selectedWordObj,
      score:1,
    };
    // get text for mark
    let markText = "";
    newMarkObj.children.forEach((ele) => {
      ele.id = Number(ele.id);
      markText += ele.text;
    });
    newMarkObj.text = markText;
    tempWordsCollection.splice(
      startWordObjIdx,
      selectedWordObj.length,
      newMarkObj
    );
    
    if(isEndPointTable){
      updateTableDatasource(tempWordsCollection,tableBodyColumnIndex,tableBodyRowIndex)
    }else{
      updateWordsCollection(tempWordsCollection);
    }
    
  };

  return (
    <div className="text-with-entity-container">
      <pre>
      <div
        className="content text"
        id="pdf-content"
        onClick={showTooltip ? (e) => handleKeyDown(e) : () => {}}
      >
        {wordsCollection && wordsCollection.length && wordsCollection.map((word: any, index: number) => {
          if (word.type == "span") {
            return (
              <span
                id={word.id}
                key={index}
                className={`${
                  searchTxt &&
                  word.text.toLowerCase().indexOf(searchTxt.toLowerCase()) > -1
                    ? "matched-word"
                    : ""
                }`}
              >
                {word.text? word.text : ''}&nbsp;
              </span>
            );
          }
          if (word.type == "mark") {
            if (
              (activeType && word.category == activeType) ||
              activeType == ""
            ) {
              if (showTooltip) {
                const id = word.id;
                const score = word.score || "";
                const markParams = {
                  concepts: word.Concepts,
                  word,
                  searchTxt,
                  showConfidence: props.showConfidence,
                  entity
                };
                return (
                  <Tooltip     
                    // visible={true}
                    key={id}
                    className="entity-concept"
                    placement="right"
                    title={renderTooltipTitle(
                      word,
                      currentId,
                      currentScore,
                      currentLabel,
                      onChange,
                      entityTypes,
                      wordsCollection,
                      updateWordsCollection,
                      saveParamsObj,
                      handleSaveContent,
                      props.readFile,
                      props.fileReader,
                      entity,
                      tableBody,
                      tableBodyColumnIndex,
                      tableBodyRowIndex,
                      isEndPointTable
                    )}
                  >
                    {renderMark(markParams, entity)}
                  </Tooltip>
                );
              } else {
                const markParams = {
                  concepts: word.Concepts,
                  word,
                  searchTxt,
                  showConcepts: true,
                };
                return <> {renderMark(markParams,entity)}</>;
              }
            }
            if (activeType && word.category != activeType) {
              return (
                <>
                  {word.children.map((child,idx) => {
                    return (
                      <span
                        id={child.id}
                        key={idx}
                        className={`key-word ${
                          searchTxt &&
                          word.text
                            .toLowerCase()
                            .indexOf(searchTxt.toLowerCase()) > -1
                            ? "matched-word"
                            : ""
                        } `}
                      >
                        {child.text}
                      </span>
                    );
                  })}
                </>
              );
            }
          }
        })}
        </div>
        </pre>
    </div>
  );
};

const mapDispatchToProps = (dispatch) => ({
  readFile: (val) => dispatch(fileActions.fileReader(val)),
});

const mapStateToProps = (state) => ({
  fileReader: state.fileReducer,
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TextWithEntity);
