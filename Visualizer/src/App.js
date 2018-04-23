import React, { Component } from 'react';
import './App.css';
import Button from 'react-bootstrap/lib/Button';
import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import Nav from 'react-bootstrap/lib/Nav';
import Navbar from 'react-bootstrap/lib/Navbar';
import NavItem from 'react-bootstrap/lib/NavItem';
import Tabs from 'react-bootstrap/lib/Tabs';
import Tab from 'react-bootstrap/lib/Tab';
import Grid from 'react-bootstrap/lib/Grid';
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';
import Label from 'react-bootstrap/lib/Label';
import Alert from 'react-bootstrap/lib/Alert';
import 
  {
    VictoryScatter, 
    VictoryChart, 
    VictoryLine, 
    VictoryAxis,
    VictoryGroup,
    VictoryTooltip,
    VictoryBrushContainer,
    VictoryZoomContainer
  } 
  from "victory";
import axios from 'axios'

var dbURL = "http://localhost:9090/Data/";
var URLconfig = {
  headers: {'Access-Control-Allow-Origin': '*'}
};
var loading = false;

class DataLoader extends Component
{
  constructor(props)
  {
    super(props);
    this.state =
    {
      loaded: false,
      data: [],
      dataDetail: [],
      range: {},
      queryYear : 2018
    };
  }

  refresh()
  {
    this.setState(
      {
        loaded: false,
        data: [],
        dataDetail: [],
        range: this.state.range,
        queryYear : this.state.queryYear
      }
    );
  }

  formatDateString(dobj)
  {
    return (dobj.getFullYear() + "-" + (dobj.getMonth() + 1) + "-" + dobj.getDate());
  }

  onRangeChanged(domain)
  {
    this.setState(
      {
        loaded: this.state.loaded,
        data: this.state.data,
        dataDetail: this.state.dataDetail,
        range: domain,
        queryYear : this.state.queryYear
      }
    );
  }

  onQueryYearChanged(newYear)
  {
    this.setState(
      {
        loaded: false,
        data: this.state.data,
        dataDetail: this.state.dataDetail,
        range: this.state.range,
        queryYear : this.state.queryYear + newYear
      }
    );
  }

  loadData()
  {
    if (loading) return;
    var requestURL = dbURL
    + "/avg?resolution=month"
    + "&rangestart=" + this.state.queryYear + "-01-01"
    + "&rangeend=" + (this.state.queryYear + 1) + "-01-01";
    axios.get(requestURL, URLconfig)
    .then(respond => 
      {
        loading = true;
        var res = respond.data;
        if (!res.error)
        {
          var newData = [];
          for (let rdx = 0; rdx < res.result.length; rdx++)
          {
            var currentResult = res.result[rdx];
            var year = currentResult._id.year;
            var month = currentResult._id.month;
            if (month < 10)
            {
              month = "0" + month;
            }
            var tsstting = year + "-" + month + "-01";
            var currentData = 
            {
              x: new Date(tsstting),
              y: currentResult.Value
            };
            newData.push(currentData);
          }
          this.setState(
            {
              loaded: false,
              data: newData,
              dataDetail: [],
              range: this.state.range,
              queryYear : this.state.queryYear
            });
        }
        requestURL = dbURL
        + "/avg?resolution=day"
        + "&rangestart=" + this.state.queryYear + "-01-01"
        + "&rangeend=" + (this.state.queryYear + 1) + "-01-01";
        axios.get(requestURL, URLconfig)
          .then(respond => 
            {
              var res = respond.data;
              if (!res.error)
              {
                var newData = [];
                for (let rdx = 0; rdx < res.result.length; rdx++)
                {
                  var currentResult = res.result[rdx];
                  var year = currentResult._id.year;
                  var month = currentResult._id.month;
                  var day = currentResult._id.day;
                  if (month < 10)
                  {
                    month = "0" + month;
                  }
                  if (day < 10)
                  {
                    day = "0" + day;
                  }
                  var tsstting = year + "-" + month + "-" + day;
                  var currentData = 
                  {
                    x: new Date(tsstting),
                    y: currentResult.Value
                  };
                  newData.push(currentData);
                }
                var newRange = this.state.range;
                if (this.state.data.length > 0)
                {
                  var rangeEnd = new Date(this.state.data[this.state.data.length - 1].x.getTime());
                  var rangeStart = new Date(rangeEnd.getTime());
                  rangeStart.setUTCDate(rangeEnd.getUTCDate() - 30);
                  if (rangeStart < (this.state.data[0]).x)
                  {
                    rangeStart = (this.state.data[0]).x;
                  }
                  newRange = {x: [rangeStart, rangeEnd]};
                }
                this.setState(
                  {
                    loaded: true,
                    data: this.state.data,
                    dataDetail: newData,
                    range: newRange,
                    queryYear : this.state.queryYear
                  });
                loading = false;
              }
            });
      });
  }

