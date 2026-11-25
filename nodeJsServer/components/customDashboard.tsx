"use client";

import React, { useState, useEffect } from "react";
import GridLayout from "react-grid-layout";
//import { ChartClient } from "@/components/chart-client";
//import { WebSocketContext } from '@/components/contexts/WebSocketContext';
import { Select } from "@/components/inputs/select";
import { tempCoutriesWithSites } from "@/data/temp-coutries-sites";
import { SECTIONS } from "@/data/sections";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceArea, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export function CustomDashboard() {
  // The layout state
  const [layout, setLayout] = useState<any[]>([
    { 
      i: "chart-1", x: 0, y: 0, w: 2, h: 6,
      categoryName: "pc", 
      chartSettings: { label: "Age", type: "number", variableName: "age", variableType: "quantitative", aggregationType: "median" } 
    },
    { 
      i: "chart-2", x: 2, y: 0, w: 2, h: 6, 
      categoryName: "pc", 
      chartSettings: { label: "Gender", type: "stacked_bargraph", variableName: "gender", variableType: "categorical", aggregationType: "percentage" } 
    }
  ]);

  const [country, setCountry] = useState<string>("");
  const [site, setSite] = useState<string>("");
  const [siteOptions, setSiteOptions] = useState<any[]>([]);

  const [chartToAdd, setChartToAdd] = useState<string>("");

  const [dashboardFilters, setDashboardFilters] = useState({});

  const countryOptionsList = Object.keys(tempCoutriesWithSites).map(tCWS => ({ value: tCWS, label: tCWS }));
  const siteOptionsList = (Object.keys(tempCoutriesWithSites) as (keyof typeof tempCoutriesWithSites)[]).reduce((acc, current) => {
      acc[current] = tempCoutriesWithSites[current].map(tCWS => ({ value: tCWS, label: tCWS }));
      return acc;
  }, {} as Record<string, any[]>);

  const handleCountryChange = (newCountry: string) => {
      setCountry(newCountry);
      setSite(""); // Reset site when country changes
      setSiteOptions(siteOptionsList[newCountry] || []);
  };

  const handleSiteChange = (newSite: string) => {
      setSite(newSite);
  };

  const handleApplyFilters = () => {
    let newFilters: any = {};
    if (country) newFilters.country = country;
    if (country && site) newFilters.site = site;
    
    setDashboardFilters(newFilters);
  };

  const handleLayoutChange = (newLayout: any) => {
    // Merge the new X/Y/W/H coordinates from the library 
    // with the custom data (categoryName, chartSettings) we already have in state!
    const mergedLayout = newLayout.map((newBox: any) => {
      const existingBox = layout.find((l) => l.i === newBox.i);
      return { ...existingBox, ...newBox };
    });
    
    setLayout(mergedLayout);
  };

  // Flatten the SECTIONS data into a list of options for the dropdown
  const availableCharts = SECTIONS.flatMap(section => 
    section.charts
      .filter(chart => chart.variableName && chart.variableName.trim() !== "")
      .map(chart => ({
        value: chart.variableName, // We use variableName as the unique ID
        label: chart.label,
        categoryName: section.categoryName,
        chartSettings: chart
      }))
  );

  const getNextX = (currentLayout: any[]) => {
    let leftBottom = 0;
    let rightBottom = 0;

    currentLayout.forEach(item => {
      const bottom = (item.y ?? 0) + (item.h ?? 4);
      if (item.x < 2) leftBottom = Math.max(leftBottom, bottom);
      if (item.x + item.w > 2) rightBottom = Math.max(rightBottom, bottom);
    });

    // Left side if it's shorter or tied (like right below a full-width box)
    return leftBottom <= rightBottom ? 0 : 2;
  };

  const handleAddBox = () => {
    if (!chartToAdd) return;

    const selectedChartData = availableCharts.find(c => c.value === chartToAdd)
    if (!selectedChartData) return;

    const newId = `new-box-${Date.now()}`; // Creates a unique ID
    
    const newBox = {
      i: newId, 
      x: getNextX(layout), 
      y: Infinity, 
      w: 2, h: 6,
      categoryName: selectedChartData.categoryName,
      chartSettings: selectedChartData.chartSettings
    };

    setLayout([...layout, newBox]);
  };

  const handleCompare = (baseline: [string, string], anomaly: [string, string]) => {
    const newId = `comparison-${Date.now()}`;
    
    const newBox = {
      i: newId, 
      x: getNextX(layout), 
      y: Infinity, 
      w: 2, h: 6,
      isComparison: true, // A flag so we know this isn't a standard chart
      baseline: baseline,
      anomaly: anomaly
    };

    setLayout([...layout, newBox]);
  };

  const handleAddChartByLabel = (variableName: string) => {
  // Finds the matching chart and its parent section in SECTIONS
  let foundCategory = "";
  let foundChartSettings = null;

  for (const section of SECTIONS) {
    const match = section.charts.find(c => c.variableName === variableName);
    if (match) {
      foundCategory = section.categoryName;
      foundChartSettings = match;
      break;
    }
  }

  if (!foundChartSettings) return;

  // Create a new grid box for this chart
  const newChartBox = {
    i: `chart-${foundChartSettings.variableName}-${Date.now()}`,
    x: getNextX(layout),
    y: Infinity,
    w: 2,
    h: 6,
    categoryName: foundCategory,
    chartSettings: foundChartSettings,
  };

  setLayout(prev => [...prev, newChartBox]);
  };

  // Filters out the box you clicked and updates the layout
  const handleRemoveBox = (idToRemove: string) => {
    const updatedLayout = layout.filter((item) => item.i !== idToRemove);
    setLayout(updatedLayout);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="sticky top-20 z-40 mb-4 flex items-center justify-between w-full bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-4 flex-1">
          <span className="text-blue-600 font-bold">Filters:</span>
          
          <div className="w-[200px]">
            <Select 
              value={country} 
              onChange={handleCountryChange} 
              onChangeHandleValueChange={true} 
              placeholder="All countries" 
              options={countryOptionsList} 
            />
          </div>
          
          <div className="w-[200px]">
            <Select 
              value={site} 
              onChange={handleSiteChange} 
              onChangeHandleValueChange={true} 
              placeholder="All hospitals" 
              options={siteOptions} 
            />
          </div>

          <button
            onClick={handleApplyFilters}
            className="rounded bg-gray-800 px-4 py-2 text-sm font-bold text-white hover:bg-gray-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>

        <div className="flex items-center gap-2 border-l pl-4 ml-4 border-gray-300">
          <select 
            className="border border-gray-300 rounded p-2 text-sm"
            value={chartToAdd}
            onChange={(e) => setChartToAdd(e.target.value)}
          >
            <option value="">Select a chart to add...</option>
            {availableCharts.map((chart) => (
              <option key={chart.value} value={chart.value}>
                {chart.label}
              </option>
            ))}
          </select>
          
          <button
            onClick={handleAddBox}
            disabled={!chartToAdd}
            className={`rounded px-4 py-2 font-bold text-white transition-colors ${
              chartToAdd ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            + Add Box
          </button>
        </div>
      </div>
      
      <div className="w-full p-4">
        <GridLayout
          className="layout"
          layout={layout}
          width={1200}
          onLayoutChange={handleLayoutChange}
          gridConfig={{
            cols: 4,
            rowHeight: 50
          }}
          dragConfig={{
            handle: ".drag-handle"
          }}
        >
          {/* 
            Instead of typing out every box manually, we MAP over the layout list.
            Now, every time you add a new item to 'layout', a new box appears!
          */}
          {layout.map((item) => (
            <div key={item.i} className="flex flex-col h-full overflow-hidden rounded border bg-blue-50 shadow-sm">
              <div className="drag-handle flex items-center justify-between cursor-move bg-blue-200 p-2 text-sm font-semibold">
                <span className="truncate pr-2">
                  {item.isComparison
                    ? `Compare: ${item.baseline[0]}–${item.baseline[1]} vs ${item.anomaly[0]}–${item.anomaly[1]}`
                    : item.chartSettings?.label || `Box ID: ${item.i}`}
                </span>

                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => handleRemoveBox(item.i)}
                  className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600 transition-colors shrink-0"
                >
                  X
                </button>
              </div>

              <div className="flex-1 p-4 overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
                {item.isComparison ? (
                  
                  <ComparisonTable 
                    baseline={item.baseline} 
                    anomaly={item.anomaly} 
                    filters={dashboardFilters}
                    onVariableClick={handleAddChartByLabel}
                  />

                ) :
                item.chartSettings ? (
                  <BrushingChart 
                    categoryName={item.categoryName} 
                    chartSettings={item.chartSettings}
                    filters={dashboardFilters}

                    onCompare={handleCompare}
                  />
                ) : (
                  <p>Content for {item.i} goes here...</p>
                )}
              </div>
            </div>
          ))}
        </GridLayout>
      </div>
    </div>
  );
}

// Define the props so the dashboard can tell it what to fetch
interface BrushingChartProps {
  categoryName: string;
  chartSettings: any;
  filters: any;
  onCompare?: (baseline: [string, string], anomaly: [string, string]) => void;
}

export function BrushingChart({ categoryName, chartSettings, filters, onCompare }: BrushingChartProps){
  const [refAreaLeft, setRefAreaLeft] = useState<string | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<string | null>(null);

  const [baseline, setBaseline] = useState<[string, string] | null>(null);
  const [anomaly, setAnomaly] = useState<[string, string] | null>(null);

  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const COLORS = ["#8884d8", "#ff7300", "#10b981", "#f02e2e", "#f59e0b", "#3b82f6", "#ec4899"];
  const [seriesKeys, setSeriesKeys] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ? process.env.NEXT_PUBLIC_BASE_PATH.toLowerCase() : "";
      
      try {
        const response = await fetch(
          `${basePath}/api/data/${categoryName.toLowerCase()}/${chartSettings.variableName.toLowerCase()}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              aggregationType: chartSettings.aggregationType, 
              variableType: chartSettings.variableType, 
              filters: filters
            }),
          }
        );

        if (response.ok) {
        const jsonResponse = await response.json();

        const hospitalDatasets = filters?.site
          ? jsonResponse.datasets.filter((dt: any) => dt.label?.includes("Hospital"))
          : [];

        const targetDatasets = hospitalDatasets.length > 0 ? hospitalDatasets : jsonResponse.datasets;

        // Clean up labels: "Country: Celestria - ischemic" -> "ischemic"
        /*const cleanLabel = (rawLabel: string | undefined, idx: number) => {
          if (!rawLabel) return `Series ${idx + 1}`;
          const parts = rawLabel.split(" - ");
          return parts.length > 1 ? parts[parts.length - 1] : rawLabel;
        };*/

        const keys = targetDatasets.map((dt: any, idx: number) => dt.label || `Series ${idx + 1}`);
        setSeriesKeys(keys);

        const allRows = jsonResponse.labels.map((label: string, index: number) => {
          const row: Record<string, any> = { YQ: label };
          let hasData = false;

          targetDatasets.forEach((dt: any, idx: number) => {
            const key = keys[idx];
            const rawValue = dt.data[index];
            if (rawValue !== null && rawValue !== undefined && !isNaN(rawValue)) {
              row[key] = rawValue;
              hasData = true;
            } else {
              row[key] = null;
            }
          });

          return { row, hasData };
        });

        const firstIndex = allRows.findIndex((item: any) => item.hasData);
        let lastIndex = -1;
        for (let i = allRows.length - 1; i >= 0; i--) {
          if (allRows[i].hasData) {
            lastIndex = i;
            break;
          }
        }

        const rechartsFormattedData =
          firstIndex === -1
            ? []
            : allRows.slice(firstIndex, lastIndex + 1).map((item: any) => item.row);

        setChartData(rechartsFormattedData)
      }

      } catch (error) {
        console.error("Error fetching chart data", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (chartSettings?.variableName) {
      fetchData();
    }
  }, [categoryName, chartSettings, filters]);

  interface ChartEvent {
    activeLabel?: string;
  }

  // Capture the starting point of the drag
  const handleMouseDown = (e: ChartEvent) => {
    if (e?.activeLabel) setRefAreaLeft(e.activeLabel);
  };

  // Capture the current point while dragging
  const handleMouseMove = (e: ChartEvent) => {
    if (refAreaLeft && e?.activeLabel) {
      setRefAreaRight(e.activeLabel);
    }
  };

  // The selection when the mouse is released
  const handleMouseUp = () => {
    if (refAreaLeft && refAreaRight) {
      const leftIdx = chartData.findIndex((d) => d.YQ === refAreaLeft);
      const rightIdx = chartData.findIndex((d) => d.YQ === refAreaRight);

      // Ensure [start, end] is always in chronological order
      const [start, end]: [string, string] =
        leftIdx <= rightIdx
          ? [refAreaLeft, refAreaRight]
          : [refAreaRight, refAreaLeft];

      console.log(`User brushed from ${start} to ${end}`)

      if(!baseline){
        setBaseline([start, end]);
      }else if (!anomaly){
        const newAnomaly: [string, string] = [start, end];
        setAnomaly(newAnomaly);

        if(onCompare){
          onCompare(baseline, newAnomaly)
        }
      }
    }

    // Uncomment the lines below to clear the box after releasing the mouse
      setRefAreaLeft(null);
      setRefAreaRight(null);
  };

  // A quick way for the user to start over if they messed up
  const handleResetBrush = () => {
    setBaseline(null);
    setAnomaly(null);
  };

  return (
    // userSelect: 'none' prevents accidental text highlighting while dragging
    <div className="flex flex-col" style={{ userSelect: 'none', width: '100%', height: '100%' }}> 
      <div className="flex justify-between items-center mb-2 px-2">
        <h3 className="text-center text-lg font-bold text-gray-700 mb-2">
        {chartSettings?.label || "Loading..."}
        </h3>

        {/* Step-by-step instructions badge */}
        {baseline && !anomaly && (
          <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded animate-pulse">
            Baseline set! Brush a second range to compare.
          </span>
        )}
        {(baseline || anomaly) && (
          <button onClick={handleResetBrush} className="text-xs text-red-500 hover:underline font-semibold">
            Reset Brush
          </button>
        )}
      </div>

      <div className="flex-1 w-full min-h-0 relative">
        {isLoading ? (
           <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
             <span className="font-semibold text-gray-500">Loading data...</span>
           </div>
           ) : chartData.length === 0 ? (
           <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
             <span className="font-semibold text-orange-500">Please select a hospital to view data.</span>
           </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%"> 
            <LineChart
              data={chartData}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="YQ" />
              <YAxis />
              <Tooltip
                formatter={(value: any) =>
                  typeof value === "number" ? Number(value.toFixed(3)) : value
                }
                wrapperStyle={{ zIndex: 50 }}
              />
              <Legend />
              {seriesKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls={false}
                />
              ))}
              
              {/* Active Drag Box (Gray) */}
              {refAreaLeft && refAreaRight && (
                <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="#9ca3af" fillOpacity={0.3} />
              )}
               
              {/* The Locked Baseline Box (Blue) */}
              {baseline && (
                <ReferenceArea x1={baseline[0]} x2={baseline[1]} strokeOpacity={0.8} fill="#3b82f6" fillOpacity={0.2} />
              )}

              {/* The Locked Anomaly Box (Red) */}
              {anomaly && (
                <ReferenceArea x1={anomaly[0]} x2={anomaly[1]} strokeOpacity={0.8} fill="#ef4444" fillOpacity={0.2} />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

interface ComparisonTableProps {
  baseline: [string, string];
  anomaly: [string, string];
  filters: any;
  onVariableClick?: (variableName: string) => void;
}

export function ComparisonTable({ baseline, anomaly, filters, onVariableClick }: ComparisonTableProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchComparisonData = async () => {
      setIsLoading(true);
        try {
        // Grab all supported variables from SECTIONS (skipping empty variableNames)
        const allTestableCharts = SECTIONS
          .filter(section => section.categoryName !== "angel_awards") // Angel Awards are computed thresholds, not raw CSV columns
          .flatMap(section => section.charts)
          .filter(chart => 
            chart.variableName && 
            chart.variableName.trim() !== "" &&
            ["quantitative", "categorical", "categorical_binary"].includes(chart.variableType)
          );

        // Deduplicate by variableName so each column is only tested once
        const uniqueVariables = Array.from(
          new Map(allTestableCharts.map(item => [item.variableName.toLowerCase(), item])).values()
        ).map(chart => ({
          label: chart.label,
          variableName: chart.variableName,
          variableType: chart.variableType
        }));

        // Send them along with the dates and filters
        const payload = {
          baseline: baseline,
          anomaly: anomaly,
          filters: filters,
          variablesToTest: uniqueVariables
        };

        const basePath = process.env.NEXT_PUBLIC_BASE_PATH 
            ? process.env.NEXT_PUBLIC_BASE_PATH.toLowerCase() 
            : "";

        const response = await fetch(`${basePath}/api/data/compare`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const resultData = await response.json();
        setData(resultData);

      } catch (error) {
        console.error("Failed to fetch comparison data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComparisonData();
  }, [baseline, anomaly, filters]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-gray-500 font-semibold">Running statistical analysis...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-red-600">Anomaly Drill-Down</h3>
        <div className="text-sm text-gray-600 space-x-4">
          <span><strong>Baseline:</strong> {baseline[0]} - {baseline[1]}</span>
          <span><strong>Spike:</strong> {anomaly[0]} - {anomaly[1]}</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="p-2 border-b">Variable</th>
              <th className="p-2 border-b">P-Value</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr 
                key={i} 
                onClick={() => onVariableClick?.(row.variableName)}
                className="border-b hover:bg-blue-50 cursor-pointer transition-colors"
                title="Click to open chart"
              >
                <td className="p-2 font-medium text-blue-700 hover:underline">
                  {row.variable}
                </td>
                <td className={`p-2 font-bold ${row.pValue < 0.05 ? 'text-green-600' : 'text-gray-500'}`}>
                  {row.pValue.toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}