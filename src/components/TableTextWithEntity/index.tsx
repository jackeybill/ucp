import React, { useState, useEffect } from "react";
import TextWithEntity from "../TextWithEntity";
import "./index.scss";

const TableTextWithEntity = (props) => {
  const {
    dataSource,
    activeType,
    activeSection,
    searchTxt,
    onChangeActiveType,
    currentLabel,
    handleChange,
    entityTypes,
    firstMarkId,
    path,
    entity,
    showTooltip,
    showConfidence,
    hashKey,
    handleSaveContent,
    updateWordsCollection,
  } = props;
  const initHeaders = dataSource && dataSource.length > 0 && dataSource[0];
  const initBody = dataSource && dataSource.length > 0 && dataSource.slice(1);
  const [data, setData] = useState(dataSource || []);
  const [headers, setHeaders] = useState(initHeaders || []);
  const [body, setBody] = useState(initBody || []);


  const updateTableDatasource = (newData, columnIndex, rowIndex) => {
    const currentBody = body.slice(0);
    currentBody[rowIndex][columnIndex].comprehendMedical[entity].label =
      newData;
    setBody(currentBody);
  };

  return (
    <div className="table-text-with-entity-container">
      <table>
        <thead>
          <tr>
            {headers &&
              headers.length > 0 &&
              headers.map((h, idx) => {
                return (
                  <td key={idx}>
                    <div className="td-wrapper title">{h.title}</div>
                  </td>
                );
              })}
          </tr>
        </thead>
        <tbody>
          {body &&
            body.length > 0 &&
            body.map((row, ridx) => {
              return (
                <tr key={ridx}>
                  {row.length > 0 &&
                    row.map((cell, cidx) => {
                      const summary = cell.comprehendMedical[entity].Summary;
                      const wordsCollection =
                        cell.comprehendMedical[entity].label;
                      return (
                        <td>
                          {props.showPlainText ? (
                            <div className="td-wrapper">{cell.content}</div>
                          ) : (
                            <TextWithEntity
                              key={cidx}
                              hashKey={hashKey}
                              summary={summary}
                              wordsCollection={wordsCollection}
                              activeType={activeType}
                              activeSection={activeSection}
                              searchTxt={searchTxt}
                              onChangeActiveType={onChangeActiveType}
                              currentLabel={currentLabel}
                              handleChange={handleChange}
                              entityTypes={entityTypes}
                              firstMarkId={firstMarkId}
                              path={path}
                              showConfidence={showConfidence}
                              entity={entity}
                              showTooltip={showTooltip}
                              handleSaveContent={handleSaveContent}
                              updateWordsCollection={updateWordsCollection}
                              tableBody={body}
                              tableBodyColumnIndex={cidx}
                              tableBodyRowIndex={ridx}
                              isEndPointTable={true}
                              updateTableDatasource={updateTableDatasource}
                            />
                          )}
                        </td>
                      );
                    })}
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
};

export default TableTextWithEntity;
