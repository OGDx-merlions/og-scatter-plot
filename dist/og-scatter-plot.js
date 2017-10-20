'use strict';(function(){Polymer({is:'og-scatter-plot',properties:{/**
      * Width of the Chart.
      *
      * @property width
      */width:{type:Number,value:960},/**
      * Height of the Chart.
      *
      * @property height
      */height:{type:Number,value:300},/**
      * Chart Data
      * Format: [{x: Number, y: [y0, y1, y2, y3...]}]
      * @property data
      */data:{type:Array,value:function value(){return[]},observer:'_redraw'},/**
       * Show Today Line and subsequently, Historical and Forecast Labels
       *
       * @property showTodayLine
       */showTodayLine:{type:Boolean,value:true},/**
       * The X-axis point which should be considered as today
       *
       * @property today
       */today:{type:String},/**
       * Today Label
       *
       * @property todayLabel
       */todayLabel:{type:String,value:'Today'},/**
       * Historical Label
       *
       * @property historicalLabel
       */historicalLabel:{type:String,value:'Historical'},/**
       * Forecast Label
       *
       * @property forecastLabel
       */forecastLabel:{type:String,value:'Forecast'},/**
       * Forecast Label
       *
       * @property axisData
       */axisData:{type:Object,notify:true,observer:'_redraw'},/**
       * Legend Alignment
       * Eg: right, left, center
       *
       * @property legendAlignment
       */legendAlignment:{type:String,value:'right'}},__defaultAxisData:{'x':{'color':'','axisLabel':'','legendLabel':'','inputDateFormat':'','tickFormat':'','tickTimeFormat':'','hideGrid':false,'d3NiceType':'','niceTicks':0,'axisColor':'','tickColor':''},'y':{'hideGrid':false,'axisLabel':'','axisColor':'','tickColor':'','niceTicks':6,'tickFormat':'','start':0,'series':[{'color':'','radius':2,'legendLabel':'','tickFormat':'','type':'','interpolation':'','xStart':'','xEnd':''}]}},ready:function ready(){this.scopeSubtree(this.$.chart,true)},attached:function attached(){this.axisData=this.axisData?this.axisData:this.__defaultAxisData;this.axisData.x=this.axisData.x?this.axisData.x:this.__defaultAxisData.x;this.axisData.y=this.axisData.y?this.axisData.y:this.__defaultAxisData.y;if(this.axisData.x.axisColor){this.customStyle['--x-axis-color']=this.axisData.x.axisColor}if(this.axisData.x.tickColor){this.customStyle['--x-tick-color']=this.axisData.x.tickColor}if(this.axisData.y.axisColor){this.customStyle['--y-axis-color']=this.axisData.y.axisColor}if(this.axisData.y.tickColor){this.customStyle['--y-tick-color']=this.axisData.y.tickColor}this.updateStyles();if(this.data&&this.data.length){this.draw()}},draw:function draw(){var _this=this;var d3=Px.d3;var me=this;var data=this.data;if(!data||data.length===0||!this.axisData||!this.axisData.x){return}// set the dimensions and margins of the graph
var margin={top:30,right:20,bottom:40,left:50},width=this.width-margin.left-margin.right,height=this.height-margin.top-margin.bottom;// parse the date / time
var parseTime=this.axisData.x.inputDateFormat?d3.timeParse(this.axisData.x.inputDateFormat):null;// set the ranges
var x=null;if(parseTime){x=d3.scaleTime().range([0,width])}else{x=d3.scaleLinear().range([0,width])}var y=d3.scaleLinear().range([height,0]).clamp(true);d3.select(this.$.chart).select('svg').remove();var svg=d3.select(this.$.chart).append('svg').attr('viewBox','0 0 '+this.width+' '+this.height).attr('preserveAspectRatio','xMidYMid meet').append('g').attr('transform','translate('+margin.left+','+margin.top+')');data.forEach(function(d){if(parseTime){d.x=d.x.getTime?d.x:parseTime(d.x)}for(var i=0;i<d.length-1;i++){var key='y';d[key][i]=d[key][i]?+d[key][i]:0}});var today=this.today?parseTime(this.today):null;var yMax=d3.max(data,function(d){return d.y.reduce(function(a,b){return Math.max(a,b)})});var yMin=this.axisData.y.start>0?this.axisData.y.start:0;x.domain(d3.extent(data,function(d){return d.x}));if(parseTime){x.nice(d3[this.axisData.x.d3NiceType||'timeDay'])}else if(this.axisData.x.niceTicks){x.nice(this.axisData.x.niceTicks)}else{x.nice()}y.domain([yMin,yMax]);if(this.axisData.y.niceTicks){y.nice(this.axisData.y.niceTicks)}var yScaledMin=y(y.domain()[0]);var toolTip=d3.tip(d3.select(this.$.chart)).attr('class','d3-tip').offset([-8,0]).html(function(d){return d.msg});svg.call(toolTip);if(!this.axisData.x.hideGrid){svg.append('g').attr('class','grid x-grid').call(d3.axisBottom(x).ticks(this.axisData.x.totalGridLines||5).tickSize(height).tickFormat(''))}if(!this.axisData.y.hideGrid){svg.append('g').attr('class','grid y-grid').call(d3.axisLeft(y).ticks(this.axisData.y.totalGridLines||5).tickSize(-width).tickFormat(''))}if(this.showTodayLine){svg.append('svg:line').attr('class','today').attr('x1',x(today)).attr('y1',height+18).attr('x2',x(today)).attr('y2',-7);if(this.historicalLabel){svg.append('text').attr('class','today-text').attr('x',(x(x.domain()[0])+x(today))/2).attr('y',-9).text(this.historicalLabel)}if(this.todayLabel){svg.append('text').attr('class','today-text').attr('x',x(today)-10).attr('y',-9).text(this.todayLabel)}if(this.forecastLabel){svg.append('text').attr('class','today-text').attr('x',x(x.domain()[1])*0.8).attr('y',-9).text(this.forecastLabel)}}this.axisData.y.series.forEach(function(_series,idx){var filteredData=data.filter(function(_datum){if(!_series.xStart&&!_series.xEnd){return true}var result=true;if(_series.xStart){var scaledXStart=parseTime?parseTime(_series.xStart):+_series.xStart;result=x(_datum.x)>=x(scaledXStart)}if(result&&_series.xEnd){var scaledXEnd=parseTime?parseTime(_series.xEnd):+_series.xEnd;return x(_datum.x)<=x(scaledXEnd)}return result});if(_this.axisData.y.series[idx].radius!==0){_series.radius=_this.axisData.y.series[idx].radius||2}var isLineChart=_this.axisData.y.series[idx].type==='line';if(isLineChart){var line=d3.line().x(function(d){return x(d.x)}).y(function(d){return y(d.y[idx])});if(_this.axisData.y.series[idx].interpolation){line.curve(d3[_this.axisData.y.series[idx].interpolation])}svg.append('path').data([filteredData]).attr('class','series-circle-'+idx).style('stroke',_series.color||'steelblue').attr('fill','transparent').attr('d',line).style('pointer-events','none')}svg.selectAll('.dot').data(filteredData).enter().append('circle').attr('r',_series.radius).attr('cx',function(d,i){return x(d.x)}).attr('cy',function(d){return y(d.y[idx])}).attr('fill',_series.color||'steelblue').attr('class','series-circle-'+idx).on('mouseover',function(d,i){d3.select(this).attr('r',_series.radius+2);var prefix=_series.label?_series.label+': ':'';d.msg=prefix+d.y[idx];toolTip.show(d)}).on('mouseout',function(d){d3.select(this).attr('r',_series.radius);toolTip.hide(d)})});// Add the X Axis
var _xAxis=d3.axisBottom(x);if(parseTime&&this.axisData.x.tickTimeFormat){_xAxis.tickFormat(d3.timeFormat(this.axisData.x.tickTimeFormat))}else if(this.axisData.x.tickFormat){_xAxis.tickFormat(d3.format(this.axisData.x.tickFormat))}svg.append('g').attr('transform','translate(0,'+height+')').attr('class','x-axis').call(_xAxis);// Add the Y Axis
var _yAxis=d3.axisLeft(y).ticks(this.axisData.y.niceTicks||6);if(this.axisData.y.tickFormat){_yAxis.tickFormat(d3.format(this.axisData.y.tickFormat))}svg.append('g').attr('class','y-axis').call(_yAxis);if(this.axisData.y.axisLabel){svg.append('text').attr('transform','rotate(-90)').attr('y',0-margin.left).attr('x',0-height/2).attr('dy','1em').attr('class','y-axis-label').text(this.axisData.y.axisLabel)}if(this.axisData.x.axisLabel){svg.append('text').attr('dy','1em').attr('class','x-axis-label').attr('text-anchor','middle').attr('transform','translate('+width/2+','+(height+margin.top)+')').text(this.axisData.x.axisLabel)}this.fire('chart-drawn',{})},_redraw:function _redraw(newData,oldData){Px.d3.select(this.$.chart).select('svg').remove();this.draw()},_toggleSeries:function _toggleSeries(event){var label='series-circle-'+event.model.get('idx');this[label]=!this[label];if(this[label]){this.querySelectorAll('.'+label).forEach(function(elt){elt.style.display='none'})}else{this.querySelectorAll('.'+label).forEach(function(elt){elt.style.display='block'})}}})})();
//# sourceMappingURL=og-scatter-plot.js.map
