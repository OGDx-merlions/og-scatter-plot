(function() {
  Polymer({

    is: 'og-scatter-plot', 

    properties: {
      /**
      * Width of the Chart.
      *
      * @property width
      */
      width: {
				type: Number,
				value: 960
      },
      /**
      * Height of the Chart.
      *
      * @property height
      */
			height: {
				type: Number,
				value: 300
      },
      /**
      * Chart Data
      * Format: [{x: Number, y0: Number, y1: Number .... yn: Number}]
      * @property data
      */
      data: {
				type: Array,
				value() {
					return [];
				},
				observer: '_redraw'
      },
      /**
       * Show Today Line and subsequently, Historical and Forecast Labels
       * 
       * @property showTodayLine
       */
      showTodayLine: {
        type: Boolean,
        value() {
          return true;
        }
      },
      /**
       * The X-axis point which should be considered as today
       * 
       * @property today
       */
      today: {
        type: String
      },
      /**
       * Today Label
       * 
       * @property todayLabel
       */
      todayLabel: {
        type: String,
        value: "Today"
      },
      /**
       * Historical Label
       * 
       * @property historicalLabel
       */
      historicalLabel: {
        type: String,
        value: "Historical"
      },
      /**
       * Forecast Label
       * 
       * @property forecastLabel
       */
      forecastLabel: {
        type: String,
        value: "Forecast"
      },
      /**
       * Forecast Label
       * 
       * @property axisData
       */
      axisData: {
        type: Object,
        value() {
          return this.__defaultAxisData;
        }
      },
      /**
       * Legend Alignment
       * Eg: right, left, center
       * 
       * @property legendAlignment
       */
      legendAlignment: {
        type: String,
        value: "right"
      },
      __defaultAxisData: {
        type: Object,
        value() {
          return {
            "x": {
              "color": "",
              "axisLabel": "",
              "legendLabel": "",
              "inputDateFormat": "",
              "tickFormat": "",
              "tickTimeFormat": "",
              "hideGrid": false,
              "d3NiceType": "",
              "niceTicks": 0,
              "axisColor": "",
              "tickColor": ""
            },
            "y": {
              "hideGrid": false,
              "axisLabel": "",
              "axisColor": "",
              "tickColor": "",
              "niceTicks": 6,
              "tickFormat": "",
              "start": 0,
              "series": [
                {
                  "color": "",
                  "legendLabel": "",
                  "tickFormat": ""
                }
              ]
            }
          };
        }
      }
    },
    
    ready() {
      this.scopeSubtree(this.$.chart, true);
    },

    attached() {
      this.axisData = this.axisData ? this.axisData : this.__defaultAxisData;
      this.axisData.x = this.axisData.x ? this.axisData.x : this.__defaultAxisData.x;
      this.axisData.y = this.axisData.y ? this.axisData.y : this.__defaultAxisData.y;

      if(this.axisData.x.axisColor) {
        this.customStyle['--x-axis-color'] = this.axisData.x.axisColor;
      }
      if(this.axisData.x.tickColor) {
        this.customStyle['--x-tick-color'] = this.axisData.x.tickColor;
      }
      if(this.axisData.y.axisColor) {
        this.customStyle['--y-axis-color'] = this.axisData.y.axisColor;
      }
      if(this.axisData.y.tickColor) {
        this.customStyle['--y-tick-color'] = this.axisData.y.tickColor;
      }
      this.updateStyles();
      
      this.draw();
    },

    draw() {
      let d3 = Px.d3;
      let me = this;
      let data = this.data;
      // set the dimensions and margins of the graph
      let margin = {top: 20, right: 20, bottom: 30, left: 50},
          width = this.width - margin.left - margin.right,
          height = this.height - margin.top - margin.bottom;

      // parse the date / time
      let parseTime = this.axisData.x.inputDateFormat ?
        d3.timeParse(this.axisData.x.inputDateFormat) : null;

      // set the ranges
      let x = d3.scaleTime().range([0, width]);
      let y = d3.scaleLinear().range([height, 0]).clamp(true);
          
      let svg = d3.select(this.$.chart).append("svg")
          .attr("viewBox", "0 0 "+this.width+" "+this.height)
          .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
          .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");
      
      data.forEach(function(d) {
        if(parseTime) {
          d.x = d.x.getTime ? d.x : parseTime(d.x);
        }
        for(let i = 0; i < d.length-1; i++) {
          let key = "y";
          d[key][i] = d[key][i] ? (+d[key][i]) : 0;
        }
      });

      let today = this.today ? parseTime(this.today) : null;
      
      let yMax = d3.max(data, function(d) {
        return d.y.reduce((a,b) => {
          return Math.max(a,b); 
        })
      });
      let yMin = this.axisData.y.start > 0 ? this.axisData.y.start : 0;

      x.domain(d3.extent(data, function(d) { return d.x; }));
      if(parseTime) {
        x.nice(d3[this.axisData.x.d3NiceType || "timeDay"]);
      } else if(this.axisData.x.niceTicks) {
        x.nice(this.axisData.x.niceTicks);
      } else {
        x.nice();
      }
      y.domain([yMin, yMax]);
      if(this.axisData.y.niceTicks) {
        y.nice(this.axisData.y.niceTicks);
      }
      
      let yScaledMin = y(y.domain()[0]);

      var toolTip = d3.tip(d3.select(this.$.chart))
        .attr("class", "d3-tip")
        .offset([-8, 0])
        .html(function(d) {
          return d.msg;
        });

      svg.call(toolTip);

      this.axisData.y.series.forEach((_series, idx) => {
        svg.selectAll(".dot")
          .data(data)
          .enter()
            .append("circle")
            .attr("r", 2)
            .attr("cx", (d, i) => x(d.x))
            .attr("cy", (d) => y(d.y[idx]))
            .attr("fill", _series.color || "steelblue")
            .attr("class", "series-circle-"+idx)
            .on('mouseover', function(d, i) {
              d3.select(this)
                .attr('r', 5);
              let prefix = _series.label ? _series.label + ": " : "";
              d.msg = prefix + d.y[idx];
              toolTip.show(d);
            })
            .on('mouseout', function(d) {
              d3.select(this)
                .attr('r', 2);
              toolTip.hide(d);
            });
      });

      // Add the X Axis
      let _xAxis = d3.axisBottom(x);
      if(parseTime && this.axisData.x.tickTimeFormat) {
        _xAxis.tickFormat(d3.timeFormat(this.axisData.x.tickTimeFormat));
      }
      svg.append("g")
          .attr("transform", "translate(0," + height + ")")
          .attr("class", "x-axis")
          .call(_xAxis);

      // Add the Y Axis
      svg.append("g")
          .attr("class", "y-axis")
          .call(d3.axisLeft(y).ticks(this.axisData.y.niceTicks || 6));

      if(this.showTodayLine) {
        svg.append("svg:line")
          .attr("class", "today")
          .attr("x1", x(today))
          .attr("y1", height+18)
          .attr("x2", x(today))
          .attr("y2", -7);

        if(this.historicalLabel) {
          svg.append("text")
            .attr("class", "today-text")
            .attr("x", (x(x.domain()[0]) + x(today))/2)
            .attr("y", -9)
            .text(this.historicalLabel);
        }
        
        if(this.todayLabel) {
          svg.append("text")
            .attr("class", "today-text")
            .attr("x", x(today)-10)
            .attr("y", -9)
            .text(this.todayLabel);
        }
        
        if(this.forecastLabel) {
          svg.append("text")
          .attr("class", "today-text")
          .attr("x", (x(x.domain()[1]) * 0.8))
          .attr("y", -9)
          .text(this.forecastLabel);
        }
      }

      if(!this.axisData.x.hideGrid) {
        svg.append("g")			
        .attr("class", "grid x-grid")
        .call(d3.axisBottom(x)
            .ticks(this.axisData.x.totalGridLines || 5)
            .tickSize(height)
            .tickFormat(""));
      }
          
      if(!this.axisData.y.hideGrid) {
        svg.append("g")			
        .attr("class", "grid y-grid")
        .call(d3.axisLeft(y)
            .ticks(this.axisData.y.totalGridLines || 5)
            .tickSize(-width)
            .tickFormat(""));
      }

      if(this.axisData.y.axisLabel) {
        svg.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 0 - margin.left)
          .attr("x",0 - (height / 2))
          .attr("dy", "1em")
          .attr("class", "y-axis-label")
          .text(this.axisData.y.axisLabel);
      }

      if(this.axisData.x.axisLabel) {
        svg.append("text")
          .attr("y", 0 - (width/2))
          .attr("x",0 - (margin.bottom))
          .attr("dy", "1em")
          .attr("class", "x-axis-label")
          .text(this.axisData.x.axisLabel);
      }

      this.fire("chart-drawn", {});
    },

    _redraw(newData, oldData) {
			if(oldData && oldData.length) {
				Polymer.dom(this.$.chart).node.innerHTML = "";
				this.draw();
			}
    },
    
    _toggleSeries(event) {
      const label = "series-circle-" + event.model.get("idx");
      
      this[label] = !this[label];
			if(this[label]) {
				this.querySelectorAll("."+label).forEach((elt) => {
					elt.style.display = "none";
				});
			} else {
				this.querySelectorAll("."+label).forEach((elt) => {
					elt.style.display = "block";
				});
			}
    }
  });
})();
