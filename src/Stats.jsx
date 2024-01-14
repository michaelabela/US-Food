import * as d3 from "d3";
import { useEffect, useRef } from "react";
import "./App.css";
import PropTypes from "prop-types";

const Stats = ({ data }) => {
  const barChartRef = useRef();
  const pieChartRef = useRef();
  const pieChartRef2 = useRef();

  useEffect(() => {
    if (data) {
      const barMargin = { top: 20, right: 20, bottom: 30, left: 50 };
      const barWidth = 400 - barMargin.left - barMargin.right;
      const barHeight = 300 - barMargin.top - barMargin.bottom;

      const svg = d3.select(barChartRef.current);
      svg.selectAll("*").remove();

      const fieldstoInclude = [
        "kcal_consumed_fruit",
        "kcal_consumed_grain",
        "kcal_consumed_nuts",
        "kcal_consumed_potatoes",
        "kcal_consumed_vegetables",
      ]; // Add the extra field you want to exclude
      const filteredData = Object.fromEntries(
        Object.entries(data).filter(([key]) => fieldstoInclude.includes(key))
      );

      const dataArray = Object.entries(filteredData).map(([label, value]) => ({
        label,
        value,
      }));

      const sortedData = dataArray.sort((a, b) => b.value - a.value);

      const x = d3.scaleBand().range([0, barWidth]).padding(0.1);
      const y = d3.scaleLinear().range([barHeight, 0]);

      const barColorScale = d3
        .scaleOrdinal()
        .domain([
          "kcal_consumed_fruit",
          "kcal_consumed_grain",
          "kcal_consumed_nuts",
          "kcal_consumed_potatoes",
          "kcal_consumed_vegetables",
        ])
        .range(["#8B496E", "#E3D37C", "#D98A5D", "#BD4044", "#1a5441"]);

      const g = svg
        .append("g")
        .attr("transform", `translate(${barMargin.left},${barMargin.top})`);

      x.domain(sortedData.map((d, i) => i)); // Use the index as the domain for x
      y.domain([0, d3.max(sortedData, (d) => d.value)]);

      g.selectAll(".bar")
        .data(sortedData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d, i) => x(i))
        .attr("y", (d) => y(d.value))
        .attr("width", x.bandwidth())
        .attr("height", (d) => barHeight - y(d.value))
        .attr("fill", (d) => barColorScale(d.label));

      // Custom x-axis tick format
      const labelMappings = {
        kcal_consumed_fruit: "Fruits",
        kcal_consumed_grain: "Grains",
        kcal_consumed_nuts: "Nuts",
        kcal_consumed_potatoes: "Potatoes",
        kcal_consumed_vegetables: "Vegetables",
      };

      g.append("g")
        .attr("transform", `translate(0,${barHeight})`)
        .call(
          d3
            .axisBottom(x)
            .tickFormat(
              (i) => labelMappings[sortedData[i].label] || sortedData[i].label
            )
        ); // Use labelMappings to replace x-axis labels

      g.append("g").call(d3.axisLeft(y));

      g.append("text")
        .attr("text-anchor", "end")
        .attr("y", -35)
        .attr("transform", "rotate(-90)")
        .style("font-size", "10px") // Set the font size here
        .text("KCal / person / day");

      // Pie chart
      const raceFields = ["pct_black", "pct_hispanic_latino", "pct_white"];

      const pieSvg = d3.select(pieChartRef.current);
      pieSvg.selectAll("*").remove();

      const pie1Margin = { top: 0, right: 20, bottom: 0, left: 50 };
      const pie1Width = 300 - pie1Margin.left - pie1Margin.right;
      const pie1Height = 150 - pie1Margin.top - pie1Margin.bottom;

      const pie = d3.pie().value((d) => data[d] || 0);
      const arc = d3
        .arc()
        .innerRadius(0)
        .outerRadius(Math.min(pie1Width, pie1Height) / 2);

      const pieG = pieSvg
        .append("g")
        .attr(
          "transform",
          `translate(${pie1Width / 2},${pie1Height / 2 + 20})`
        );

      const pieColorScale = d3
        .scaleOrdinal()
        .domain(["pct_black", "pct_hispanic_latino", "pct_white"])
        .range(["#222836", "#8B496E", "#639CA1"]);

      const arcs = pieG
        .selectAll("path")
        .data(pie(raceFields))
        .enter()
        .append("g")
        .attr("class", "arc");

      arcs
        .append("path")
        .attr("d", arc)
        .attr("fill", (d) => pieColorScale(d.data));

      arcs
        .append("text")
        .attr("transform", (d) => {
          const [x, y] = arc.centroid(d);
          const radius = Math.min(pie1Width, pie1Height) / 2;
          const labelRadius = radius + 16 + d.value; // Adjust the label distance
          const angle = Math.atan2(y, x);
          const labelX = labelRadius * Math.cos(angle);
          const labelY = labelRadius * Math.sin(angle);
          return `translate(${labelX},${labelY})`;
        })
        .attr("dy", ".35em")
        .style("text-anchor", "middle")
        .text((d) => `${Number(d.value * 100).toFixed(2)}%`)
        .style("font-size", "12px");

      var legendG = pieSvg
        .selectAll(".legend") // note appending it to mySvg and not svg to make positioning easier
        .data(pie(raceFields))
        .enter()
        .append("g")
        .attr("transform", function (d, i) {
          return "translate(" + pie1Width + "," + (i * 15 + 20) + ")"; // place each legend on the right and bump each one down 15 pixels
        })
        .attr("class", "legend");

      legendG
        .append("rect") // make a matching color rect
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", function (d, i) {
          return pieColorScale(i);
        });

      const raceDict = {
        pct_white: "White",
        pct_black: "Black",
        pct_hispanic_latino: "Hispanic / Latino",
      };

      legendG
        .append("text") // add the text
        .text(function (d) {
          return raceDict[d.data];
        })
        .style("font-size", 12)
        .attr("y", 10)
        .attr("x", 11);

      // Pie chart 2
      const incomeFields = ["pct_low_income", "pct_high_income"];

      const pieSvg2 = d3.select(pieChartRef2.current);
      pieSvg2.selectAll("*").remove();

      const pie2Margin = { top: 0, right: 20, bottom: 0, left: 50 };
      const pie2Width = 300 - pie2Margin.left - pie2Margin.right;
      const pie2Height = 150 - pie2Margin.top - pie2Margin.bottom;

      const pie2 = d3.pie().value((d) => data[d] || 0);
      const arc2 = d3
        .arc()
        .innerRadius(0)
        .outerRadius(Math.min(pie2Width, pie2Height) / 2);

      const pieG2 = pieSvg2
        .append("g")
        .attr(
          "transform",
          `translate(${pie2Width / 2},${pie2Height / 2 + 20})`
        );

      const pieColorScale2 = d3
        .scaleOrdinal()
        .domain(["pct_low_income", "pct_high_income"])
        .range(["#E3D37C", "#1A5441"]);

      const arcs2 = pieG2
        .selectAll("path")
        .data(pie2(incomeFields))
        .enter()
        .append("g")
        .attr("class", "arc");

      arcs2
        .append("path")
        .attr("d", arc2)
        .attr("fill", (d) => pieColorScale2(d.data));

      arcs2
        .append("text")
        .attr("transform", (d) => {
          const [x, y] = arc2.centroid(d);
          const radius = Math.min(pie2Width, pie2Height) / 2;
          const labelRadius = radius + 18; // Adjust the label distance
          const angle = Math.atan2(y, x);
          const labelX = labelRadius * Math.cos(angle);
          const labelY = labelRadius * Math.sin(angle);
          return `translate(${labelX},${labelY})`;
        })
        .attr("dy", ".35em")
        .style("text-anchor", "middle")
        .text((d) => `${Number(d.value * 100).toFixed(2)}%`)
        .style("font-size", "12px");

      var legendG2 = pieSvg2
        .selectAll(".legend2") // note appending it to mySvg and not svg to make positioning easier
        .data(pie2(incomeFields))
        .enter()
        .append("g")
        .attr("transform", function (d, i) {
          return "translate(" + pie2Width + "," + (i * 15 + 20) + ")"; // place each legend on the right and bump each one down 15 pixels
        })
        .attr("class", "legend2");

      legendG2
        .append("rect") // make a matching color rect
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", function (d, i) {
          return pieColorScale2(i);
        });

      const incomeDict = {
        pct_low_income: "Low Income",
        pct_high_income: "High Income",
      };

      legendG2
        .append("text") // add the text
        .text(function (d) {
          return incomeDict[d.data];
        })
        .style("font-size", 12)
        .attr("y", 10)
        .attr("x", 11);
    }
  }, [data]);

  return (
    <div className="charts">
      {data ? (
        <div>
          <h3>{data.geographic_area_name}</h3>
          <h4>Food Sources:</h4>
          <svg width={400} height={300} id="barchart" ref={barChartRef} />
          <h4 style={{ marginBottom: "10px" }}>Racial Demographics:</h4>
          <svg width={400} height={200} id="piechart" ref={pieChartRef} />
          <h4 style={{ marginBottom: "10px" }}>Income Disparity:</h4>
          <svg width={400} height={300} id="piechart" ref={pieChartRef2} />
        </div>
      ) : (
        <div className="label starter-text">
          <i>Hover over a county to view its stats</i>
        </div>
      )}
    </div>
  );
};

export default Stats;

Stats.propTypes = {
  data: PropTypes.object, // Change object to the expected type of clickedCounty
};
