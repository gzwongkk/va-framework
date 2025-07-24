import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Props {
  playAnimation: boolean;
}

export default function D3BarComposition({ playAnimation }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dataMaxX = 26;
  const dataMaxY = 100;

  useEffect(() => {
    const svg = d3.select(svgRef.current!);
    const svgNode = svg.node() as SVGSVGElement;
    const rect = svgNode.getBoundingClientRect();
    const svgHeight = rect.height;
    const svgWidth = rect.width;
    const svgMargin = { top: 40, right: 30, bottom: 30, left: 30 };

    const y = d3
      .scaleLinear()
      .domain([0, dataMaxY])
      .nice()
      .range([svgHeight - svgMargin.bottom, svgMargin.top]);
    const x = d3
      .scaleBand<string>()
      .range([svgMargin.left, svgWidth - svgMargin.right])
      .padding(0.1);

    const barChartAxisX = svg.append('g');
    const barChartContainer = svg.append('g');

    function generateData() {
      const data: { name: string; value: number }[] = [];
      const numCols = Math.random() * dataMaxX;
      for (let i = 0; i < numCols; i++) {
        data.push({
          name: String.fromCharCode(97 + i),
          value: Math.floor(Math.random() * dataMaxY),
        });
      }
      return data;
    }

    function render(data: { name: string; value: number }[]) {
      x.domain(data.map((d) => d.name));
      const xAxis = (g: d3.Selection<SVGGElement, unknown, null, undefined>) =>
        g
          .attr('transform', `translate(0,${svgHeight - svgMargin.bottom})`)
          .call(d3.axisBottom(x).tickSizeOuter(0));
      barChartAxisX.call(xAxis);

      const rects = barChartContainer.selectAll('rect') as d3.Selection<
        SVGRectElement,
        { name: string; value: number },
        SVGGElement,
        unknown
      >;
      rects
        .data(data, (d: any) => d.name)
        .join(
          (enter) =>
            enter
              .append('rect')
              .attr('fill', '#7d5bb2')
              .attr('y', (d) => y(d.value))
              .attr('height', (d) => y(0) - y(d.value))
              .attr('width', x.bandwidth())
              .attr('x', (d) => x(d.name) || 0),
          (update) =>
            update
              .transition()
              .duration(1000)
              .attr('y', (d) => y(d.value))
              .attr('height', (d) => y(0) - y(d.value))
              .attr('width', x.bandwidth())
              .attr('x', (d) => x(d.name) || 0),
          (exit) => exit.remove()
        );
    }

    let interval: number | undefined;
    function setChanges() {
      render(generateData());
      interval = window.setInterval(() => {
        render(generateData());
      }, 2000);
    }
    function clearChanges() {
      if (interval) clearInterval(interval);
    }

    if (playAnimation) setChanges();
    return () => {
      clearChanges();
    };
  }, [playAnimation]);

  return <svg id="d3-bar-composition" ref={svgRef} height="100%" width="100%" />;
}
