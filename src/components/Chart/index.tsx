import React from "react";
import ReactECharts from "echarts-for-react";

// var hours = ['12a', '1a', '2a', '3a', '4a', '5a', '6a',
//         '7a', '8a', '9a','10a','11a',
//         '12p', '1p', '2p', '3p', '4p', '5p',
//     '6p', '7p', '8p', '9p', '10p', '11p'];
var hours = ["0", "35", "70", "85"];
var days = ["Saturday"];
var data = [
  [0, 0, 5],
  [0, 1, 6],
  [0, 2, 4],
  [0, 3, 0],
  [0, 4, 0],
  [0, 5, 0],
  [0, 6, 0],
  [0, 7, 0],
  [0, 8, 0],
  [0, 9, 0],
  [0, 10, 0],
  [0, 11, 2],
  [0, 12, 4],
  [0, 13, 1],
  [0, 14, 1],
  [0, 15, 3],
  [0, 16, 4],
  [0, 17, 6],
  [0, 18, 4],
  [0, 19, 4],
  [0, 20, 3],
  [0, 21, 3],
  [0, 85, 5],
];

let option = {
  tooltip: {
    position: "top",
  },
  title: [],
  singleAxis: [],
  series: [],
};

days.forEach(function (day, idx) {
  option.title.push({
    textBaseline: "middle",
    top: ((idx + 0.5) * 100) / 7 + "%",
    // text: day
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
