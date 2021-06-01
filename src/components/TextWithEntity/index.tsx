import React, { useState, useEffect } from "react";
import { Button, Select, Tooltip, message } from "antd";
import { saveText } from "../../utils/ajax-proxy";
import successIcon from "../../assets/success.svg";
import warnIcon from "../../assets/warn.svg";
import { connect } from "react-redux";
import * as fileActions from "../../actions/file.js";
import "./index.scss";

const { Option } = Select;

interface TextWithEntityIF {
  summary?: {};
  activeType?: string;
  searchTxt?: string;
  wordsCollection: any;
  showTooltip?: boolean;
  showConcepts?: boolean;
  currentLabel?: string;
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
}

interface markIF {
  id: string;
  type: string;
  text: string;
  category: string;
  children: Array<any>;
}

const renderConcepts = (concepts = []) => {
  return (
    <div className="concept-box">
      {concepts.length > 0 &&
        concepts.map((c) => {
          return (
            <div className="concept-item">
              <div className="item-title">
                <span>
                  {" "}
                  <i>Code:</i> {c.Code}
                </span>
                <span>
                  <i>Confidence:</i> {c.Score.toFixed(2)}
                </span>
              </div>
              <div className="item-desc">
                <i>Description:</i> {c.Description}
              </div>
            </div>
          );
        })}
    </div>
  );
};

const renderMark = (markParams) => {
  console.log( '==========',markParams)
  const {
    word,
    searchTxt,
    showConfidence = false,
    showConcepts = false,
    concepts = [],
  } = markParams;
  if (showConcepts && concepts.length > 0) {
    return (
      <Tooltip key={word.id} placement="right" title={renderConcepts(concepts)}>
        <mark
          key={word.id}
          id={word.id}
          className={`id_${word.category} ${
            word.score && word.score >= 80 ? "suc" : "warn"
          }`}
        >
          {word.children.map((child) => {
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
              word.text.toLowerCase().indexOf(searchTxt.toLowerCase()) > -1
                ? "matched-word"
                : ""
            }`}
          >
            {word.category}
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
        word.score && word.score >= 80 ? "suc" : "warn"
      }`}
    >
      {word.children.map((child) => {
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
          word.text.toLowerCase().indexOf(searchTxt.toLowerCase()) > -1
            ? "matched-word"
            : ""
        }`}
      >
        {word.category}
      </span>
      {showConfidence ? (
        <img
          className="score-icon"
          src={word.score.toFixed(0) * 100 >= 80 ? successIcon : warnIcon}
          alt=""
        />
      ) : null}
    </mark>
  );
};

const renderTooltipTitle = (
  id,
  score,
  currentLabel,
  handleChange,
  entityTypes,
  wordsCollection,
  updateWordsCollection,
  saveParamsObj,
  handleSaveContent
) => {
  return (
    <div className="mark-tooltip-container">
      <div className="score">
        Confideance Score: <span>{(score * 100).toFixed(0)}%</span>
      </div>
      <div className="type-selector">
        Change Entity Type
        <Select
          value={currentLabel}
          style={{ width: 200 }}
          onChange={handleChange}
        >
          {entityTypes.map((i) => {
            return (
              <Option value={i} key={i}>
                {i}
              </Option>
            );
          })}
        </Select>
        <br />
        <span
          className="remove-btn"
          onClick={(e) =>
            hanldeRemoveCategory(id, wordsCollection, updateWordsCollection)
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
              currentLabel,
              wordsCollection,
              updateWordsCollection,
              saveParamsObj
            )
          }
        >
          Save
        </Button>
      </div>
    </div>
  );
};

// const handleSaveContent = async (
//   id,
//   currentLabel,
//   wordsCollection,
//   updateWordsCollection,
//   saveParamsObj
// ) => {
//   const targetIdx = wordsCollection.findIndex((w) => w.id == id);
//   const tempWordsCollection = wordsCollection.slice(0);
//   tempWordsCollection[targetIdx].category = currentLabel;
//   updateWordsCollection(tempWordsCollection);

//   const markCollection = tempWordsCollection.filter((w) => w.type == "mark");
//   const { hashKey, entity, activeSection, path } = saveParamsObj;

//   const paramBody = {
//     [hashKey]: {
//       [activeSection]: [
//         {
//           comprehendMedical: {
//             [entity]: {
//               label: markCollection,
//             },
//           },
//         },
//       ],
//     },
//   };

//   const saveRes = await saveText(paramBody, path);

//   if (saveRes.statusCode == "200") {
//     // props.readFile({
//     //   updateSection:paramBody
//     // })

//     message.success("Save successfully");
//     //update in fileReader?
//   }
// };

const hanldeRemoveCategory = (mid, wordsCollection, updateWordsCollection) => {
  const tempWordsCollection = wordsCollection.slice(0);
  const startWordIdx = tempWordsCollection.findIndex((wObj) => {
    return wObj.type == "mark" && wObj.id == mid;
  });
  const targetWordObj = tempWordsCollection[startWordIdx];
  const childrenItem = targetWordObj.children;
  tempWordsCollection.splice(startWordIdx, 1, ...childrenItem);
  updateWordsCollection(tempWordsCollection);
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
  } = props;

  const [currentLabel, setCurrentLabel] = useState("");
  const saveParamsObj = {
    hashKey,
    entity,
    activeSection,
    path,
  };

  const onChange = (v) => {
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

    updateWordsCollection(tempWordsCollection);
  };

  return (
    <div className="text-with-entity-container">
      <div
        className="content text"
        id="pdf-content"
        onClick={showTooltip ? (e) => handleKeyDown(e) : () => {}}
      >
        {wordsCollection.map((word: any, index: number) => {
          if (word.type == "span") {
            return (
              <span
                id={word.id}
                key={word.id}
                className={`${
                  searchTxt &&
                  word.text.toLowerCase().indexOf(searchTxt.toLowerCase()) > -1
                    ? "matched-word"
                    : ""
                }`}
              >
                {word.text ? `${word.text}` : " "}&nbsp;
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
                };
                return (
                  <Tooltip
                    key={id}
                    className="entity-concept"
                    placement="right"
                    title={renderTooltipTitle(
                      id,
                      score,
                      currentLabel,
                      onChange,
                      entityTypes,
                      wordsCollection,
                      updateWordsCollection,
                      saveParamsObj,
                      handleSaveContent
                    )}
                  >
                    {renderMark(markParams)}
                  </Tooltip>
                );
              } else {
                const markParams = {
                  concepts: word.Concepts,
                  word,
                  searchTxt,
                  showConcepts: true,
                };
                return <> {renderMark(markParams)}</>;
              }
            }
            if (activeType && word.category != activeType) {
              return (
                <>
                  {word.children.map((child) => {
                    return (
                      <span
                        id={child.id}
                        key={child.id}
                        className={`key-word ${
                          searchTxt &&
                          word.text
                            .toLowerCase()
                            .indexOf(searchTxt.toLowerCase()) > -1
                            ? "matched-word"
                            : ""
                        }`}
                      >
                        {child.text}{" "}
                      </span>
                    );
                  })}
                </>
              );
            }
          }
        })}
      </div>
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
// export default TextWithEntity;
