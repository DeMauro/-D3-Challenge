var svgWidth = 960;
var svgHeight = 500;

var margin = {
  top: 20,
  right: 40,
  bottom: 100,
  left: 80
};

var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

// Create an SVG wrapper, append an SVG group that will hold our chart,
// and shift the latter by left and top margins.
var svg = d3
  .select("#scatter")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

// Append an SVG group
var chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Initial Params
var chosenXAxis = "poverty";
var chosenYAxis ="healthcare";

// function used for updating x-scale var upon click on axis label
function xScale(censusData, chosenXAxis) {
  // create scales
  var xLinearScale = d3.scaleLinear()
    .domain([d3.min(censusData, d => d[chosenXAxis]) * 0.8,
      d3.max(censusData, d => d[chosenXAxis]) * 1.2])
    .range([0, width]);
  return xLinearScale;
}
// function used for updating y-scale var upon click on axis label
function yScale(censusData, chosenYAxis) {
  // create scales
  var yLinearScale = d3.scaleLinear()
    .domain([d3.min(censusData, d => d[chosenYAxis]) * 0.8,
      d3.max(censusData, d => d[chosenYAxis]) * 1.2])
    .range([height, 0]);
  return yLinearScale;
}

// function used for updating xAxis var upon click on axis label
function renderXAxes(newXScale, xAxis) {
  var bottomAxis = d3.axisBottom(newXScale);

  xAxis.transition()
    .duration(1000)
    .call(bottomAxis);
  return xAxis;
}
// function used for updating yAxis var upon click on axis label
function renderYAxes(newYScale, yAxis) {
  var leftAxis = d3.axisLeft(newYScale);

  yAxis.transition()
    .duration(1000)
    .call(leftAxis);
  return yAxis;
}

// function used for updating circles group and text group with a transition to
// new circles
function renderCircles(circlesGroup, newXScale, newYScale,chosenXAxis,chosenYAxis) {

  circlesGroup.transition()
    .duration(1000)
    .attr("cx", d => newXScale(d[chosenXAxis]))
    .attr("cy", d => newYScale(d[chosenYAxis]));
  return circlesGroup;
}
function renderText(stateText, newXScale, newYScale, chosenXAxis, chosenYAxis) {

  stateText.transition()
    .duration(1000)
    .attr("x", d => newXScale(d[chosenXAxis]))
    .attr("y", d => newYScale(d[chosenYAxis])+3); // +3 centers the abbr in the circle
  return stateText;
}

// function used for updating circles group with new tooltip
// this was a trip. I was trying to use the label from the class file (day 3 #12).  I'm a bit proud of the comma format
function updateToolTip(chosenXAxis, chosenYAxis,circlesGroup) {
  var toolTip = d3.tip()
    .attr("class", "d3-tip")
    .html(function(d) {
      if (chosenXAxis === "income"){
        return (`${d.state}<br>${chosenXAxis}: $${d3.format(",")(d[chosenXAxis])}<br>${chosenYAxis}: ${d[chosenYAxis]}%`); 
    
      } else if (chosenXAxis === "age"){
        return (`${d.state}<br>${chosenXAxis}: ${d[chosenXAxis]}<br>${chosenYAxis}: ${d[chosenYAxis]}%`); 
      }    
      else {
        return (`${d.state}<br>${chosenXAxis}: ${d[chosenXAxis]}%<br>${chosenYAxis}: ${d[chosenYAxis]}%`); 
      }
      });     
  circlesGroup.call(toolTip);
  circlesGroup.on("mouseover", function(data) {
    toolTip.show(data)
    d3.select(this).transition()
      .duration(500)
      .attr('stroke-width',"3px")
    })
    .on("mouseout", function(data, index) {
      toolTip.hide(data)
      d3.select(this)
        .transition()
        .duration(500)
        .attr('stroke-width',"0px")
    });
  return circlesGroup;
}

