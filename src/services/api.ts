import type { ApiResponse, SpreadsheetData } from '../types/spreadsheet';

// Sample data as provided in the task description
const sampleData: ApiResponse = {
  Values: {
    columns: [
      {
        name: "product",
        key: "product",
        type: "text"
      },
      {
        name: "2020",
        key: "2020",
        type: "number"
      },
      {
        name: "2021",
        key: "2021",
        type: "number"
      },
      {
        name: "2022",
        key: "2022",
        type: "number"
      },
      {
        name: "2023",
        key: "2023",
        type: "number"
      }
    ],
    items: [
      {
        "2020": 5118724.62743667,
        "2021": 2630672.1336451983,
        "2022": 4900641.343221119,
        "2023": 3051708.3179565365,
        "product": "Insight Advisory"
      },
      {
        "2020": 10053102.32082951,
        "2021": 20638163.620427437,
        "2022": 20133558.987846997,
        "2023": 20576136.452683046,
        "product": "OperateX Staffing"
      },
      {
        "2020": 0,
        "2021": 0,
        "2022": 678556.9921597196,
        "2023": 506001.15826520027,
        "product": "CoreSoft Suite"
      },
      {
        "2020": 13876989.775956148,
        "2021": 16360671.534438606,
        "2022": 19448201.024976257,
        "2023": 19218437.057206184,
        "product": "FieldSite On-Prem Services"
      },
      {
        "2020": 12233532.379434094,
        "2021": 10115364.823988268,
        "2022": 14503107.40902886,
        "2023": 13182486.29123322,
        "product": "Helix Maintenance Plans"
      },
      {
        "2020": 30384105.28587226,
        "2021": 41297016.83377707,
        "2022": 57360069.46447201,
        "2023": 38995139.87679954,
        "product": "OperateX Fulfillment"
      },
      {
        "2020": 5037561.922214865,
        "2021": 5579417.41215921,
        "2022": 9373189.793116327,
        "2023": 4486361.521766473,
        "product": "DeliverIT Solutions"
      },
      {
        "2020": 16919566.39171467,
        "2021": 19063973.774449944,
        "2022": 15491301.85611407,
        "2023": 13319315.352194766,
        "product": "Apex ERP Suite"
      },
      {
        "2020": 0,
        "2021": 0,
        "2022": 0,
        "2023": 570575.2985677817,
        "product": "VoxTelecom"
      },
      {
        "2020": 3525691.9490874563,
        "2021": 3654516.208253259,
        "2022": 4528497.993171154,
        "2023": 4542748.243571376,
        "product": "StreamMedia Solutions"
      },
      {
        "2020": 7516404.430851912,
        "2021": 5087514.96625654,
        "2022": 6069512.059807597,
        "2023": 11152557.277514499,
        "product": "Skyline Remote Monitoring"
      },
      {
        "2020": 104665679.08339758,
        "2021": 124427311.30739553,
        "2022": 152486636.9239141,
        "2023": 129601466.84775862,
        "product": "Total"
      }
    ]
  }
};

// Simulate API call with delay
export const fetchSpreadsheetData = async (): Promise<SpreadsheetData> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return sampleData.Values;
};

// Mock function for future API endpoint
export const saveSpreadsheetData = async (data: SpreadsheetData): Promise<boolean> => {
  // Simulate saving to backend
  await new Promise(resolve => setTimeout(resolve, 300));
  console.log('Data saved:', data);
  return true;
}; 