import React from "react";
import ReactECharts from "echarts-for-react";


var hours = ["0", "3", "6", "8"];
var days = ["Saturday"];
var data = [
  [0, 0, 5],
  [0, 2, 3],
  [0, 3, 2],
  [0, 5, 4],
  [0, 5, 2],
  [0, 10, 1],
  [0, 6, 5],
  [0, 7, 3],
  [0, 8, 3], 
];

let option = {
  tooltip: {
    // show: false,
    position: "top",
  },
  title: [],
  singleAxis: [],
  series:[]
  
  // title: {
  //   textBaseline: "middle",
  // },
  // singleAxis: {
  //   left: 10,
  //   type: "category",
  //   boundaryGap: false,
  //   data: hours,
  //   // top: (idx * 100) / 7 + 5 + "%",
  //   height: 100 / 7 - 10 + "%",
  //   axisLabel: {
  //     interval: 2,
  //   },
  // },
  // series: {
  //   // singleAxisIndex: idx,
  //   coordinateSystem: "singleAxis",
  //   type: "scatter",
  //   data: data,
  //   // symbolSize: function (dataItem) {
  //   //   return dataItem[1] * 4;
  //   // },
  // },
};

days.forEach(function (day, idx) {
  option.title.push({
    textBaseline: "middle",
    top: ((idx + 0.5) * 100) / 7 + "%",
  });
  option.singleAxis.push({
    left: 10,
    type: "category",
    boundaryGap: false,
    data: hours,
    top: (idx * 100) / 7 + 5 + "%",
    height: 100 / 7 - 10 + "%",
    axisLabel: {
      interval: 2,
    },
  });
  option.series.push({
    singleAxisIndex: idx,
    coordinateSystem: "singleAxis",
    type: "scatter",
    data: [],
    symbolSize: function (dataItem) {
      return dataItem[1] * 4;
    },
  });
});

data.forEach(function (dataItem) {
  option.series[dataItem[0]].data.push([dataItem[1], dataItem[2]]);
});


 
 







const Scatter = () => {
  return (
    <div>
      <ReactECharts option={option} />
    </div>
  );
};

export default Scatter;
