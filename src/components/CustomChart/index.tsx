import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';

const CustomChart = (props) => {

  function onChartReady(echarts) { }

  function onChartClick(param, echarts) {
    // setCount(count + 1);
  };
  function onChartLegendselectchanged(param, echarts) { };

  return (
    <>
      <ReactECharts option={props.option} style={{ height: props.height }} onChartReady={onChartReady} 
        onEvents={{'click': onChartClick, 'legendselectchanged': onChartLegendselectchanged}}/>
    </>
  );
};
export default CustomChart;