// Retrieve data from the CSV file and execute everything below
d3.csv("assets/data/censusData.csv").then(function(censusData, err) {
    if (err) throw err;
    // parse data
  censusData.forEach(function(data) {
    data.poverty = +data.poverty;
    data.healthcare = +data.healthcare;
    data.smokes = +data.smokes;
    data.age = +data.age;
    data.income = +data.income;
    data.obesity = +data.obesity;
    data.abbr = data.abbr;
  });  
  // console.log(censusData)

  // xLinearScale function above csv import
  var xLinearScale = xScale(censusData, chosenXAxis);
  // Create y scale function
  var yLinearScale = yScale(censusData, chosenYAxis);

  // Create initial axis functions
  var bottomAxis = d3.axisBottom(xLinearScale);
  var leftAxis = d3.axisLeft(yLinearScale);

  // append x axis
  var xAxis = chartGroup.append("g")
    .classed("x-axis", true)
    .attr("transform", `translate(0, ${height})`)
    .call(bottomAxis);

  // append y axis
  var yAxis = chartGroup.append("g")
    .classed("y-axis", true)
    .call(leftAxis);

  // append initial circles and text
  var circlesGroup = chartGroup.selectAll("circle")
    .data(censusData)
    .enter()
    .append("circle")
    .attr("cx", d => xLinearScale(d[chosenXAxis]))
    .attr("cy", d => yLinearScale(d[chosenYAxis]))
    .attr("r", 15)
    .attr("class","stateCircle")
    .attr('stroke-width',"0px");// hides the circle highlight from css that is shown on mouseover

  var stateText = chartGroup.selectAll("text")
    .exit()
    .data(censusData)
    .enter()
    .append("text")
    .text(d => d.abbr)
    .attr("x", d => xLinearScale(d[chosenXAxis]))
    .attr("y", d => yLinearScale(d[chosenYAxis])+3)
    .attr("class","stateText");
  
  circlesGroup = updateToolTip(chosenXAxis, chosenYAxis,circlesGroup);
  
  // Create group for x-axis labels
  var labelsGroup = chartGroup.append("g")
    .attr("transform", `translate(${width / 2}, ${height + 20})`);

  var povertyLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 20)
    .attr("class","aText")
    .attr("value", "poverty") // value to grab for event listener
    .classed("active", true)
    .text("In Poverty (%)");

  var ageLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 40)
    .attr("class","aText")
    .attr("value", "age") // value to grab for event listener
    .classed("inactive", true)
    .text("Age (Median)");

  var incomeLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 60)
    .attr("class","aText")
    .attr("value", "income") // value to grab for event listener
    .classed("inactive", true)
    .text("Income (Median)");

 // Create group for y-axis labels
  
  var ylabelsGroup = chartGroup.append("g");

  var healthcareLabel = ylabelsGroup.append("text")
    .attr("transform", `translate(-40,${height / 2})rotate(-90)`)
    .attr("dy", "1em")
    .attr("class","aText")
    .classed("axis-text", true)
    .attr("value", "healthcare") // value to grab for event listener
    .classed("active", true)
    .text("Lack of Healthcare (%)");

  var smokesLabel = ylabelsGroup.append("text")
    .attr("transform", `translate(-60,${height / 2})rotate(-90)`)
    .attr("dy", "1em")
    .attr("class","aText")
    .attr("value", "smokes") // value to grab for event listener
    .classed("inactive", true)
    .text("Smokes (%)");

  var obesityLabel = ylabelsGroup.append("text")
    .attr("transform", `translate(-80,${height / 2})rotate(-90)`)
    .attr("dy", "1em")
    .attr("class","aText")
    .attr("value", "obesity") // value to grab for event listener
    .classed("inactive", true)
    .text("Obesity (%)");

  // x axis labels event listener
  labelsGroup.selectAll(".aText")
    .on("click", function() {
      // get value of selection
      var value = d3.select(this).attr("value");
      if (value !== chosenXAxis) {

        // replaces chosenXAxis with value
        chosenXAxis = value;

        //console.log(chosenXAxis)

        // functions here found above csv import
        // updates x scale for new data
        xLinearScale = xScale(censusData, chosenXAxis);
        // updates y scale for new data
        yLinearScale = yScale(censusData, chosenYAxis);


        // updates x axis with transition
        xAxis = renderXAxes(xLinearScale, xAxis);

        // updates circles with new x values
        circlesGroup = renderCircles(circlesGroup, xLinearScale,yLinearScale,chosenXAxis,chosenYAxis);
        stateText = renderText(stateText, xLinearScale,yLinearScale,chosenXAxis,chosenYAxis);

        // updates tooltips with new info
        circlesGroup = updateToolTip(chosenXAxis, chosenYAxis,circlesGroup);

        // changes classes to change bold text
        if (chosenXAxis === "poverty")
        {
         ageLabel
           .classed("active", false)
           .classed("inactive", true);
         povertyLabel
           .classed("active", true)
           .classed("inactive", false);
         incomeLabel
           .classed("active", false)
           .classed("inactive", true);
         
       }
        else if (chosenXAxis === "age") {
          ageLabel
            .classed("active", true)
            .classed("inactive", false);
          povertyLabel
            .classed("active", false)
            .classed("inactive", true);
          incomeLabel
            .classed("active", false)
            .classed("inactive", true);
            
        }else {
          ageLabel
            .classed("active", false)
            .classed("inactive", true);
          povertyLabel
            .classed("active", false)
            .classed("inactive", true);
          incomeLabel
            .classed("active", true)
            .classed("inactive", false);
          
        }

      }
    });

  // y axis labels event listener
  ylabelsGroup.selectAll(".aText")
    .on("click", function() {
      var value = d3.select(this).attr("value");
      if (value !== chosenYAxis) {

     // replaces chosenYAxis with value
      chosenYAxis = value;

      //console.log(chosenYAxis)

     // functions here found above csv import
     // updates x scale for new data
     xLinearScale = xScale(censusData, chosenXAxis);
     // updates y scale for new data
     yLinearScale = yScale(censusData, chosenYAxis);
     // updates Y axis with transition
     yAxis = renderYAxes(yLinearScale, yAxis);

     // updates circles with new x values
     circlesGroup = renderCircles(circlesGroup, xLinearScale,yLinearScale,chosenXAxis,chosenYAxis);
     stateText = renderText(stateText, xLinearScale,yLinearScale,chosenXAxis,chosenYAxis);

     // updates tooltips with new info
     circlesGroup = updateToolTip(chosenXAxis, chosenYAxis,circlesGroup);

       
     if (chosenYAxis === "healthcare") {
      healthcareLabel
        .classed("active", true)
        .classed("inactive", false);
      smokesLabel
        .classed("active", false)
        .classed("inactive", true);
      obesityLabel
        .classed("active", false)
        .classed("inactive", true);
    
      }
      else if (chosenYAxis === "smokes")
     {
      healthcareLabel
        .classed("active", false)
        .classed("inactive", true);
      smokesLabel
        .classed("active", true)
        .classed("inactive", false);
      obesityLabel
        .classed("active", false)
        .classed("inactive", true);
      } else {
      healthcareLabel
        .classed("active", false)
        .classed("inactive", true);
      smokesLabel
        .classed("active", false)
        .classed("inactive", true);
      obesityLabel
        .classed("active", true)
        .classed("inactive", false);   
       }
    }
  });
}).catch(function(error) {
  console.log(error);
});
