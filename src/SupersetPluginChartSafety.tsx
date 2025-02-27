/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React, { useState } from 'react';
import { styled } from '@superset-ui/core';
import ReactECharts from 'echarts-for-react';
import { Select } from 'antd';
import { SupersetPluginChartSafetyProps } from './types';
import { type CustomSeriesRenderItemReturn } from 'echarts';

interface StylesProps {
  height: number;
  width: number;
}

const Styles = styled.div<StylesProps>`
  height: ${({ height }) => height}px;
  width: ${({ width }) => width}px;
  
  .calendar-controls {
    margin-bottom: 16px;
    display: flex;
    justify-content: center;
  }

  .chart-container {
    height: 100%;
  }
`;

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function SupersetPluginChartSafety(props: SupersetPluginChartSafetyProps) {
  const { data, height, width } = props;
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  console.log(height, width)

  const mapDataToChartDataFormat = (data: { date: number, incidents: number, risks: number }[]) => {
    const res: [number, { incidents: number, risks: number }][] = [];
    data.forEach(item => {
      const date = item.date;
      if (new Date(date).getFullYear() !== year) {
        return
      }
      if (new Date(date).getMonth() !== selectedMonth) {
        return
      }
      const incidents = item.incidents || 0;
      const risks = item.risks || 0;

      res.push([date, { incidents, risks }]);
    });
    return res;
  }

  const option = {
    tooltip: {
      formatter: (params: any) => {
        const [date, { incidents, risks }] = params.data;
        return `Date: ${date}<br/>Incidents: ${incidents}, Risks: ${risks}`;
      }
    },
    calendar: [
      {
        left: 'center',
        top: 'center',
        cellSize: [Math.min(width / 7, (height - 100) / 6), Math.min(width / 7, (height - 100) / 6)], // Dynamic cell size
        yearLabel: { show: false },
        orient: 'vertical',
        dayLabel: {
          firstDay: 1,
          margin: 5, // Reduced margin
          nameMap: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
        },
        monthLabel: {
          show: true
        },
        range: `${year}-${selectedMonth + 1}`,
        layoutScheme: 'month'
      }
    ],
    series: [
      {
        type: 'custom',
        coordinateSystem: 'calendar',
        renderItem: function (params: any, api: any) {
          const cellPoint = api.coord(api.value(0));
          const cellWidth: number = (params.coordSys as any).cellWidth;
          const cellHeight: number = (params.coordSys as any).cellHeight;
          const padding = Math.min(cellWidth, cellHeight) * 0.05; // 5% padding

          const { incidents, risks } = api.value(1) as any;

          if (isNaN(incidents) || isNaN(risks)) {
            return;
          }

          const upperColor = incidents > 0 ? '#E35A5A' : '#66FF99';
          const lowerColor = risks > 0 ? '#CFEC31' : '#66FF99';
          const [x, y] = cellPoint;
          
          const rectHeight = (cellHeight - padding * 3) / 2; // Divide cell height into two parts with padding

          const group: CustomSeriesRenderItemReturn = {
            type: "group",
            children: [
              {
                type: 'rect',
                shape: {
                  x: x - (cellWidth / 2) + padding,
                  y: y - (cellHeight / 2) + padding,
                  width: cellWidth - (padding * 2),
                  height: rectHeight
                },
                style: {
                  fill: upperColor
                }
              },
              {
                type: 'rect',
                shape: {
                  x: x - (cellWidth / 2) + padding,
                  y: y - (cellHeight / 2) + rectHeight + (padding * 2),
                  width: cellWidth - (padding * 2),
                  height: rectHeight
                },
                style: api.style({
                  fill: lowerColor,
                })
              },
              {
                type: 'text',
                style: {
                  x,
                  y,
                  text: new Date(api.value(0)).getDate().toString().padStart(2, '0'),
                  fill: 'black',
                  align: 'center',
                  verticalAlign: 'middle',
                  textFont: api.font({ 
                    fontSize: Math.min(cellWidth, cellHeight) * 0.4 
                  })
                }
              }
            ]
          }

          return group;
        },
        dimensions: [undefined, { type: 'ordinal' }],
        data: mapDataToChartDataFormat(data as { date: number, incidents: number, risks: number }[])
      }
    ]
  };

  // Update the return statement
  return (
    <Styles height={height} width={width}>
      <div className="calendar-controls">
        <Select
          value={selectedMonth}
          onChange={setSelectedMonth}
          style={{ width: 120 }}
        >
          {months.map((month, index) => (
            <Select.Option key={index} value={index}>
              {month}
            </Select.Option>
          ))}
        </Select>
        <Select
          value={year}
          onChange={setYear}
          style={{ width: 120 }}
        >
          {
            Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map((year, index) => (
              <Select.Option key={index} value={year}>
                {year}
              </Select.Option>
            ))
          }
        </Select>
      </div>
      <div className="chart-container">
        <ReactECharts
          option={option}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      </div>
    </Styles>
  );
}
