declare module 'vite' {
    export function defineConfig(config: any): any;
}

declare module '@vitejs/plugin-react' {
    const plugin: any;
    export default plugin;
}

// Allow importing CSS/asset modules in TypeScript during build
declare module '*.css';
declare module '*.svg';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';

// chart.js v4 type declarations
// The built-in types file (dist/types.d.ts) is missing from the installed package,
// so we provide ambient declarations for the exported members used in the project.
declare module 'chart.js' {
  import { Chart as ChartJS, ChartConfiguration, ChartType, DefaultDataPoint } from 'chart.js/dist/types/index';

  // Scale types
  export const CategoryScale: any;
  export const LinearScale: any;
  export const TimeScale: any;
  export const LogarithmicScale: any;

  // Controller types
  export const BarController: any;
  export const LineController: any;
  export const DoughnutController: any;
  export const PieController: any;

  // Element types
  export const BarElement: any;
  export const LineElement: any;
  export const PointElement: any;
  export const ArcElement: any;

  // Plugin types
  export const Title: any;
  export const Tooltip: any;
  export const Legend: any;
  export const Filler: any;

  // The Chart class
  export class Chart {
    static register(...items: any[]): void;
    constructor(context: any, config: any);
    destroy(): void;
    update(mode?: any): void;
    resize(): void;
    data: any;
    options: any;
    canvas: any;
    ctx: any;
    id: number;
  }

  // Type helpers (generics needed for actual usage like ChartData<'bar'>)
  export interface ChartData<TType extends string = string, TData = DefaultDataPoint<TType>, TLabel = unknown> {
    labels?: TLabel[];
    datasets?: any[];
  }
  export interface ChartOptions<TType extends string = string> {
    responsive?: boolean;
    maintainAspectRatio?: boolean;
    plugins?: any;
    scales?: any;
    animation?: any;
    transitions?: any;
  }
  export type ChartType = any;
  export type DefaultDataPoint<T> = any;
  export type ScriptableContext<T> = any;
  export type ScriptableLineSegmentContext = any;
}

// jspdf type declaration
declare module 'jspdf' {
  class jsPDF {
    constructor(orientation?: string | { orientation?: string; unit?: string; format?: string; compress?: boolean }, unit?: string, format?: string, compressPdf?: boolean);
    internal: any;
    text(text: string, x: number, y: number, options?: any): jsPDF;
    addPage(format?: string): jsPDF;
    save(filename: string): void;
    output(type: string, options?: any): any;
    setFontSize(size: number): jsPDF;
    setFont(faceName: string, style?: string): jsPDF;
    addFont(url: string, fontName: string, fontStyle: string): void;
    splitTextToSize(text: string, maxWidth: number): string[];
    getFontList(): any;
    getFontSize(): number;
    getNumberOfPages(): number;
    setLineWidth(width: number): jsPDF;
    setDrawColor(channel: number): jsPDF;
    setFillColor(channel: number): jsPDF;
    rect(x: number, y: number, w: number, h: number, style?: string): jsPDF;
    line(x1: number, y1: number, x2: number, y2: number): jsPDF;
    addImage(imageData: any, format: string, x: number, y: number, w: number, h: number, alias?: string, compression?: string, rotation?: number): jsPDF;
    getImageProperties(imageData: any): any;
    getTextWidth(text: string): number;
    getCharWidthsArray(text: string): number[];
    setTextColor(r: number, g: number, b: number): jsPDF;
    setDrawColor(r: number, g: number, b: number): jsPDF;
    setFillColor(r: number, g: number, b: number): jsPDF;
  }
  export default jsPDF;
  export as namespace jsPDF;
}