  getRangedData()
  {
    var startDate = this.state.range.x[0];
    var endDate = this.state.range.x[1];
    var startPoint = 0;
    var endPoint = this.state.data.length - 1;
    var foundStartPoint = false;
    var foundEndPoint = false;

    for (let idx = 0; idx < this.state.data.length; idx++)
    {
      var current = this.state.data[idx];
      if (!foundStartPoint && (current.x >= startDate))
      {
        startPoint = idx;
        foundStartPoint = true;
      }
      if (!foundEndPoint && (current.x >= endDate))
      {
        endPoint = idx;
        foundEndPoint = true;
        break;
      }
    }

    if (startPoint - 5 <= 0)
    {
      startPoint = 0;
    }
    else
    {
      startPoint -= 5; 
    }

    if (endPoint + 5 > this.state.data.length)
    {
      endPoint = this.state.data.length - 1;
    }
    else
    {
      endPoint += 5; 
    }

    var limited = this.state.data.slice(startPoint, endPoint);

    return limited;
  }

  getRangedDataDetail()
  {
    var startDate = this.state.range.x[0];
    var endDate = this.state.range.x[1];
    var startPoint = 0;
    var endPoint = this.state.dataDetail.length - 1;
    var foundStartPoint = false;
    var foundEndPoint = false;

    for (let idx = 0; idx < this.state.dataDetail.length; idx++)
    {
      var current = this.state.dataDetail[idx];
      if (!foundStartPoint && (current.x >= startDate))
      {
        startPoint = idx;
        foundStartPoint = true;
      }
      if (!foundEndPoint && (current.x >= endDate))
      {
        endPoint = idx;
        foundEndPoint = true;
        break;
      }
    }

    if (startPoint - 5 <= 0)
    {
      startPoint = 0;
    }
    else
    {
      startPoint -= 5; 
    }

    if (endPoint + 5 > this.state.dataDetail.length)
    {
      endPoint = this.state.dataDetail.length - 1;
    }
    else
    {
      endPoint += 5; 
    }

    var limited = this.state.dataDetail.slice(startPoint, endPoint);

    return limited;
  }

  componentWillReceiveProps(nextProps)
  {
    this.setState(
      {
        loaded: false,
        data: [],
        dataDetail: [],
        range: {x: [new Date(2016, 6, 1), new Date(2017, 8, 1)]},
        queryYear : 2018
      });
  }

