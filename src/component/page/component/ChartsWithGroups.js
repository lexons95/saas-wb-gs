import React, { useState } from 'react'
import { Radio, DatePicker } from 'antd';
import { format, 
  eachDayOfInterval, 
  eachWeekOfInterval, 
  eachMonthOfInterval, 
  eachYearOfInterval,
  isSameDay,
  isSameWeek,
  isSameMonth,
  isSameYear,
  getDate,
  getWeek,
  getMonth,
  getYear
} from 'date-fns';
import moment from 'moment';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Brush, ResponsiveContainer } from 'recharts';

const { RangePicker } = DatePicker;


const xAxisProperty = 'createdAt';
const valueProperty = 'total';


const ChartsWithGroups = (props) => {
  const { data } = props;
  
  const [ groupBy, setGroupBy ] = useState('month');
  const [ selectedDate, setSelectedDate ] = useState({
    start: new moment().subtract(6, 'months').date(1),
    end: new moment()
  });

  const onGroupByChange = (e) => {
    e.preventDefault();
    setGroupBy(e.target.value);
  }

  const onDateRangeChange = (dates, dateStrings) => {
    setSelectedDate({
      start: dates ? dates[0] : "",
      end: dates ? dates[1] : ""
    });
  }

  const getAllDatesInRange = () => {
    let allDatesInRange = [];
    if (selectedDate.start != "" && selectedDate.end != "") {
      let dateRange = {
        start: new Date(selectedDate.start.format()),
        end: new Date(selectedDate.end.format())
      }
      if (groupBy == 'date') {
        allDatesInRange = eachDayOfInterval(dateRange)
      }
      else if (groupBy == 'week') {
        allDatesInRange = eachWeekOfInterval(dateRange)
      }
      else if (groupBy == 'month') {
        allDatesInRange = eachMonthOfInterval(dateRange)
      }
      else if (groupBy == 'year') {
        allDatesInRange = eachYearOfInterval(dateRange)
      }
    }
    return allDatesInRange;
  }

  const getGroupedItems = () => {
    let allDates = getAllDatesInRange();
    let result = [];
    allDates.forEach(aDate=>{
      let value = 0;
      let foundData = data.filter((aData)=>{
        let currentDate = aDate;
        let actualDate = new Date(aData[xAxisProperty]);

        let result = false;
        if (groupBy == 'date') {
          result = isSameDay(currentDate, actualDate)
        }
        else if (groupBy == 'week') {
          result = isSameWeek(currentDate, actualDate)
        }
        else if (groupBy == 'month') {
          result = isSameMonth(currentDate, actualDate)
        }
        else if (groupBy == 'year') {
          result = isSameYear(currentDate, actualDate)
        }
        return result;
      })

      if (foundData.length > 0) {
        value = 0;
        foundData.forEach(aData=>{
          value += aData[valueProperty];
        })
      }

      let dateString = "";
      if (groupBy == 'date') {
        dateString = format(aDate, 'dd/MM/yyyy')
      }
      else if (groupBy == 'week') {
        dateString = getWeek(aDate)
      }
      else if (groupBy == 'month') {
        dateString = format(aDate, 'MM/yyyy')
      }
      else if (groupBy == 'year') {
        dateString = getYear(aDate)
      }
      result.push({
        date: dateString,
        value: value
      })
    });

    return result;
  }

  let chartData = getGroupedItems();

  // console.log('data',[data[0],data[1],data[2],data[3]])
  // console.log('data',chartData)
  // console.log('data',getAllDatesInRange())


  return (
    <div className="dashboard-charts">
      <div className="dashboard-charts-filter">
        <Radio.Group onChange={onGroupByChange} defaultValue="month" style={{margin: '0 10px 0 0'}} size="small">
          <Radio.Button value="date">Day</Radio.Button>
          {/* <Radio.Button value="week">Week</Radio.Button> */}
          <Radio.Button value="month">Month</Radio.Button>
          <Radio.Button value="year">Year</Radio.Button>
        </Radio.Group>

        <RangePicker onChange={onDateRangeChange} picker={groupBy} value={[selectedDate.start, selectedDate.end]} size="small" allowClear={false} />
      </div>

      <div className="dashboard-charts-container">
        <ResponsiveContainer width={"100%"} height={300}>
          <LineChart
            width={500}
            height={300}
            data={chartData}
            margin={{
              top: 5, right: 30, left: 20, bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" allowDataOverflow={true} />
            <YAxis/>
            <Tooltip />
            <Legend />
            <Line type="monotone" name="Sales" dataKey="value" stroke="#8884d8" activeDot={{r: 8}}/>
            {/* <Brush dataKey="date" height={30}/> */}
          </LineChart>
        </ResponsiveContainer>

      </div>
    </div>
  )
}

export default ChartsWithGroups
