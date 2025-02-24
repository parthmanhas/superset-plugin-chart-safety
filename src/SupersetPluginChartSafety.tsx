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
import { styled, t } from '@superset-ui/core';
import ReactECharts from 'echarts-for-react';
import { Select } from 'antd';
import { SupersetPluginChartSafetyProps } from './types';
import type { CustomSeriesRenderItemReturn } from 'echarts';
import { time } from 'echarts/core';

// Update the Styles component
const Styles = styled.div`
  height: ${({ height }) => height}px;
  width: ${({ width }) => width}px;
  
  .calendar-controls {
    margin-bottom: 16px;
    display: flex;
    justify-content: center;
  }

  .chart-container {
    height: 100%;
    min-height: 500px;
  }
`;

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const processData = (data, selectedMonth) => {
  const calendarData = [];
  const currentYear = new Date().getFullYear();

  data.forEach(item => {
    const itemDate = new Date(item.date);
    // Only process data for selected month
    if (itemDate.getMonth() === selectedMonth) {
      const date = item.date;
      const incidents = item.incidents || 0;
      const risks = item.risks || 0;

      calendarData.push({
        date,
        value: [date, 0.75, incidents > 0 ? 1 : 0],
        itemStyle: {
          color: incidents > 0 ? '#ff4d4f' : '#52c41a'
        }
      });

      calendarData.push({
        date,
        value: [date, 0.25, risks > 0 ? 1 : 0],
        itemStyle: {
          color: risks > 0 ? '#faad14' : '#52c41a'
        }
      });
    }
  });

  return calendarData;
};

export default function SupersetPluginChartSafety(props: SupersetPluginChartSafetyProps) {
  const { data, height, width } = props;
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const data1 = [['2025-02-24', { incidents: 1, risks: 1 }]]

  const option = {
    tooltip: {
      formatter: (params) => {
        const [date, { incidents, risks }] = params.data;
        return `Date: ${date}<br/>Incidents: ${incidents}, Risks: ${risks}`;
      }
    },
    calendar: [
      {
        left: 'center',
        top: 'center',
        cellSize: [70, 70],
        yearLabel: { show: false },
        orient: 'vertical',
        dayLabel: {
          firstDay: 1,
          margin: 10,
          nameMap: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
        },
        monthLabel: {
          show: true
        },
        range: `2025-${selectedMonth + 1}`,
        layoutScheme: 'month'
      }
    ],
    series: [
      {
        type: 'custom',
        coordinateSystem: 'calendar',
        renderItem: function (params, api) {
          const cellPoint = api.coord(api.value(0));
          const cellWidth: number = (params.coordSys as any).cellWidth;
          const cellHeight: number = (params.coordSys as any).cellHeight;

          const { incidents, risks } = api.value(1) as any;

          if (isNaN(incidents) || isNaN(risks)) {
            return;
          }

          const upperColor = incidents > 0 ? '#E35A5A' : '#66FF99';
          const lowerColor = risks > 0 ? '#CFEC31' : '#66FF99';
          const [x, y] = cellPoint;

          const group: CustomSeriesRenderItemReturn = {
            type: "group",
            children: [
              {
                type: 'rect',
                shape: {
                  x: x - (cellWidth / 2) + 2.5,
                  y: y - (cellHeight / 2) + 2.5,
                  width: cellWidth - 5,
                  height: 30
                },
                style: {
                  fill: upperColor
                }
              },
              {
                type: 'rect',
                shape: {
                  x: x - (cellWidth / 2) + 2.5,
                  y: y + 3,
                  width: cellWidth - 5,
                  height: 30
                },
                style: api.style({
                  fill: lowerColor,
                })
              },
              {
                type: 'text',
                style: {
                  x: x - 15,
                  y: y - 15,
                  // text: time.format('dd', cellPoint, 'en'),
                  text: new Date(api.value(0)).getDate(),
                  fill: 'black',
                  textFont: api.font({ fontSize: 30 })
                }
              }
            ]
          }

          return group;
        },
        dimensions: [undefined, { type: 'ordinal' }],
        data: filteredData
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