  render()
  {
    if (!this.state.loaded)
    {
      this.loadData();
      return (
        <div class="container-fluid">
        <Grid>
          <Row>
            <Alert bsStyle="warning">
              <strong>Loading data... </strong> Please wait.
            </Alert>
          </Row>
        </Grid>
        </div>
      );
    }

    var renderData = this.getRangedData();
    var renderDataDetail = this.getRangedDataDetail();

    return (
    <div class="container-fluid">
      <Grid>
        <Row>
          <Navbar>
            <Navbar.Brand>
              <text>{subtitle}</text>{' '}
              <Label bsStyle="info">{this.state.queryYear}</Label>
            </Navbar.Brand>
            <Navbar.Toggle />
            <Navbar.Collapse>
              <Navbar.Form pullLeft>
                <ButtonToolbar>
                  <Button onClick={() => this.onQueryYearChanged(-1)}>Previous year</Button>
                  <Button onClick={() => this.onQueryYearChanged(1)}>Next year</Button>
                </ButtonToolbar>
              </Navbar.Form>
              <Navbar.Form pullRight>
                <ButtonToolbar>
                  <Button bsStyle="success" onClick={() => this.refresh()}>Refresh</Button>
                </ButtonToolbar>
              </Navbar.Form>
            </Navbar.Collapse>
          </Navbar>
        </Row>
        <Row>
          <VictoryChart 
            height={180}
            padding={{ top: 5, left: 30, right: 30, bottom: 30 }}
            polar={false}
            scale={{ x: "time" }}
            domainPadding={{ y: 50}}
            containerComponent={
              <VictoryZoomContainer
                zoomDimension="x"
                zoomDomain={this.state.range}
                onZoomDomainChange={this.onRangeChanged.bind(this)}
              />
            }
          >
            <VictoryAxis
              style={{ axis: { stroke: '#000000' },
                axisLabel: { fontSize: 5, fill: '#000000' },
                ticks: { stroke: '#ccc' },
                tickLabels: { fontSize: 5, fill: '#000000'},
                grid: { stroke: '#B3E5FC', strokeWidth: 0.25 }
              }} dependentAxis
            />
            <VictoryAxis
              tickFormat={(x) => this.formatDateString(new Date(x))}
              style={{ axis: { stroke: '#000000' },
                axisLabel: { fontSize: 5 },
                ticks: { stroke: '#ccc' },
                tickLabels: { fontSize: 5, fill: '#000000', padding: 10, angle:45 }
              }}
            />
            <VictoryLine
              interpolation="monotoneX" data={renderData}
              style={{
                data: { stroke: "#008000", strokeWidth: 1 },
                parent: { border: "1px solid #ccc"}
              }}
            />
            <VictoryGroup
              labels={(d) => `Timestamp:${this.formatDateString(d.x)}\nValue: ${d.y} s`}
              labelComponent={
                <VictoryTooltip
                  style={{ fontSize: 10 }}
                />
              }
              data={renderData}
              >
              <VictoryScatter
                size={3}
                style={{ data: { fill: "#F39C12", opacity: 0.7 } }}
              />
            </VictoryGroup>
            <VictoryLine
              interpolation="monotoneX" data={renderDataDetail}
              style={{
                data: { stroke: "#E74C3C", strokeWidth: 1 },
                parent: { border: "1px solid #ccc"}
              }}
            />
            <VictoryGroup
              labels={(d) => `Timestamp:${this.formatDateString(d.x)}\nValue: ${d.y} s`}
              labelComponent={
                <VictoryTooltip
                  style={{ fontSize: 10 }}
                />
              }
              data={renderDataDetail}
              >
              <VictoryScatter
                size={3}
                style={{ data: { fill: "#F39C12", opacity: 0.7 } }}
              />
            </VictoryGroup>
          </VictoryChart>
          <VictoryChart
            padding={{ top: 30, left: 30, right: 30, bottom: 30 }}
            height={120}
            scale={{ x: "time" }}
            domainPadding={{ y: 50}}
            containerComponent={
              <VictoryBrushContainer
                brushDimension="x"
                brushDomain={this.state.range}
                onBrushDomainChange={this.onRangeChanged.bind(this)}
              />
            }
          >
            <VictoryAxis
              tickFormat={(x) => this.formatDateString(new Date(x))}
              style={{ axis: { stroke: '#000000' },
              axisLabel: { fontSize: 5, fill: '#000000' },
              ticks: { stroke: '#ccc' },
              tickLabels: { fontSize: 5, fill: '#000000', padding: 10},
              grid: { stroke: '#B3E5FC', strokeWidth: 0.25 }
            }}
            />
            <VictoryLine
              interpolation="monotoneX" data={this.state.data}
              style={{
                data: { stroke: "#008000", strokeWidth: 1 },
                parent: { border: "1px solid #ccc"}
              }}
            />
          </VictoryChart>
        </Row>
      </Grid>
    </div>
  );
  }
}

class App extends Component {

  constructor(props)
  {
    super(props);
  }

  render() {
    return (
      <div>
        <Navbar>
          <Navbar.Header>
            <Navbar.Brand>
              <a href="#home">Time Run Data Visualizer</a>
            </Navbar.Brand>
          </Navbar.Header>
          <Nav>
          </Nav>
        </Navbar>
        <div class="container-fluid">
          <Grid>
            <Row>
              <Col sm={3} lg="2">
                <nav class="navbar navbar-default navbar-fixed-side">
                  <Nav bsStyle="pills" stacked>
                    <NavItem eventKey={0}>
                      Home
                    </NavItem>
                  </Nav>
                </nav>
              </Col>
              <Col sm="9" lg="10">
                <DataLoader />
              </Col>
            </Row>
          </Grid>
        </div>
      </div>
    );
  }
}

export default App;
